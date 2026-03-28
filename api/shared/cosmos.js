const { CosmosClient } = require("@azure/cosmos");

const DATABASE_ID = "sinverguenza-blog";
const POSTS_CONTAINER_ID = "posts";

let cosmosClient;

function getCosmosClient() {
  if (cosmosClient) {
    return cosmosClient;
  }

  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;

  if (!endpoint || !key) {
    throw new Error(
      "Missing Cosmos DB credentials. Set COSMOS_ENDPOINT and COSMOS_KEY in the environment.",
    );
  }

  cosmosClient = new CosmosClient({
    endpoint,
    key,
  });

  return cosmosClient;
}

function getPostsContainer() {
  return getCosmosClient().database(DATABASE_ID).container(POSTS_CONTAINER_ID);
}

async function findPostBySlug(slug) {
  const container = getPostsContainer();
  const { resources } = await container.items
    .query({
      query: "SELECT TOP 1 * FROM c WHERE c.slug = @slug",
      parameters: [{ name: "@slug", value: slug }],
    })
    .fetchAll();

  return resources[0] || null;
}

module.exports = {
  findPostBySlug,
  getPostsContainer,
};
