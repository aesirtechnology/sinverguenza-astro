const { requireAdminRequest } = require("../shared/auth");
const {
  buildBlogPostDocument,
  parseCreateBlogPostInput,
  parseRequestJson,
} = require("../shared/blog-posts");
const { findPostBySlug, getPostsContainer } = require("../shared/cosmos");
const { ApiError, handleError, json } = require("../shared/errors");

module.exports = async function (context, req) {
  try {
    const method = String(req.method || "GET").toUpperCase();

    if (method === "GET") {
      const container = getPostsContainer();
      const { resources } = await container.items
        .query({
          query:
            "SELECT * FROM c WHERE c.status = @status ORDER BY c.publishedAt DESC",
          parameters: [{ name: "@status", value: "published" }],
        })
        .fetchAll();

      json(context, 200, resources);
      return;
    }

    if (method === "POST") {
      requireAdminRequest(req);

      const payload = parseRequestJson(req);
      const input = parseCreateBlogPostInput(payload);

      if (await findPostBySlug(input.slug)) {
        throw new ApiError(409, "A post with that slug already exists.");
      }

      const container = getPostsContainer();
      const document = buildBlogPostDocument(input);
      const { resource } = await container.items.create(document);

      if (!resource) {
        throw new Error("Cosmos DB did not return the created blog post.");
      }

      json(context, 201, resource, {
        Location: `/api/posts/${resource.slug}`,
      });
      return;
    }

    throw new ApiError(405, "Method not allowed.");
  } catch (error) {
    handleError(context, error);
  }
};
