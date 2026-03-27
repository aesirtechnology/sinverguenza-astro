import type { BlogPostDocument } from './blog-types';

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseTagInput(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTagInput(tags: string[]): string {
  return tags.join(', ');
}

export function sortPostsForAdmin(posts: BlogPostDocument[]): BlogPostDocument[] {
  return [...posts].sort((left, right) => {
    const leftTimestamp = new Date(
      left.updatedAt || left.publishedAt || left.createdAt,
    ).getTime();
    const rightTimestamp = new Date(
      right.updatedAt || right.publishedAt || right.createdAt,
    ).getTime();

    return rightTimestamp - leftTimestamp;
  });
}
