import { generate, parseBool } from "./generate.js";

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
    season: input("season", "none"),
    time: input("time", "auto"),
    timezone: input("timezone", "UTC"),
    weather: parseBool(input("weather"), true),
    farmer: {
      hat: input("farmer_hat"),
      shirt: input("farmer_shirt"),
      overalls: input("farmer_overalls"),
    },
  });
  console.log(`🌱 Farm planted at ${r.out} (${r.total} contributions, crops: ${r.crops.join(" + ")}, ${r.time})`);
} catch (e) {
  console.log(`::error::${e.message}`);
  process.exit(1);
}
