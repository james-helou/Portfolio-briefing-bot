import Link from "next/link";
import { getSql } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogoutButton } from "../_components/LogoutButton";
import { TAG_LABEL, tagOf } from "@/lib/notification-tags";

export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  sent_at: Date;
  success: boolean;
  message_body: string | null;
  error_message: string | null;
};

const MONTREAL_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Montreal",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export default async function LogsPage() {
  const sql = getSql();
  const rows = (await sql<LogRow[]>`
    SELECT id, sent_at, success, message_body, error_message
    FROM briefings
    WHERE sent_at >= now() - INTERVAL '30 days'
    ORDER BY sent_at DESC
  `) as unknown as LogRow[];

  return (
    <div className="container py-8 max-w-5xl">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Logs</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            Holdings
          </Link>
          {process.env.APP_PASSWORD && <LogoutButton />}
        </div>
      </header>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            No briefings in the last 30 days.
          </div>
        ) : (
          rows.map((r) => {
            const tag = tagOf(r.error_message);
            return (
              <div key={r.id} className="rounded-md border p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{MONTREAL_FMT.format(new Date(r.sent_at))}</span>
                  <span>
                    {r.success ? "✅" : "❌"}{" "}
                    {tag && (
                      <span className="text-muted-foreground ml-1">{TAG_LABEL[tag]}</span>
                    )}
                  </span>
                </div>
                {r.message_body && (
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground font-sans">
                    {r.message_body}
                  </pre>
                )}
                {r.error_message && !tag && (
                  <p className="text-sm text-destructive">{r.error_message}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
