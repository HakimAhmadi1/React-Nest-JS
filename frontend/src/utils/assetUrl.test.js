import { describe, expect, it } from "vitest";
import { assetUrl } from "./assetUrl";

describe("assetUrl", () => {
  it("prefixes a relative upload path with the asset origin", () => {
    expect(assetUrl("/uploads/photo.png")).toBe(
      "http://localhost:3003/uploads/photo.png",
    );
  });

  it("leaves an absolute URL alone (e.g. Cloudinary)", () => {
    const remote = "https://res.cloudinary.com/demo/image/upload/photo.png";
    expect(assetUrl(remote)).toBe(remote);
  });

  it("returns an empty string for a missing url", () => {
    expect(assetUrl(undefined)).toBe("");
    expect(assetUrl("")).toBe("");
  });
});
