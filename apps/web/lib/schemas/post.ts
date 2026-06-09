import { z } from 'zod';

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const AuthorSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
});

export const PostSchema = z.object({
  id: z.string(),
  slug: z.string().nullable().optional(),
  title: z.string(),
  content: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  authorId: z.string(),
  author: AuthorSchema.nullable().optional(),
  status: z.string().optional(),
  likes: z.number().int().default(0),
  views: z.number().int().default(0),
  rpmReal: z.number().nullable().optional(),
  readingTime: z.number().nullable().optional(),
  trustScore: z.number().nullable().optional(),
  tags: z.array(z.union([z.string(), TagSchema])).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const FeedResponseSchema = z.object({
  posts: z.array(PostSchema),
});

export const PostLikeResponseSchema = z.object({
  post: z.object({
    id: z.string(),
    likes: z.number().int().nonnegative(),
  }),
});

export const TrendingTagsResponseSchema = z.object({
  tags: z.array(z.string()),
});

export type Post = z.infer<typeof PostSchema>;
export type Author = z.infer<typeof AuthorSchema>;
export type Tag = z.infer<typeof TagSchema>;
