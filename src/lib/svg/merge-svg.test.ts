import { describe, expect, it } from "vitest";

import { mergeSvgsByAnchor } from "./merge-svg";

describe("mergeSvgsByAnchor", () => {
  it("returns null when the main icon does not have anchor coordinates", () => {
    const result = mergeSvgsByAnchor(
      {
        anchorX: null,
        anchorY: 4,
        height: 10,
        svgContent: '<svg viewBox="0 0 10 10"><rect width="10" height="10" /></svg>',
        width: 10,
      },
      {
        height: 4,
        svgContent: '<svg viewBox="0 0 4 4"><circle cx="2" cy="2" r="2" /></svg>',
        width: 4,
      },
    );

    expect(result).toBeNull();
  });

  it("aligns the resource top-left to the main icon anchor and expands the result bounds", () => {
    const result = mergeSvgsByAnchor(
      {
        anchorX: 3,
        anchorY: 4,
        height: 12,
        svgContent: '<svg viewBox="-2 -3 10 12"><rect x="-2" y="-3" width="10" height="12" /></svg>',
        width: 10,
      },
      {
        height: 9,
        svgContent: '<svg viewBox="1 2 8 9"><path d="M1 2h8v9H1z" /></svg>',
        width: 8,
      },
    );

    expect(result).toMatchObject({
      height: 16,
      viewBox: "0 0 13 16",
      width: 13,
    });
    expect(result?.svgContent).toContain('data-layer="main" transform="translate(2 3)"');
    expect(result?.svgContent).toContain('data-layer="merge" transform="translate(4 5)"');
  });
});
