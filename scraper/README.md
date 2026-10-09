# The polite scraper — FlyRank Week 5 / Assignment A9

A cache-first Node.js scraper for the **first three catalogue pages only** of [Books to Scrape](https://books.toscrape.com/), a practice sandbox described by its operator as a safe place to learn scraping. The target page says the catalogue has 1,000 items, up to 20 per page, and does not require JavaScript. See [ToScrape's sandbox description](https://toscrape.com/).

## Target classification and scope

- **Target:** `https://books.toscrape.com` – a public training sandbox intended for scraping practice.
- **Scope:** catalogue pages 1–3 and the book detail pages linked from those pages (expected 60 unique books). The scrapper follows each page's own “next” link and does not guess further catalogue pages.
- **Collected fields:** title, product URL, original price text, normalized GBP price, availability, star rating, optional description, source catalogue page, and fetch timestamp.
- **Why appropriate:** the sandbox explicitly invites developers to validate scraping technologies. This project uses a narrow scope, cache-first development, an identifying User-Agent, a timeout, and a minimum half-second pause between real requests.
- **Robots check:** this build environment could not resolve `books.toscrape.com` (DNS/network egress unavailable), so I could not honestly record the live response or contents of `robots.txt`. Before the first live run, execute `npm run check:robots` and record the actual status/body. A failed or missing robots file is not permission by itself.

I will not reuse this code on another site without checking its rules and terms first.

## Requirements and run

- Node.js 20+
- Internet access to `books.toscrape.com` for a first uncached run

```bash
npm install
npm test
npm run check:robots
npm run scrape
```

The scraper writes `output/books.json`, `output/errors.json`, and `output/run-report.json`. On later runs, cached HTML is reused without a network request. To prove failure isolation without contacting the public site with a fake URL, run `npm run scrape -- --inject-fake-url`; the injected URL points to loopback port 9 and should be logged/skipped while valid books remain stored.

## Record schema

Each validated record contains:

```json
{
  "title": "A Light in the Attic",
  "product_url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "price_text": "£51.77",
  "price_gbp": 51.77,
  "availability_text": "In stock (22 available)",
  "rating_text": "Three",
  "description": null,
  "source_page": "https://books.toscrape.com/catalogue/page-1.html",
  "fetched_at": "2026-08-06T10:00:00.000Z"
}
```

The values above illustrate the schema only; they are not claimed as a run result. `description` is nullable because some pages may omit it. Zod validates every record before it is written. Invalid records go to `output/errors.json`, never `books.json`. Records are keyed by canonical absolute product URL and sorted, so reruns do not append duplicates.

## Politeness and failure handling

- Identifying User-Agent includes this repository URL.
- 8-second request timeout.
- At least 500 ms between actual requests; cache reads have no delay.
- Only HTTP 200 responses are parsed. One retry is allowed for timeout/network reset or HTTTP 5xx; 403 and 404 are not retried.
- Each detail page is isolated: a failed page is recorded and skipped.
- The run report records start/end timestamps, duration, fetched pages, cache hits, valid/invalid records, and failed pages.
- Cache HTML is ignored by Git; only code and small output evidence should be committed.

## Honest limitations

The live scrape and live `robots.txt` response have not been verified from this environment because outbound DNS/network access is unavailable. Run the commands above on a network-enabled machine to produce a real run report. This uses ordinary HTTP because the book data is present in the HTML sent by the server; a browser would add cost without helping the core assignment.

## Ethics

Prefer an official API when one exists. Never bypass logins, paywalls, or blocks. Collect only what is needed, honor site rules, and stop if the site indicates that automated access is not welcome.
