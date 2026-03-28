class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

function json(context, status, data, extraHeaders = {}) {
  context.res = {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
    body: JSON.stringify(data),
  };
}

function noContent(context) {
  context.res = {
    status: 204,
    body: null,
  };
}

function handleError(context, error) {
  if (error instanceof ApiError) {
    json(context, error.statusCode, { error: error.message });
    return;
  }

  context.log.error(error);
  json(context, 500, { error: "Internal server error" });
}

module.exports = {
  ApiError,
  handleError,
  json,
  noContent,
};
