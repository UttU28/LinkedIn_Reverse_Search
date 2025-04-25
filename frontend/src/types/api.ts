import { z } from "zod";

// User API Types
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  lastLogin: z.string().datetime(),
  linkCredits: z.number(),
  totalSearched: z.number(),
  totalFound: z.number(),
});

export type User = z.infer<typeof userSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  password: z.string(),
  name: z.string(),
  email: z.string().email(),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;

// Search API Types
export const searchRequestSchema = z.object({
  name: z.string(),
  company: z.string(),
  position: z.string(),
  title: z.string().optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const searchResultSchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  company: z.string(),
  position: z.string(),
  title: z.string().optional(),
  status: z.enum(["found", "not_found", "pending"]),
  searchedAt: z.string().datetime(),
  linkedInUrl: z.string().optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>; 