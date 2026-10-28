import { generate } from "./generate.js";

const input = (name, fallback) => {
  const v = process.env[`INPUT_${name.toUpperCase()}`];
  return v && v.trim() ? v.trim() : fallback;
};

try {
  const r = await generate({
    user: input("github_user_name"),
    token: input("github_token"),
    out: input("output", "dist/farm.svg"),
    crop: input("crop", "auto"),
  });
  console.log(`🌱 Farm planted at ${r.out} (${r.total} contributions, crop: ${r.crop})`);
} catch (e) {
  console.log(`::error::${e.message}`);
  process.exit(1);
}
