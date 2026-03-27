import { CosmosClient, type Container } from "@azure/cosmos";

export type BlogPostStatus = "draft" | "published";

export interface BlogPostDocument {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  author: string;
  tags: string[];
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  status: BlogPostStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

const DATABASE_ID = "sinverguenza-blog";
const POSTS_CONTAINER_ID = "posts";

let cosmosClient: CosmosClient | undefined;

function getCosmosClient(): CosmosClient {
  if (cosmosClient) {
    return cosmosClient;
  }

  const { COSMOS_ENDPOINT, COSMOS_KEY } = import.meta.env;

  if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
    throw new Error(
      "Missing Cosmos DB credentials. Set COSMOS_ENDPOINT and COSMOS_KEY in your environment.",
    );
  }

  cosmosClient = new CosmosClient({
    endpoint: COSMOS_ENDPOINT,
    key: COSMOS_KEY,
  });

  return cosmosClient;
}

export function getPostsContainer(): Container {
  return getCosmosClient().database(DATABASE_ID).container(POSTS_CONTAINER_ID);
}
