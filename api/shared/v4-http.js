function createLegacyContext(context) {
  return {
    log: {
      error: (...args) => context.error(...args),
    },
    res: null,
  };
}

function createLegacyRequest(request, body) {
  return {
    body,
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    query: Object.fromEntries(request.query.entries()),
    url: request.url,
  };
}

async function parseJsonBody(request) {
  const rawBody = await request.text();

  if (!rawBody) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

module.exports = {
  createLegacyContext,
  createLegacyRequest,
  parseJsonBody,
};
