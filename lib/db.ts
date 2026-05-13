import postgres, { type Sql } from "postgres";

declare global {
  var __sql: Sql | undefined;
}

function makeClient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return postgres(url, {
    ssl: "require",
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
}

// globalThis cache survives Next.js dev HMR module reloads.
export function getSql(): Sql {
  if (!globalThis.__sql) {
    globalThis.__sql = makeClient();
  }
  return globalThis.__sql;
}
