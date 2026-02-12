import { afterEach, describe, expect, it } from "bun:test";
import { getS3Url } from "./s3-helpers";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  CDN_URL: process.env.CDN_URL,
  S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_BUCKET: process.env.S3_BUCKET,
};

afterEach(() => {
  process.env.NODE_ENV = originalEnv.NODE_ENV;
  process.env.CDN_URL = originalEnv.CDN_URL;
  process.env.S3_PUBLIC_URL = originalEnv.S3_PUBLIC_URL;
  process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
  process.env.S3_ENDPOINT = originalEnv.S3_ENDPOINT;
  process.env.S3_BUCKET = originalEnv.S3_BUCKET;
});

describe("getS3Url", () => {
  it("returns full URLs unchanged", () => {
    const url = getS3Url("https://cdn.example.com/products/p1.jpg");
    expect(url).toBe("https://cdn.example.com/products/p1.jpg");
  });

  it("prefers S3_PUBLIC_URL as a stable base in development", () => {
    process.env.NODE_ENV = "development";
    process.env.CDN_URL = "";
    process.env.S3_PUBLIC_URL = "https://media.example.com/assets/";
    process.env.SUPABASE_URL = "http://127.0.0.1:54321/rest/v1";
    process.env.S3_ENDPOINT = "";
    process.env.S3_BUCKET = "kinedao-assets";

    const url = getS3Url("/products/p1/images/original/a.jpg");
    expect(url).toBe(
      "https://media.example.com/assets/products/p1/images/original/a.jpg"
    );
  });

  it("builds correct public URL when SUPABASE_URL contains /rest/v1", () => {
    process.env.NODE_ENV = "development";
    process.env.CDN_URL = "";
    process.env.S3_PUBLIC_URL = "";
    process.env.SUPABASE_URL = "http://127.0.0.1:54321/rest/v1";
    process.env.S3_ENDPOINT = "";
    process.env.S3_BUCKET = "kinedao-assets";

    const url = getS3Url("products/p1/images/original/a.jpg");
    expect(url).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/kinedao-assets/products/p1/images/original/a.jpg"
    );
  });

  it("builds correct public URL when only S3_ENDPOINT contains /storage/v1/s3", () => {
    process.env.NODE_ENV = "development";
    process.env.CDN_URL = "";
    process.env.S3_PUBLIC_URL = "";
    process.env.SUPABASE_URL = "";
    process.env.S3_ENDPOINT = "http://127.0.0.1:54321/storage/v1/s3";
    process.env.S3_BUCKET = "kinedao-assets";

    const url = getS3Url("products/p1/images/original/a.jpg");
    expect(url).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/kinedao-assets/products/p1/images/original/a.jpg"
    );
  });
});
