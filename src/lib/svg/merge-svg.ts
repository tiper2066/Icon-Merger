export type MergeSvgIcon = {
  svgContent: string;
  width: number;
  height: number;
};

export type MainMergeSvgIcon = MergeSvgIcon & {
  anchorX: number | null;
  anchorY: number | null;
};

export type MergedSvgResult = {
  svgContent: string;
  width: number;
  height: number;
  viewBox: string;
};

type SvgParts = {
  innerSvg: string;
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export function mergeSvgsByAnchor(
  mainIcon: MainMergeSvgIcon,
  resourceIcon: MergeSvgIcon,
) {
  if (mainIcon.anchorX === null || mainIcon.anchorY === null) {
    return null;
  }

  const main = readSvgParts(mainIcon.svgContent, mainIcon);
  const resource = readSvgParts(resourceIcon.svgContent, resourceIcon);
  const anchorX = mainIcon.anchorX - main.minX;
  const anchorY = mainIcon.anchorY - main.minY;
  const resultWidth = Math.max(main.width, anchorX + resource.width);
  const resultHeight = Math.max(main.height, anchorY + resource.height);
  const viewBox = `0 0 ${formatNumber(resultWidth)} ${formatNumber(resultHeight)}`;
  const svgContent = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${formatNumber(resultWidth)}" height="${formatNumber(resultHeight)}">`,
    `<g data-layer="main" transform="translate(${formatNumber(-main.minX)} ${formatNumber(-main.minY)})">`,
    main.innerSvg,
    "</g>",
    `<g data-layer="merge" transform="translate(${formatNumber(anchorX - resource.minX)} ${formatNumber(anchorY - resource.minY)})">`,
    resource.innerSvg,
    "</g>",
    "</svg>",
  ].join("");

  return {
    svgContent,
    width: resultWidth,
    height: resultHeight,
    viewBox,
  } satisfies MergedSvgResult;
}

function readSvgParts(svgContent: string, fallback: MergeSvgIcon): SvgParts {
  const openingTag = svgContent.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const viewBox = getAttribute(openingTag, "viewBox");
  const [minX, minY, width, height] = viewBox
    ? parseViewBox(viewBox, fallback)
    : [0, 0, fallback.width, fallback.height];

  return {
    innerSvg: extractSvgInnerContent(svgContent),
    minX,
    minY,
    width,
    height,
  };
}

function extractSvgInnerContent(svgContent: string) {
  return svgContent
    .replace(/^<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
    .trim();
}

function parseViewBox(viewBox: string, fallback: MergeSvgIcon) {
  const values = viewBox.trim().split(/[\s,]+/).map(Number);

  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return [0, 0, fallback.width, fallback.height];
  }

  return values;
}

function getAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}=["']([^"']+)["']`, "i"));

  return match?.[1] ?? null;
}

function formatNumber(value: number) {
  return Number(value.toFixed(3)).toString();
}
