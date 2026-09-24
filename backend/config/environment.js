const requiredNames = [
  "NODE_ENV",
  "MONGO_URI",
  "UPSTASH_REDIS_URL",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
];
const allowedNodeEnvironments = ["development", "test", "production"];

export function isProductionEnvironment(nodeEnv = process.env.NODE_ENV) {
  if (!allowedNodeEnvironments.includes(nodeEnv)) {
    throw new Error("Invalid environment variables: NODE_ENV");
  }
  return nodeEnv === "production";
}

function hasProtocol(value, protocols) {
  try {
    const parsed = new URL(value);
    return protocols.includes(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function loadEnvironment(source = process.env) {
  const missing = requiredNames.filter((name) => !source[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const port = Number(source.PORT || 10007);
  const invalid = [];
  if (!allowedNodeEnvironments.includes(source.NODE_ENV)) invalid.push("NODE_ENV");
  if (!Number.isInteger(port) || port < 1 || port > 65535) invalid.push("PORT");
  if (!hasProtocol(source.MONGO_URI, ["mongodb:", "mongodb+srv:"])) invalid.push("MONGO_URI");

  let redisValid = false;
  try {
    const redisUrl = new URL(source.UPSTASH_REDIS_URL);
    redisValid = redisUrl.protocol === "rediss:" && Boolean(redisUrl.hostname) && Boolean(redisUrl.password);
  } catch {
    redisValid = false;
  }
  if (!redisValid) invalid.push("UPSTASH_REDIS_URL");

  if (source.ACCESS_TOKEN_SECRET.length < 32) invalid.push("ACCESS_TOKEN_SECRET");
  if (source.REFRESH_TOKEN_SECRET.length < 32) invalid.push("REFRESH_TOKEN_SECRET");
  if (source.ACCESS_TOKEN_SECRET === source.REFRESH_TOKEN_SECRET) invalid.push("JWT_SECRETS_MUST_DIFFER");
  if (!source.IMAGEKIT_PUBLIC_KEY.startsWith("public_")) invalid.push("IMAGEKIT_PUBLIC_KEY");
  if (!source.IMAGEKIT_PRIVATE_KEY.startsWith("private_")) invalid.push("IMAGEKIT_PRIVATE_KEY");
  if (!hasProtocol(source.IMAGEKIT_URL_ENDPOINT, ["https:"])) invalid.push("IMAGEKIT_URL_ENDPOINT");

  if (invalid.length > 0) {
    throw new Error(`Invalid environment variables: ${invalid.join(", ")}`);
  }

  return {
    nodeEnv: source.NODE_ENV,
    port,
  };
}
