const { randomUUID } = require("node:crypto");
const { ApiError } = require("./errors");

const BLOG_POST_STATUSES = new Set(["draft", "published"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value, fieldName, { allowEmpty = false } = {}) {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (!allowEmpty && normalizedValue.length === 0) {
    throw new ApiError(400, `${fieldName} is required.`);
  }

  return allowEmpty ? value : normalizedValue;
}

function requireTags(value) {
  if (!Array.isArray(value)) {
    throw new ApiError(400, "tags must be an array of strings.");
  }

  const tags = value.map((tag) => requireString(tag, "tags[]")).filter(Boolean);

  if (tags.length !== value.length) {
    throw new ApiError(400, "tags must only contain non-empty strings.");
  }

  return tags;
}

function requireStatus(value) {
  if (typeof value !== "string" || !BLOG_POST_STATUSES.has(value)) {
    throw new ApiError(400, 'status must be either "draft" or "published".');
  }

  return value;
}

function normalizeIsoDate(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, `${fieldName} must be a valid ISO date string.`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${fieldName} must be a valid ISO date string.`);
  }

  return date.toISOString();
}

function parseRequestJson(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new ApiError(400, "Request body must be valid JSON.");
    }
  }

  if (req.body && Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString("utf-8"));
    } catch {
      throw new ApiError(400, "Request body must be valid JSON.");
    }
  }

  if (typeof req.body === "undefined") {
    throw new ApiError(400, "Request body must be valid JSON.");
  }

  return req.body;
}

function parseCreateBlogPostInput(payload) {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  const status = requireStatus(payload.status);
  const publishedAt =
    status === "published"
      ? normalizeIsoDate(payload.publishedAt || new Date().toISOString(), "publishedAt")
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

function parseUpdateBlogPostInput(payload) {
  if (!isRecord(payload)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  const updates = {};

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

function buildBlogPostDocument(input) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

function applyBlogPostUpdate(existingPost, updates) {
  const nextStatus = updates.status || existingPost.status;
  const nextPublishedAt =
    updates.publishedAt ||
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

module.exports = {
  ApiError,
  applyBlogPostUpdate,
  buildBlogPostDocument,
  parseCreateBlogPostInput,
  parseRequestJson,
  parseUpdateBlogPostInput,
};
