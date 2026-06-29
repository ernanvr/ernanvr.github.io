// Font: IBM Plex Mono (Regular 400, Bold 700), full TTF.
// Source: https://github.com/IBM/plex (packages/plex-mono/fonts/complete/ttf)
// License: SIL Open Font License 1.1 — see src/assets/fonts/OFL.txt

import type { FontStyle, FontWeight } from "satori";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type FontOptions = {
  name: string;
  data: ArrayBuffer;
  weight: FontWeight | undefined;
  style: FontStyle | undefined;
};

function findProjectRoot(start: string): string {
  let dir = start;
  while (dir !== "/" && !existsSync(resolve(dir, "package.json"))) {
    dir = dirname(dir);
  }
  return dir;
}

const FONTS_DIR = resolve(
  findProjectRoot(dirname(fileURLToPath(import.meta.url))),
  "src/assets/fonts"
);

let cache: FontOptions[] | null = null;

export default function loadLocalFonts(): FontOptions[] {
  if (cache) return cache;

  const read = (
    file: string,
    weight: FontWeight,
    style: FontStyle
  ): FontOptions => {
    const buf = readFileSync(resolve(FONTS_DIR, file));
    const data = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength
    ) as ArrayBuffer;

    return { name: "IBM Plex Mono", data, weight, style };
  };

  cache = [
    read("IBMPlexMono-Regular.ttf", 400, "normal"),
    read("IBMPlexMono-Bold.ttf", 700, "bold"),
  ];

  return cache;
}
