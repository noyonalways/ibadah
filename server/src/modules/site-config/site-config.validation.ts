import { z } from 'zod';

/** Accepts a valid http(s) URL or an empty string ("not set"). */
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), {
    message: 'Must be a full http(s) URL or empty',
  });

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .refine((v) => v === '' || z.string().email().safeParse(v).success, {
    message: 'Must be a valid email or empty',
  });

export const updateRecruiterIntroSchema = z.object({
  body: z
    .object({
      enabled: z.boolean(),
      authorName: z.string().trim().max(80),
      githubUrl: optionalUrl,
      portfolioUrl: optionalUrl,
      linkedinUrl: optionalUrl,
      demoEmail: optionalEmail,
      demoPassword: z.string().max(200),
    })
    .partial()
    .strict(),
});

export type UpdateRecruiterIntroDto = z.infer<typeof updateRecruiterIntroSchema>['body'];
