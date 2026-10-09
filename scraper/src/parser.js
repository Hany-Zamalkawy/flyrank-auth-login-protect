const cheerio = require('cheerio');

function extractRawBook(html, productUrl, sourcePage) {
  const $ = cheerio.load(html);
  const product = $('div.product_main');
  const title = product.find('h1').first().text().trim();
  const priceText = product.find('.price_color').first().text().trim();
  const availabilityText = product.find('.availability').first().text().replace(/\s+/g, ' ').trim();
  const ratingClass = product.find('p.star-rating').attr('class') || '';
  const ratingText = ratingClass.split(/\s+/).find((name) => ['One', 'Two', 'Three', 'Four', 'Five'].includes(name)) || '';
  const descriptionNode = $('#product_description').nextAll('p').first();
  const description = descriptionNode.length ? descriptionNode.text().trim() : null;
  const numericPrice = Number(priceText.replace(/[^\d.]/g, ''));
  return {
    title,
    product_url: productUrl,
    price_text: priceText,
    price_gbp: numericPrice,
    availability_text: availabilityText,
    rating_text: ratingText,
    description: description || null,
    source_page: sourcePage,
    fetched_at: new Date().toISOString()
  };
}

module.exports = { extractRawBook };
