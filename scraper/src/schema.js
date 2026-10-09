const { z } = require('zod');

const BookSchema = z.object({
  title: z.string().trim().min(1),
  product_url: z.string().url().refine((value) => value.startsWith('https://'), 'product_url must use HTTPS'),
  price_text: z.string().min(1),
  price_gbp: z.number().finite().nonnegative(),
  availability_text: z.string().min(1),
  rating_text: z.string().min(1),
  description: z.string().nullable(),
  source_page: z.string().url().refine((value) => value.startsWith('https://'), 'source_page must use HTTPS'),
  fetched_at: z.string().datetime({ offset: true })
});

module.exports = { BookSchema };
