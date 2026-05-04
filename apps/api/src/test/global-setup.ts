export async function setup() {
  process.env.AI_API_KEY ??= "test-key";
  process.env.AI_MODEL ??= "test-model";
  process.env.CORS_ORIGIN ??= "http://localhost:3000";
}

export async function teardown() {}
