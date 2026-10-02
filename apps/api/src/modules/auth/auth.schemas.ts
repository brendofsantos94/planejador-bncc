import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(1024),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  user: PublicUser;
  refreshToken: string;
}
