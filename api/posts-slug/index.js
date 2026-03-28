const { requireAdminRequest } = require("../shared/auth");
const {
  applyBlogPostUpdate,
  parseRequestJson,
  parseUpdateBlogPostInput,
} = require("../shared/blog-posts");
const { findPostBySlug, getPostsContainer } = require("../shared/cosmos");
const { ApiError, handleError, json, noContent } = require("../shared/errors");

function requireSlug(slug) {
  if (!slug) {
    throw new ApiError(400, "A post slug is required.");
  }

  return slug;
}

module.exports = async function (context, req) {
  try {
    const method = String(req.method || "GET").toUpperCase();
    const slug = requireSlug(context.bindingData.slug);

    if (method === "GET") {
      const container = getPostsContainer();
      const { resources } = await container.items
        .query({
          query:
            "SELECT TOP 1 * FROM c WHERE c.slug = @slug AND c.status = @status",
          parameters: [
            { name: "@slug", value: slug },
            { name: "@status", value: "published" },
          ],
        })
        .fetchAll();

      const post = resources[0];

      if (!post) {
        throw new ApiError(404, "Post not found.");
      }

      json(context, 200, post);
      return;
    }

    if (method === "PUT") {
      requireAdminRequest(req);

      const existingPost = await findPostBySlug(slug);

      if (!existingPost) {
        throw new ApiError(404, "Post not found.");
      }

      const payload = parseRequestJson(req);
      const updates = parseUpdateBlogPostInput(payload);

      if (updates.slug && updates.slug !== slug) {
        throw new ApiError(
          400,
          "Updating slug is not supported because it is used as the partition key.",
        );
      }

      const container = getPostsContainer();
      const updatedPost = applyBlogPostUpdate(existingPost, updates);
      const { resource } = await container
        .item(existingPost.id, existingPost.slug)
        .replace(updatedPost);

      if (!resource) {
        throw new Error("Cosmos DB did not return the updated blog post.");
      }

      json(context, 200, resource);
      return;
    }

    if (method === "DELETE") {
      requireAdminRequest(req);

      const existingPost = await findPostBySlug(slug);

      if (!existingPost) {
        throw new ApiError(404, "Post not found.");
      }

      const container = getPostsContainer();
      await container.item(existingPost.id, existingPost.slug).delete();

      noContent(context);
      return;
    }

    throw new ApiError(405, "Method not allowed.");
  } catch (error) {
    handleError(context, error);
  }
};
