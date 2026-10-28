import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { buildFarm, parseBool } from "./farm.js";

export { parseBool };

/**
 * Build the farm SVG and write it to `out`.
 * Options mirror the Action inputs; everything except `user` is optional.
 */
export async function generate({ out = "dist/farm.svg", ...options }) {
  const farm = await buildFarm(options);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, farm.svg);
  return { out, crops: farm.crops, time: farm.time, total: farm.total, bytes: Buffer.byteLength(farm.svg) };
}
