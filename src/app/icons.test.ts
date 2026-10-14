import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const file = (name: string) => fileURLToPath(new URL(name, import.meta.url));

describe("site icons", () => {
  it("no longer ships the default Next.js / Vercel favicon", () => {
    expect(existsSync(file("favicon.ico"))).toBe(false);
  });

  it("uses the orange R as the browser tab icon", () => {
    const svg = readFileSync(file("icon.svg"), "utf8");
    expect(svg).toContain('viewBox="0 0 32 32"');
    expect(svg).toContain("#c2410c");
  });

  it("has a 180 × 180 PNG for phone home screens", () => {
    const png = readFileSync(file("apple-icon.png"));
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    // Width and height sit in the IHDR chunk, right after the 16-byte header.
    expect(png.readUInt32BE(16)).toBe(180);
    expect(png.readUInt32BE(20)).toBe(180);
  });
});
