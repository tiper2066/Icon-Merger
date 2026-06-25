import { describe, expect, it } from "vitest";

import { processSvgFile, SvgProcessingError } from "./process-svg";

function createSvgFile(svg: string, options: { name?: string; type?: string } = {}) {
  return new File([svg], options.name ?? "sample.svg", {
    type: options.type ?? "image/svg+xml",
  });
}

describe("processSvgFile", () => {
  it("sanitizes unsafe SVG content and normalizes root metadata", async () => {
    const result = await processSvgFile({
      file: createSvgFile(`
        <svg width="24" height="16" onload="alert(1)">
          <script>alert(1)</script>
          <path d="M0 0h24v16H0z" fill="#111" />
        </svg>
      `),
    });

    expect(result).toMatchObject({
      name: "sample",
      viewBox: "0 0 24 16",
      width: 24,
      height: 16,
    });
    expect(result.svgContent).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" width="24" height="16">',
    );
    expect(result.svgContent).not.toContain("onload");
    expect(result.svgContent).not.toContain("<script");
  });

  it("uses a valid viewBox as the normalized dimensions", async () => {
    const result = await processSvgFile({
      file: createSvgFile('<svg viewBox="-2 -4 32 40"><rect width="32" height="40" /></svg>'),
    });

    expect(result.viewBox).toBe("-2 -4 32 40");
    expect(result.width).toBe(32);
    expect(result.height).toBe(40);
  });

  it("rejects non-SVG files before parsing", async () => {
    await expect(
      processSvgFile({
        file: createSvgFile("<svg />", { name: "sample.txt", type: "text/plain" }),
      }),
    ).rejects.toThrow(SvgProcessingError);
  });

  it("rejects external or JavaScript references after sanitizing", async () => {
    await expect(
      processSvgFile({
        file: createSvgFile('<svg width="24" height="24"><path fill="url(https://example.com/a)" /></svg>'),
      }),
    ).rejects.toThrow("외부 URL 또는 JavaScript 참조가 포함된 SVG는 업로드할 수 없습니다.");
  });
});
