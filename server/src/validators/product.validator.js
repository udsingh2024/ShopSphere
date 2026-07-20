const { z } = require('zod');

const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
    price: z.preprocess(
      (val) => (val !== undefined ? Number(val) : undefined),
      z.number({ required_error: 'Price is required' }).min(0, { message: 'Price must be 0 or greater' })
    ),
    discountPrice: z.preprocess(
      (val) => (val ? Number(val) : 0),
      z.number().min(0).optional()
    ),
    inventory: z.preprocess(
      (val) => (val !== undefined ? Number(val) : undefined),
      z.number({ required_error: 'Inventory count is required' }).int().min(0, { message: 'Inventory must be 0 or greater' })
    ),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Category ID format' }),
    tags: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return val.split(',').map((t) => t.trim()).filter(Boolean);
          }
        }
        return val;
      },
      z.array(z.string()).optional()
    ),
  }),
});

module.exports = {
  createProductSchema,
};
