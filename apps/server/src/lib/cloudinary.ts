import { v2 as cloudinary } from "cloudinary";
import { env } from "@kineDao.com/env/server";

export const CLOUDINARY_REFERENCE_PREFIX = "cloudinary://";
export const CLOUDINARY_PRIVATE_REFERENCE_PREFIX = "cloudinary-private://";

function configuredCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function cloudinaryPublicReference(resourceType: "image" | "raw", publicId: string): string {
  return `${CLOUDINARY_REFERENCE_PREFIX}${resourceType}/${publicId}`;
}

export function cloudinaryPrivateReference(value: {
  publicId: string;
  format: string;
  resourceType: "image" | "raw";
}): string {
  return `${CLOUDINARY_PRIVATE_REFERENCE_PREFIX}${encodeURIComponent(JSON.stringify(value))}`;
}

export function isCloudinaryReference(value: string): boolean {
  return value.startsWith(CLOUDINARY_REFERENCE_PREFIX);
}

export function parseCloudinaryReference(
  value: string,
): { resourceType: "image" | "raw"; publicId: string } | null {
  if (!isCloudinaryReference(value)) return null;
  const [resourceType, ...publicIdParts] = value
    .slice(CLOUDINARY_REFERENCE_PREFIX.length)
    .split("/");
  if ((resourceType !== "image" && resourceType !== "raw") || !publicIdParts.length) return null;
  return { resourceType, publicId: publicIdParts.join("/") };
}

export async function uploadToCloudinary(
  file: File,
  options: { publicId: string; privateAsset: boolean },
): Promise<{ publicId: string; format: string; resourceType: "image" | "raw"; secureUrl: string }> {
  const client = configuredCloudinary();
  const resourceType = file.type === "application/pdf" ? "raw" : "image";
  const bytes = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        public_id: options.publicId,
        resource_type: resourceType,
        type: options.privateAsset ? "authenticated" : "upload",
        overwrite: false,
      },
      (error, result) => {
        if (error || !result)
          return reject(error ?? new Error("Cloudinary returned no upload result"));
        resolve({
          publicId: result.public_id,
          format: result.format,
          resourceType,
          secureUrl: result.secure_url,
        });
      },
    );
    stream.end(bytes);
  });
}

export async function deleteCloudinaryReference(reference: string): Promise<void> {
  const parsed = parseCloudinaryReference(reference);
  if (!parsed) return;
  await configuredCloudinary().uploader.destroy(parsed.publicId, {
    resource_type: parsed.resourceType,
  });
}

export function signedPrivateCloudinaryUrl(reference: string): string | null {
  if (!reference.startsWith(CLOUDINARY_PRIVATE_REFERENCE_PREFIX)) return null;
  const payload = JSON.parse(
    decodeURIComponent(reference.slice(CLOUDINARY_PRIVATE_REFERENCE_PREFIX.length)),
  ) as {
    publicId: string;
    format: string;
    resourceType: "image" | "raw";
  };
  return configuredCloudinary().utils.private_download_url(payload.publicId, payload.format, {
    resource_type: payload.resourceType,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  });
}
