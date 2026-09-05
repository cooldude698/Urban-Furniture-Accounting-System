import { z } from 'zod';

export const ContactTypeEnum = z.enum(['customer', 'vendor', 'both']);
export type ContactType = z.infer<typeof ContactTypeEnum>;

export const ContactSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, 'Name is required'),
  type: ContactTypeEnum.default('customer'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().min(5, 'Mobile number is required').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().optional().or(z.literal('')),
  image_path: z.string().nullable().optional(),
  gstin: z.string().optional().or(z.literal('')),
  is_archived: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;

export const CreateContactInputSchema = ContactSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export type CreateContactInput = z.infer<typeof CreateContactInputSchema>;

export const UpdateContactInputSchema = CreateContactInputSchema.partial();
export type UpdateContactInput = z.infer<typeof UpdateContactInputSchema>;
