import type { BlogPostDocument, BlogPostInput } from './blog-types';
import { sortPostsForAdmin } from './blog-utils';

interface ApiErrorPayload {
  error?: string;
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const { headers, ...restInit } = init ?? {};

  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(headers ?? {}),
    },
    ...restInit,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Ignore JSON parsing errors and keep the default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getPublishedPosts(): Promise<BlogPostDocument[]> {
  return requestJson<BlogPostDocument[]>('/api/posts');
}

export async function getDraftPosts(): Promise<BlogPostDocument[]> {
  return requestJson<BlogPostDocument[]>('/api/posts/drafts');
}

export async function getAllPosts(): Promise<BlogPostDocument[]> {
  const [publishedPosts, draftPosts] = await Promise.all([
    getPublishedPosts(),
    getDraftPosts(),
  ]);

  const postsById = new Map<string, BlogPostDocument>();

  [...publishedPosts, ...draftPosts].forEach((post) => {
    postsById.set(post.id, post);
  });

  return sortPostsForAdmin([...postsById.values()]);
}

export async function getPostById(
  id: string,
): Promise<BlogPostDocument | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.id === id);
}

export async function createPost(
  payload: BlogPostInput,
): Promise<BlogPostDocument> {
  return requestJson<BlogPostDocument>('/api/posts', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function updatePost(
  slug: string,
  payload: Partial<BlogPostInput>,
): Promise<BlogPostDocument> {
  return requestJson<BlogPostDocument>(`/api/posts/${encodeURIComponent(slug)}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  });
}

export async function deletePost(slug: string): Promise<void> {
  await requestJson<void>(`/api/posts/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}
