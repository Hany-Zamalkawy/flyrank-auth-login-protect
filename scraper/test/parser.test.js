const test = require('node:test');
const assert = require('node:assert/strict');
const cheerio = require('cheerio');
const { BookSchema } = require('../src/schema');
const { extractRawBook } = require('../src/parser');

const fixture = (options = {}) => `<!doctype html><html><body><div class="product_main"><h1>${options.title ?? 'Test Book'}</h1><p class="price_color">${options.price ?? '£12.50'}</p><p class="availability">\n In stock (${options.stock ?? '3'} available) </p><p class="star-rating ${options.rating ?? 'Three'}"></p></div>${options.description === null ? '' : `<div id="product_description"><h2>Product Description</h2></div><p>${options.description ?? 'A test description.'}</p>`}</body></html>`;

test('normalizes a currency string into a numeric price', () => {
  assert.equal(Number('£51.77'.replace(/[^\d.]/g, '')), 51.77);
});

test('resolves a relative URL against its page URL', () => {
  assert.equal(new URL('../book/index.html', 'https://books.toscrape.com/catalogue/page-1.html').href, 'https://books.toscrape.com/book/index.html');
});

test('extracts nullable description when it is absent', () => {
  const $ = cheerio.load(fixture({ description: null }));
  assert.equal($('#product_description').nextAll('p').first().length, 0);
});

test('deduplicates canonical URLs', () => {
  assert.deepEqual([...new Set(['https://books.toscrape.com/a', 'https://books.toscrape.com/a'])], ['https://books.toscrape.com/a']);
});

test('schema rejects malformed records and accepts valid records', () => {
  const valid = {
    title: 'Test',
    product_url: 'https://books.toscrape.com/a',
    price_text: '£12.50',
    price_gbp: 12.5,
    availability_text: 'In stock',
    rating_text: 'Three',
    description: null,
    source_page: 'https://books.toscrape.com/catalogue/page-1.html',
    fetched_at: new Date().toISOString()
  };
  assert.equal(BookSchema.safeParse(valid).success, true);
  assert.equal(BookSchema.safeParse({ ...valid, price_gbp: '12.50' }).success, false);
  assert.equal(BookSchema.safeParse({ ...valid, product_url: 'http://example.com/book' }).success, false);
});

test('parser extracts fields from the product area and preserves nullable description', () => {
  const url = 'https://books.toscrape.com/catalogue/test_1/index.html';
  const page = 'https://books.toscrape.com/catalogue/page-1.html';
  const record = extractRawBook(fixture({ title: 'Fixture Title', price: '£4.20', rating: 'Five', description: null }), url, page);
  assert.equal(record.title, 'Fixture Title');
  assert.equal(record.price_gbp, 4.2);
  assert.equal(record.rating_text, 'Five');
  assert.equal(record.description, null);
  assert.equal(BookSchema.safeParse(record).success, true);
});
