// Note: Azure Static Web Apps uses the root /api Azure Functions in production.
// This Astro endpoint remains available for local Node-based development.
import type { APIRoute } from "astro";
import { ApiError, handleApiError, jsonResponse } from "../../../lib/api";
import { requireAdminRequest } from "../../../lib/auth";
import {
  buildBlogPostDocument,
  parseCreateBlogPostInput,
  parseRequestJson,
} from "../../../lib/blog-posts";
import { getPostsContainer } from "../../../lib/cosmos";
import type { BlogPostDocument } from "../../../lib/blog-types";

export const prerender = false;

async function findPostBySlug(slug: string): Promise<BlogPostDocument | null> {
  const container = getPostsContainer();
  const { resources } = await container.items
    .query<BlogPostDocument>({
      query: "SELECT TOP 1 * FROM c WHERE c.slug = @slug",
      parameters: [{ name: "@slug", value: slug }],
    })
    .fetchAll();

  return resources[0] ?? null;
}

export const GET: APIRoute = async () => {
  try {
    const container = getPostsContainer();
    const { resources } = await container.items
      .query<BlogPostDocument>({
        query:
          "SELECT * FROM c WHERE c.status = @status ORDER BY c.publishedAt DESC",
        parameters: [{ name: "@status", value: "published" }],
      })
      .fetchAll();

    return jsonResponse(resources);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    requireAdminRequest(request);

    const payload = await parseRequestJson(request);
    const input = parseCreateBlogPostInput(payload);

    if (await findPostBySlug(input.slug)) {
      throw new ApiError(409, "A post with that slug already exists.");
    }

    const container = getPostsContainer();
    const document = buildBlogPostDocument(input);
    const { resource } = await container.items.create<BlogPostDocument>(document);

    if (!resource) {
      throw new Error("Cosmos DB did not return the created blog post.");
    }

    return new Response(JSON.stringify(resource), {
      status: 201,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Location: `/api/posts/${resource.slug}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
