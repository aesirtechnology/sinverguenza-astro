const { Buffer } = require("node:buffer");
const { ApiError } = require("./errors");

function isAuthDisabled() {
  return String(process.env.AUTH_DISABLED || "").toLowerCase() === "true";
}

function getAllowedAdminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function decodeClientPrincipal(value) {
  try {
    const decoded = Buffer.from(value, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getHeader(req, name) {
  return req.headers?.[name] ?? req.headers?.[name.toLowerCase()] ?? undefined;
}

function getRequestEmail(req, principal) {
  const headerEmail = getHeader(req, "x-ms-client-principal-name");
  return String(headerEmail || principal?.userDetails || "").trim().toLowerCase();
}

function requireAdminRequest(req) {
  if (isAuthDisabled()) {
    return {
      email: "local-admin@sinverguenza.dev",
      identityProvider: "local-dev",
      roles: ["authenticated", "admin"],
      userId: "local-admin",
    };
  }

  const allowedEmails = getAllowedAdminEmails();

  if (allowedEmails.size === 0) {
    throw new ApiError(500, "ADMIN_EMAILS is required when auth is enabled.");
  }

  const principalHeader = getHeader(req, "x-ms-client-principal");
  const principal = principalHeader ? decodeClientPrincipal(principalHeader) : null;
  const email = getRequestEmail(req, principal);

  if (!email) {
    throw new ApiError(401, "Authentication required.");
  }

  if (!allowedEmails.has(email)) {
    throw new ApiError(
      403,
      "Your account is not authorized for the admin dashboard.",
    );
  }

  return {
    email,
    identityProvider: principal?.identityProvider || "unknown",
    roles: principal?.userRoles || ["authenticated"],
    userId: principal?.userId || email,
  };
}

module.exports = {
  requireAdminRequest,
};
