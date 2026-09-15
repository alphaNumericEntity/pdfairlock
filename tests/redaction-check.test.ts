import { describe, expect, it } from "vitest";
import { darkMask, findDarkRects, hiddenText } from "../src/lib/pdf/redaction-check";

function canvas(width: number, height: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  data.fill(255);
  return data;
}

function paint(
  data: Uint8ClampedArray,
  width: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
  value: number,
) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const p = (y * width + x) * 4;
      data[p] = value;
      data[p + 1] = value;
      data[p + 2] = value;
      data[p + 3] = 255;
    }
  }
}

describe("findDarkRects", () => {
  it("finds a solid black rectangle and ignores glyph-sized specks", () => {
    const width = 200;
    const height = 100;
    const data = canvas(width, height);
    paint(data, width, 20, 30, 80, 12, 0);
    paint(data, width, 150, 50, 3, 4, 0);
    paint(data, width, 160, 50, 2, 6, 0);
    const rects = findDarkRects(darkMask(data, width, height), width, height);
    expect(rects).toHaveLength(1);
    expect(rects[0].x).toBeCloseTo(20 / width, 5);
    expect(rects[0].y).toBeCloseTo(30 / height, 5);
    expect(rects[0].w).toBeCloseTo(80 / width, 5);
    expect(rects[0].h).toBeCloseTo(12 / height, 5);
  });

  it("ignores dark shapes that are not filled rectangles", () => {
    const width = 200;
    const height = 100;
    const data = canvas(width, height);
    paint(data, width, 20, 20, 60, 2, 0);
    paint(data, width, 20, 20, 2, 40, 0);
    expect(findDarkRects(darkMask(data, width, height), width, height)).toHaveLength(0);
  });

  it("ignores a rectangle covering most of the page", () => {
    const width = 100;
    const height = 100;
    const data = canvas(width, height);
    paint(data, width, 5, 5, 90, 90, 0);
    expect(findDarkRects(darkMask(data, width, height), width, height)).toHaveLength(0);
  });

  it("treats mid-grey as not dark", () => {
    const width = 100;
    const height = 50;
    const data = canvas(width, height);
    paint(data, width, 10, 10, 50, 10, 128);
    expect(findDarkRects(darkMask(data, width, height), width, height)).toHaveLength(0);
  });
});

describe("hiddenText", () => {
  const width = 200;
  const height = 100;

  function check(data: Uint8ClampedArray, items: Parameters<typeof hiddenText>[0]) {
    const dark = darkMask(data, width, height);
    return hiddenText(items, findDarkRects(dark, width, height), dark, width, height);
  }

  it("reports only the covered words of a run that is partly under a box", () => {
    const data = canvas(width, height);
    paint(data, width, 66, 30, 114, 12, 0);
    const run = {
      str: "Name: Jane Exampleton",
      x: 20 / width,
      y: 32 / height,
      w: 160 / width,
      h: 8 / height,
    };
    const beside = {
      str: "Date of birth",
      x: 20 / width,
      y: 60 / height,
      w: 100 / width,
      h: 8 / height,
    };
    expect(check(data, [run, beside])).toEqual(["Jane Exampleton"]);
  });

  it("does not report light text on a dark band", () => {
    const data = canvas(width, height);
    paint(data, width, 0, 0, width, 20, 0);
    paint(data, width, 30, 6, 2, 8, 255);
    paint(data, width, 36, 6, 2, 8, 255);
    paint(data, width, 42, 6, 2, 8, 255);
    const title = { str: "REPORT", x: 28 / width, y: 5 / height, w: 20 / width, h: 10 / height };
    expect(check(data, [title])).toEqual([]);
  });

  it("dedupes repeated snippets and trims them", () => {
    const data = canvas(width, height);
    paint(data, width, 0, 30, width, 20, 0);
    const a = { str: "  secret  ", x: 10 / width, y: 32 / height, w: 30 / width, h: 8 / height };
    const b = { str: "secret", x: 60 / width, y: 32 / height, w: 30 / width, h: 8 / height };
    expect(check(data, [a, b])).toEqual(["secret"]);
  });
});
