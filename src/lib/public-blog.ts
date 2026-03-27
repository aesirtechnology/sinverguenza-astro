import { getPostsContainer } from './cosmos';
import type { BlogPostDocument } from './blog-types';

const POSTS_PER_PAGE = 10;

let publishedPostsCache: BlogPostDocument[] | undefined;

export interface BlogPaginationPage {
  currentPage: number;
  totalPages: number;
  posts: BlogPostDocument[];
}

export function getPostsPerPage(): number {
  return POSTS_PER_PAGE;
}

export async function getPublishedPosts(): Promise<BlogPostDocument[]> {
  if (publishedPostsCache) {
    return publishedPostsCache;
  }

  const container = getPostsContainer();
  const { resources } = await container.items
    .query<BlogPostDocument>({
      query:
        'SELECT * FROM c WHERE c.status = @status ORDER BY c.publishedAt DESC',
      parameters: [{ name: '@status', value: 'published' }],
    })
    .fetchAll();

  publishedPostsCache = resources;
  return resources;
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPostDocument | undefined> {
  const posts = await getPublishedPosts();
  return posts.find((post) => post.slug === slug);
}

export async function getUniqueTags(): Promise<string[]> {
  const posts = await getPublishedPosts();
  const tags = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const normalizedTag = tag.trim();
      if (normalizedTag) {
        tags.add(normalizedTag);
      }
    });
  });

  return [...tags].sort((left, right) => left.localeCompare(right));
}

export async function getPostsByTag(tag: string): Promise<BlogPostDocument[]> {
  const normalizedTag = decodeURIComponent(tag).toLowerCase();
  const posts = await getPublishedPosts();

  return posts.filter((post) =>
    post.tags.some((postTag) => postTag.toLowerCase() === normalizedTag),
  );
}

export function paginatePosts(
  posts: BlogPostDocument[],
  currentPage: number,
): BlogPaginationPage {
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const normalizedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (normalizedPage - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;

  return {
    currentPage: normalizedPage,
    posts: posts.slice(start, end),
    totalPages,
  };
}
