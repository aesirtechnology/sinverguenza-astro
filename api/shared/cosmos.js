const { CosmosClient } = require("@azure/cosmos");
const { ApiError } = require("./errors");

const DATABASE_ID = "sinverguenza-blog";
const POSTS_CONTAINER_ID = "posts";

let cosmosClient;

function getCosmosClient() {
  if (cosmosClient) {
    return cosmosClient;
  }

  try {
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
  } catch (error) {
    throw new ApiError(
      500,
      "Connection failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}

function getPostsContainer() {
  try {
    return getCosmosClient().database(DATABASE_ID).container(POSTS_CONTAINER_ID);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      "Connection failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}

async function findPostBySlug(slug) {
  try {
    const container = getPostsContainer();
    const { resources } = await container.items
      .query({
        query: "SELECT TOP 1 * FROM c WHERE c.slug = @slug",
        parameters: [{ name: "@slug", value: slug }],
      })
      .fetchAll();

    return resources[0] || null;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      "Connection failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}

module.exports = {
  findPostBySlug,
  getPostsContainer,
};
