export type BlogPostStatus = 'draft' | 'published';

export interface BlogPostDocument {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  author: string;
  tags: string[];
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  status: BlogPostStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type BlogPostInput = Omit<
  BlogPostDocument,
  'id' | 'createdAt' | 'updatedAt'
>;
