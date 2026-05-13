import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Did you create .env.local?");
    process.exit(1);
  }
  const sql = postgres(url, { ssl: "require", max: 1, prepare: false });

  try {
    await sql`DELETE FROM briefings`;
    await sql`DELETE FROM holdings`;

    await sql`
      INSERT INTO holdings (ticker, shares, cost_basis_per_share, notes)
      VALUES ('NVDA', 50, 480, 'AI compute thesis — long-term')
    `;
    await sql`
      INSERT INTO holdings (ticker, shares, cost_basis_per_share, notes)
      VALUES ('AAPL', 100, 172, NULL)
    `;
    await sql`
      INSERT INTO holdings (ticker, shares, cost_basis_per_share, notes)
      VALUES ('VOO', NULL, NULL, 'Index core position')
    `;

    const rows = await sql`SELECT COUNT(*)::int AS n FROM holdings`;
    console.log(`Seeded ${rows[0].n} holdings.`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
