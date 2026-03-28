const { app } = require("@azure/functions");
const { BlobServiceClient } = require("@azure/storage-blob");
const { requireAdminRequest } = require("../shared/auth");
const { ApiError, handleError, json } = require("../shared/errors");
const {
  createLegacyContext,
  createLegacyRequest,
} = require("../shared/v4-http");

const CONTAINER_NAME = "images";
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function createUniqueFilename(file) {
  const timestamp = Date.now();
  const originalName = sanitizeFilename(file.name || "upload");
  const fallbackExtension = file.type.split("/")[1] || "bin";
  const hasExtension = /\.[a-z0-9]+$/i.test(originalName);
  const finalName = hasExtension
    ? originalName
    : `${originalName}.${fallbackExtension}`;

  return `${timestamp}-${finalName}`;
}

function getUploadedFile(formData) {
  const preferredFile = formData.get("file");

  if (preferredFile && typeof preferredFile === "object" && "arrayBuffer" in preferredFile) {
    return preferredFile;
  }

  for (const value of formData.values()) {
    if (value && typeof value === "object" && "arrayBuffer" in value) {
      return value;
    }
  }

  return null;
}

app.http("upload-image", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "upload-image",
  handler: async (request, context) => {
    const legacyContext = createLegacyContext(context);

    try {
      requireAdminRequest(createLegacyRequest(request, undefined));

      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

      if (!connectionString) {
        throw new ApiError(
          500,
          "Image upload is not configured.",
          "Missing AZURE_STORAGE_CONNECTION_STRING environment variable.",
        );
      }

      const formData = await request.formData();
      const file = getUploadedFile(formData);

      if (!file) {
        throw new ApiError(400, "An image file is required.");
      }

      const mimeType = String(file.type || "").toLowerCase();

      if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
        throw new ApiError(
          400,
          "Unsupported image type.",
          "Allowed types: jpg, jpeg, png, gif, webp.",
        );
      }

      const blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const filename = createUniqueFilename(file);
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      const buffer = Buffer.from(await file.arrayBuffer());

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
        },
      });

      json(legacyContext, 200, {
        url: blockBlobClient.url,
      });
      return legacyContext.res;
    } catch (error) {
      handleError(legacyContext, error);
      return legacyContext.res;
    }
  },
});
