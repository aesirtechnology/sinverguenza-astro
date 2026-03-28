const { requireAdminRequest } = require("../shared/auth");
const { getPostsContainer } = require("../shared/cosmos");
const { handleError, json } = require("../shared/errors");

module.exports = async function (context, req) {
  try {
    requireAdminRequest(req);

    const container = getPostsContainer();
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.status = @status ORDER BY c.updatedAt DESC",
        parameters: [{ name: "@status", value: "draft" }],
      })
      .fetchAll();

    json(context, 200, resources);
  } catch (error) {
    handleError(context, error);
  }
};
