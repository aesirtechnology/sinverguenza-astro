const { app } = require("@azure/functions");
const { requireAdminRequest } = require("../shared/auth");
const { getPostsContainer } = require("../shared/cosmos");
const { handleError, json } = require("../shared/errors");
const {
  createLegacyContext,
  createLegacyRequest,
} = require("../shared/v4-http");

app.http("posts-drafts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "posts/drafts",
  handler: async (request, context) => {
    const legacyContext = createLegacyContext(context);

    try {
      requireAdminRequest(createLegacyRequest(request, undefined));

      const container = getPostsContainer();
      const { resources } = await container.items
        .query({
          query: "SELECT * FROM c WHERE c.status = @status ORDER BY c.updatedAt DESC",
          parameters: [{ name: "@status", value: "draft" }],
        })
        .fetchAll();

      json(legacyContext, 200, resources);
      return legacyContext.res;
    } catch (error) {
      handleError(legacyContext, error);
      return legacyContext.res;
    }
  },
});
