import Link from "next/link";
import { getSql } from "@/lib/db";
import type { Holding } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddHoldingForm } from "./_components/AddHoldingForm";
import { EditHoldingDialog } from "./_components/EditHoldingDialog";
import { LogoutButton } from "./_components/LogoutButton";

export const dynamic = "force-dynamic";

type Row = Holding & { created_at: Date };

export default async function HomePage() {
  const sql = getSql();
  const rows = (await sql<Row[]>`
    SELECT id, ticker, shares, cost_basis_per_share, notes, created_at
    FROM holdings
    ORDER BY ticker
  `) as unknown as Row[];

  return (
    <div className="container py-8 max-w-5xl">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">📊 Portfolio Brief</h1>
        <div className="flex items-center gap-2">
          <Link href="/logs" className="text-sm text-muted-foreground hover:underline">
            Logs
          </Link>
          {process.env.APP_PASSWORD && <LogoutButton />}
        </div>
      </header>

      <div className="space-y-6">
        <AddHoldingForm />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Shares</TableHead>
                <TableHead>Cost / share</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-16 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No holdings yet. Add one above.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.ticker}</TableCell>
                    <TableCell>{row.shares != null ? row.shares : "—"}</TableCell>
                    <TableCell>
                      {row.cost_basis_per_share != null ? `$${Number(row.cost_basis_per_share).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {row.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <EditHoldingDialog holding={row} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
