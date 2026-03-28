const { app } = require("@azure/functions");
const { requireAdminRequest } = require("../shared/auth");
const {
  buildBlogPostDocument,
  parseCreateBlogPostInput,
} = require("../shared/blog-posts");
const { findPostBySlug, getPostsContainer } = require("../shared/cosmos");
const { ApiError, handleError, json } = require("../shared/errors");
const {
  createLegacyContext,
  createLegacyRequest,
  parseJsonBody,
} = require("../shared/v4-http");

app.http("posts", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "posts",
  handler: async (request, context) => {
    const legacyContext = createLegacyContext(context);

    try {
      const method = String(request.method || "GET").toUpperCase();

      if (method === "GET") {
        const container = getPostsContainer();
        const { resources } = await container.items
          .query({
            query:
              "SELECT * FROM c WHERE c.status = @status ORDER BY c.publishedAt DESC",
            parameters: [{ name: "@status", value: "published" }],
          })
          .fetchAll();

        json(legacyContext, 200, resources);
        return legacyContext.res;
      }

      if (method === "POST") {
        const payload = await parseJsonBody(request);
        const legacyRequest = createLegacyRequest(request, payload);
        requireAdminRequest(legacyRequest);
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

        json(legacyContext, 201, resource, {
          Location: `/api/posts/${resource.slug}`,
        });
        return legacyContext.res;
      }

      throw new ApiError(405, "Method not allowed.");
    } catch (error) {
      handleError(legacyContext, error);
      return legacyContext.res;
    }
  },
});
