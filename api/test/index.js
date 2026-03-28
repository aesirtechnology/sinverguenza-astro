const { app } = require("@azure/functions");

app.http("test", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "test",
  handler: async () => ({
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      status: "ok",
      env_check: {
        has_cosmos_endpoint: Boolean(process.env.COSMOS_ENDPOINT),
        has_cosmos_key: Boolean(process.env.COSMOS_KEY),
      },
    }),
  }),
});
