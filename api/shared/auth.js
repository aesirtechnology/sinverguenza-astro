const { Buffer } = require("node:buffer");
const { ApiError } = require("./errors");

function isAuthDisabled() {
  return String(process.env.AUTH_DISABLED || "").toLowerCase() === "true";
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

  const principalHeader = getHeader(req, "x-ms-client-principal");

  if (!principalHeader) {
    throw new ApiError(401, "Authentication required.");
  }

  const principal = principalHeader ? decodeClientPrincipal(principalHeader) : null;

  if (!principal) {
    throw new ApiError(401, "Authentication required.");
  }

  const email = getRequestEmail(req, principal);

  return {
    email: email || principal.userDetails || "",
    identityProvider: principal?.identityProvider || "unknown",
    roles: principal?.userRoles || ["authenticated"],
    userId: principal?.userId || email || "authenticated-user",
  };
}

module.exports = {
  requireAdminRequest,
};
