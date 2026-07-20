const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          product: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Product ID' }),
          quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' }),
        })
      )
      .min(1, { message: 'Order must contain at least 1 item' }),
    shippingAddress: z.object({
      street: z.string().min(1, { message: 'Street is required' }),
      city: z.string().min(1, { message: 'City is required' }),
      state: z.string().min(1, { message: 'State is required' }),
      zipCode: z.string().min(1, { message: 'Zip Code is required' }),
      country: z.string().min(1, { message: 'Country is required' }),
    }),
    paymentMethod: z.enum(['stripe', 'paypal', 'cod']).default('cod'),
    paymentIntentId: z.string().optional(),
  }),
});

module.exports = {
  createOrderSchema,
};
