import type { APIRoute } from "astro";
import { handleApiError, jsonResponse } from "../../../lib/api";
import { getPostsContainer, type BlogPostDocument } from "../../../lib/cosmos";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const container = getPostsContainer();
    const { resources } = await container.items
      .query<BlogPostDocument>({
        query:
          "SELECT * FROM c WHERE c.status = @status ORDER BY c.updatedAt DESC",
        parameters: [{ name: "@status", value: "draft" }],
      })
      .fetchAll();

    return jsonResponse(resources);
  } catch (error) {
    return handleApiError(error);
  }
};
