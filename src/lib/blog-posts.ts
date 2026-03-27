import type { BlogPostDocument, BlogPostStatus } from "./cosmos";
import { ApiError } from "./api";

const BLOG_POST_STATUSES = new Set<BlogPostStatus>(["draft", "published"]);

type MutableBlogPostFields = Omit<
  BlogPostDocument,
  "id" | "createdAt" | "updatedAt"
>;

export type CreateBlogPostInput = MutableBlogPostFields;

export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  value: unknown,
  fieldName: string,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): string {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (!allowEmpty && normalizedValue.length === 0) {
    throw new ApiError(400, `${fieldName} is required.`);
  }

  return allowEmpty ? value : normalizedValue;
}

function requireTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ApiError(400, "tags must be an array of strings.");
  }

  const tags = value.map((tag) => requireString(tag, "tags[]")).filter(Boolean);

  if (tags.length !== value.length) {
    throw new ApiError(400, "tags must only contain non-empty strings.");
  }

  return tags;
}

function requireStatus(value: unknown): BlogPostStatus {
  if (typeof value !== "string" || !BLOG_POST_STATUSES.has(value as BlogPostStatus)) {
    throw new ApiError(400, 'status must be either "draft" or "published".');
  }

  return value as BlogPostStatus;
}

function normalizeIsoDate(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${fieldName} must be a valid ISO date string.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid ISO date string.`);
  }

  return date.toISOString();
}

export async function parseRequestJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

export function parseCreateBlogPostInput(payload: unknown): CreateBlogPostInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  const status = requireStatus(payload.status);
  const publishedAt =
    status === "published"
      ? normalizeIsoDate(payload.publishedAt ?? new Date().toISOString(), "publishedAt")
      : typeof payload.publishedAt === "undefined"
        ? ""
        : normalizeIsoDate(payload.publishedAt, "publishedAt");

  return {
    title: requireString(payload.title, "title"),
    slug: requireString(payload.slug, "slug"),
    body: requireString(payload.body, "body"),
    excerpt: requireString(payload.excerpt, "excerpt"),
    author: requireString(payload.author, "author"),
    tags: requireTags(payload.tags),
    featuredImage: requireString(payload.featuredImage, "featuredImage"),
    seoTitle: requireString(payload.seoTitle, "seoTitle"),
    seoDescription: requireString(payload.seoDescription, "seoDescription"),
    ogImage: requireString(payload.ogImage, "ogImage"),
    status,
    publishedAt,
  };
}

export function parseUpdateBlogPostInput(payload: unknown): UpdateBlogPostInput {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  const updates: UpdateBlogPostInput = {};

  if ("title" in payload) {
    updates.title = requireString(payload.title, "title");
  }

  if ("slug" in payload) {
    updates.slug = requireString(payload.slug, "slug");
  }

  if ("body" in payload) {
    updates.body = requireString(payload.body, "body");
  }

  if ("excerpt" in payload) {
    updates.excerpt = requireString(payload.excerpt, "excerpt");
  }

  if ("author" in payload) {
    updates.author = requireString(payload.author, "author");
  }

  if ("tags" in payload) {
    updates.tags = requireTags(payload.tags);
  }

  if ("featuredImage" in payload) {
    updates.featuredImage = requireString(payload.featuredImage, "featuredImage");
  }

  if ("seoTitle" in payload) {
    updates.seoTitle = requireString(payload.seoTitle, "seoTitle");
  }

  if ("seoDescription" in payload) {
    updates.seoDescription = requireString(payload.seoDescription, "seoDescription");
  }

  if ("ogImage" in payload) {
    updates.ogImage = requireString(payload.ogImage, "ogImage");
  }

  if ("status" in payload) {
    updates.status = requireStatus(payload.status);
  }

  if ("publishedAt" in payload) {
    updates.publishedAt = normalizeIsoDate(payload.publishedAt, "publishedAt");
  }

  return updates;
}

export function buildBlogPostDocument(input: CreateBlogPostInput): BlogPostDocument {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyBlogPostUpdate(
  existingPost: BlogPostDocument,
  updates: UpdateBlogPostInput,
): BlogPostDocument {
  const nextStatus = updates.status ?? existingPost.status;
  const nextPublishedAt =
    updates.publishedAt ??
    (nextStatus === "published"
      ? existingPost.publishedAt || new Date().toISOString()
      : existingPost.publishedAt);

  return {
    ...existingPost,
    ...updates,
    status: nextStatus,
    publishedAt: nextPublishedAt,
    updatedAt: new Date().toISOString(),
  };
}
