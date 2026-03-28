// Note: Azure Static Web Apps uses the root /api Azure Functions in production.
// This Astro endpoint remains available for local Node-based development.
import type { APIRoute } from 'astro';
import { ApiError, handleApiError, jsonResponse } from '../../lib/api';
import { requireAdminRequest } from '../../lib/auth';

const DISPATCH_URL =
  'https://api.github.com/repos/aesirtechnology/sinverguenza-astro/dispatches';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const adminUser = requireAdminRequest(request);
    const token = import.meta.env.GH_PAT;

    if (!token) {
      throw new ApiError(
        500,
        'Missing GH_PAT environment variable for rebuild triggering.',
      );
    }

    const response = await fetch(DISPATCH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        client_payload: {
          source: 'admin-dashboard',
          triggeredBy: adminUser.email,
        },
        event_type: 'rebuild',
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      console.error('GitHub repository dispatch failed:', response.status, responseBody);

      throw new ApiError(
        502,
        'GitHub Actions rebuild trigger failed. You can save the post, but the rebuild may need to be triggered manually.',
      );
    }

    return jsonResponse({
      message: 'Site rebuild triggered successfully.',
    });
  } catch (error) {
    return handleApiError(error);
  }
};
