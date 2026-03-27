import type { APIRoute } from "astro";
import { handleApiError, jsonResponse } from "../../../lib/api";
import { requireAdminRequest } from "../../../lib/auth";
import { getPostsContainer } from "../../../lib/cosmos";
import type { BlogPostDocument } from "../../../lib/blog-types";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    requireAdminRequest(request);

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
