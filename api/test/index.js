module.exports = async function (context) {
  context.res = {
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
  };
};
