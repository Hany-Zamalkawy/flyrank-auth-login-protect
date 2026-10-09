const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const cheerio = require('cheerio');
const { BookSchema } = require('./schema');
const { requestText } = require('./http');
const { extractRawBook } = require('./parser');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://books.toscrape.com/';
const CACHE_DIR = path.join(ROOT, 'cache');
const OUTPUT_DIR = path.join(ROOT, 'output');
const args = new Set(process.argv.slice(2));
const stats = {
  started_at: new Date().toISOString(),
  duration_ms: 0,
  catalogue_pages: 0,
  discovered_urls: 0,
  unique_urls: 0,
  detail_pages: 0,
  pages_fetched: 0,
  cache_hits: 0,
  valid_records: 0,
  invalid_records: 0,
  failed_pages: 0
};

function cacheNameForUrl(url) {
  return `${crypto.createHash('sha256').update(url).digest('hex')}.html`;
}

async function getHtml(url, cacheName) {
  const filePath = path.join(CACHE_DIR, cacheName || cacheNameForUrl(url));
  try {
    const body = await fs.readFile(filePath, 'utf8');
    stats.cache_hits += 1;
    console.log(`CACHE HIT ${url} bytes=${Buffer.byteLength(body)}`);
    return body;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const { status, body } = await requestText(url);
  if (status !== 200) throw new Error(`Unexpected status ${status} for ${url}`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, body, 'utf8');
  stats.pages_fetched += 1;
  console.log(`FETCH ${url} status=${status} bytes=${Buffer.byteLength(body)}`);
  return body;
}

function extractCatalogue(html, pageUrl) {
  const $ = cheerio.load(html);
  const urls = [];
  $('article.product_pod h3 a').each((_index, element) => {
    const href = $(element).attr('href');
    if (href) urls.push(new URL(href, pageUrl).href);
  });
  const nextHref = $('.next a').attr('href');
  return { urls, nextUrl: nextHref ? new URL(nextHref, pageUrl).href : null };
}

async function discoverBooks() {
  let pageUrl = BASE_URL;
  const discovered = [];
  const sourcePageByUrl = new Map();
  for (let pageNumber = 1; pageNumber <= 3; pageNumber += 1) {
    const html = await getHtml(pageUrl, `catalogue-page-${pageNumber}.html`);
    const result = extractCatalogue(html, pageUrl);
    stats.catalogue_pages += 1;
    for (const url of result.urls) {
      discovered.push(url);
      if (!sourcePageByUrl.has(url)) sourcePageByUrl.set(url, pageUrl);
    }
    if (pageNumber < 3) {
      if (!result.nextUrl) throw new Error(`Catalogue page ${pageNumber} has no next link; refusing to guess the next URL.`);
      pageUrl = result.nextUrl;
    }
  }
  stats.discovered_urls = discovered.length;
  const uniqueUrls = [...new Set(discovered)];
  stats.unique_urls = uniqueUrls.length;
  return { urls: uniqueUrls, sourcePageByUrl };
}

async function writeJson(filename, value) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUTPUT_DIR, filename), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main() {
  const started = Date.now();
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const { urls, sourcePageByUrl } = await discoverBooks();
  const workUrls = [...urls];
  if (args.has('--inject-fake-url')) workUrls.push('http://127.0.0.1:9/__deliberately_fake_book__.html');
  const recordsByUrl = new Map();
  const errors = [];

  for (const url of workUrls) {
    try {
      const html = await getHtml(url, cacheNameForUrl(url));
      stats.detail_pages += 1;
      const raw = extractRawBook(html, url, sourcePageByUrl.get(url) || BASE_URL);
      const parsed = BookSchema.safeParse(raw);
      if (!parsed.success) {
        stats.invalid_records += 1;
        errors.push({
          product_url: url,
          stage: 'validation',
          reason: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
        });
        continue;
      }
      recordsByUrl.set(parsed.data.product_url, parsed.data);
    } catch (error) {
      stats.failed_pages += 1;
      errors.push({ product_url: url, stage: 'fetch_or_extract', reason: error.message });
      console.error(`SKIP ${url} reason=${error.message}`);
    }
  }

  const books = [...recordsByUrl.values()].sort((a, b) => a.product_url.localeCompare(b.product_url));
  stats.valid_records = books.length;
  stats.duration_ms = Date.now() - started;
  const report = {
    ...stats,
    finished_at: new Date().toISOString(),
    target: BASE_URL,
    scope: 'first three catalogue pages only',
    fake_failure_injected: args.has('--inject-fake-url'),
    note: 'Counts reflect this execution. Cache hits are read locally and do not make network requests.'
  };
  await writeJson('books.json', books);
  await writeJson('errors.json', errors);
  await writeJson('run-report.json', report);
  console.log(`SUMMARY catalogue_pages=${stats.catalogue_pages} discovered=${stats.discovered_urls} unique_urls=${stats.unique_urls} detail_pages=${stats.detail_pages} valid_records=${stats.valid_records} invalid_records=${stats.invalid_records} failed_pages=${stats.failed_pages} cache_hits=${stats.cache_hits}`);
  if (stats.failed_pages || stats.invalid_records) process.exitCode = 1;
}

main().catch(async (error) => {
  console.error(`FATAL ${error.stack || error.message}`);
  try {
    await writeJson('run-report.json', {
      ...stats,
      finished_at: new Date().toISOString(),
      fatal_error: error.message
    });
  } catch (_) {}
  process.exitCode = 1;
});
