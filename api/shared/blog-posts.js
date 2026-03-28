const { randomUUID } = require("node:crypto");
const { ApiError } = require("./errors");

const BLOG_POST_STATUSES = new Set(["draft", "published"]);
const PUBLISH_REQUIRED_FIELDS = [
  ["slug", "slug"],
  ["body", "body"],
  ["excerpt", "excerpt"],
  ["author", "author"],
  ["seoTitle", "seoTitle"],
  ["seoDescription", "seoDescription"],
  ["tags", "tags"],
  ["featuredImage", "featuredImage"],
  ["ogImage", "ogImage"],
];

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

function readString(value, fieldName, { allowEmpty = false, fallback = "" } = {}) {
  if (typeof value === "undefined") {
    return fallback;
  }

  return requireString(value, fieldName, { allowEmpty });
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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createDraftSlug(title) {
  return slugify(title) || `draft-${Date.now()}`;
}

function hasMeaningfulBody(value) {
  if (typeof value !== "string") {
    return false;
  }

  if (/<(img|video|iframe|embed|object|figure)\b/i.test(value)) {
    return true;
  }

  const textContent = value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return textContent.length > 0;
}

function validateBlogPostForSave(post, { requireFullValidation = false } = {}) {
  const missingFields = [];

  if (!post.title || !post.title.trim()) {
    missingFields.push("title");
  }

  if (!post.author || !post.author.trim()) {
    missingFields.push("author");
  }

  if (requireFullValidation) {
    for (const [key, label] of PUBLISH_REQUIRED_FIELDS) {
      if (key === "author") {
        continue;
      }

      if (key === "body") {
        if (!hasMeaningfulBody(post.body)) {
          missingFields.push(label);
        }
        continue;
      }

      if (key === "tags") {
        if (!Array.isArray(post.tags) || post.tags.length === 0) {
          missingFields.push(label);
        }
        continue;
      }

      const value = post[key];

      if (typeof value !== "string" || value.trim().length === 0) {
        missingFields.push(label);
      }
    }
  }

  if (missingFields.length > 0) {
    throw new ApiError(
      400,
      `Missing required fields: ${missingFields.join(", ")}.`,
    );
  }
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

  const title = requireString(payload.title, "title");
  const status = requireStatus(payload.status);
  const slug =
    status === "draft"
      ? readString(payload.slug, "slug", {
          allowEmpty: true,
          fallback: createDraftSlug(title),
        }).trim() || createDraftSlug(title)
      : requireString(payload.slug, "slug");
  const publishedAt =
    status === "published"
      ? normalizeIsoDate(payload.publishedAt || new Date().toISOString(), "publishedAt")
      : "";

  const input = {
    title,
    slug,
    body: readString(payload.body, "body", { allowEmpty: true }),
    excerpt: readString(payload.excerpt, "excerpt", { allowEmpty: true }),
    author: readString(payload.author, "author", { allowEmpty: true }),
    tags: typeof payload.tags === "undefined" ? [] : requireTags(payload.tags),
    featuredImage: readString(payload.featuredImage, "featuredImage", { allowEmpty: true }),
    seoTitle: readString(payload.seoTitle, "seoTitle", { allowEmpty: true }),
    seoDescription: readString(payload.seoDescription, "seoDescription", {
      allowEmpty: true,
    }),
    ogImage: readString(payload.ogImage, "ogImage", { allowEmpty: true }),
    status,
    publishedAt,
  };

  validateBlogPostForSave(input, {
    requireFullValidation: status === "published",
  });

  return input;
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
    updates.body = requireString(payload.body, "body", { allowEmpty: true });
  }

  if ("excerpt" in payload) {
    updates.excerpt = requireString(payload.excerpt, "excerpt", { allowEmpty: true });
  }

  if ("author" in payload) {
    updates.author = requireString(payload.author, "author", { allowEmpty: true });
  }

  if ("tags" in payload) {
    updates.tags = requireTags(payload.tags);
  }

  if ("featuredImage" in payload) {
    updates.featuredImage = requireString(payload.featuredImage, "featuredImage", {
      allowEmpty: true,
    });
  }

  if ("seoTitle" in payload) {
    updates.seoTitle = requireString(payload.seoTitle, "seoTitle", { allowEmpty: true });
  }

  if ("seoDescription" in payload) {
    updates.seoDescription = requireString(payload.seoDescription, "seoDescription", {
      allowEmpty: true,
    });
  }

  if ("ogImage" in payload) {
    updates.ogImage = requireString(payload.ogImage, "ogImage", { allowEmpty: true });
  }

  if ("status" in payload) {
    updates.status = requireStatus(payload.status);
  }

  if ("publishedAt" in payload) {
    if (
      typeof payload.publishedAt === "undefined" ||
      payload.publishedAt === null ||
      (typeof payload.publishedAt === "string" && payload.publishedAt.trim() === "")
    ) {
      updates.publishedAt = "";
    } else {
      updates.publishedAt = normalizeIsoDate(payload.publishedAt, "publishedAt");
    }
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
  validateBlogPostForSave,
};
