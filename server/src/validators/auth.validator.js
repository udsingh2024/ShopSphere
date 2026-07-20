const { z } = require('zod');

// Password complexity: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().regex(passwordRegex, {
      message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
    }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
    rememberMe: z.boolean().optional(),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }).optional(),
    phone: z.string().max(20, { message: 'Phone must not exceed 20 characters' }).optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, { message: 'Old password is required' }),
    newPassword: z.string().regex(passwordRegex, {
      message: 'New password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
    }),
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
};
