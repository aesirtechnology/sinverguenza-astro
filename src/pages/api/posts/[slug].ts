import type { APIRoute } from "astro";
import { ApiError, handleApiError, jsonResponse } from "../../../lib/api";
import {
  applyBlogPostUpdate,
  parseRequestJson,
  parseUpdateBlogPostInput,
} from "../../../lib/blog-posts";
import { getPostsContainer, type BlogPostDocument } from "../../../lib/cosmos";

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

function requireSlug(slug: string | undefined): string {
  if (!slug) {
    throw new ApiError(400, "A post slug is required.");
  }

  return slug;
}

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = requireSlug(params.slug);
    const container = getPostsContainer();
    const { resources } = await container.items
      .query<BlogPostDocument>({
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

    return jsonResponse(post);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const slug = requireSlug(params.slug);
    const existingPost = await findPostBySlug(slug);

    if (!existingPost) {
      throw new ApiError(404, "Post not found.");
    }

    const payload = await parseRequestJson(request);
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
      .replace<BlogPostDocument>(updatedPost);

    if (!resource) {
      throw new Error("Cosmos DB did not return the updated blog post.");
    }

    return jsonResponse(resource);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const slug = requireSlug(params.slug);
    const existingPost = await findPostBySlug(slug);

    if (!existingPost) {
      throw new ApiError(404, "Post not found.");
    }

    const container = getPostsContainer();
    await container.item(existingPost.id, existingPost.slug).delete();

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
};
