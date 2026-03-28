const { app } = require("@azure/functions");
const { requireAdminRequest } = require("../shared/auth");
const {
  applyBlogPostUpdate,
  parseUpdateBlogPostInput,
} = require("../shared/blog-posts");
const { findPostBySlug, getPostsContainer } = require("../shared/cosmos");
const { ApiError, handleError, json, noContent } = require("../shared/errors");
const {
  createLegacyContext,
  createLegacyRequest,
  parseJsonBody,
} = require("../shared/v4-http");

function requireSlug(slug) {
  if (!slug) {
    throw new ApiError(400, "A post slug is required.");
  }

  return slug;
}

app.http("posts-slug", {
  methods: ["GET", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "posts/{slug}",
  handler: async (request, context) => {
    const legacyContext = createLegacyContext(context);

    try {
      const method = String(request.method || "GET").toUpperCase();
      const slug = requireSlug(request.params.slug);

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

        json(legacyContext, 200, post);
        return legacyContext.res;
      }

      if (method === "PUT") {
        const payload = await parseJsonBody(request);
        const legacyRequest = createLegacyRequest(request, payload);
        requireAdminRequest(legacyRequest);

        const existingPost = await findPostBySlug(slug);

        if (!existingPost) {
          throw new ApiError(404, "Post not found.");
        }

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

        json(legacyContext, 200, resource);
        return legacyContext.res;
      }

      if (method === "DELETE") {
        const legacyRequest = createLegacyRequest(request, undefined);
        requireAdminRequest(legacyRequest);

        const existingPost = await findPostBySlug(slug);

        if (!existingPost) {
          throw new ApiError(404, "Post not found.");
        }

        const container = getPostsContainer();
        await container.item(existingPost.id, existingPost.slug).delete();

        noContent(legacyContext);
        return legacyContext.res;
      }

      throw new ApiError(405, "Method not allowed.");
    } catch (error) {
      handleError(legacyContext, error);
      return legacyContext.res;
    }
  },
});
