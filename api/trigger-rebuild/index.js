const { requireAdminRequest } = require("../shared/auth");
const { ApiError, handleError, json } = require("../shared/errors");

const DISPATCH_URL =
  "https://api.github.com/repos/aesirtechnology/sinverguenza-astro/dispatches";

module.exports = async function (context, req) {
  try {
    const adminUser = requireAdminRequest(req);
    const token = process.env.GH_PAT;

    if (!token) {
      throw new ApiError(
        500,
        "Missing GH_PAT environment variable for rebuild triggering.",
      );
    }

    const response = await fetch(DISPATCH_URL, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        client_payload: {
          source: "admin-dashboard",
          triggeredBy: adminUser.email,
        },
        event_type: "rebuild",
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      context.log.error(
        "GitHub repository dispatch failed:",
        response.status,
        responseBody,
      );

      throw new ApiError(
        502,
        "GitHub Actions rebuild trigger failed. You can save the post, but the rebuild may need to be triggered manually.",
      );
    }

    json(context, 200, {
      message: "Site rebuild triggered successfully.",
    });
  } catch (error) {
    handleError(context, error);
  }
};
