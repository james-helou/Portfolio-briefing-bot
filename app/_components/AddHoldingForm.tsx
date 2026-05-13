"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function AddHoldingForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const payload: Record<string, unknown> = { ticker: ticker.trim().toUpperCase() };
    if (shares.trim()) payload.shares = parseFloat(shares);
    if (costBasis.trim()) payload.cost_basis_per_share = parseFloat(costBasis);
    if (notes.trim()) payload.notes = notes.trim();

    startTransition(async () => {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Failed to add holding");
        return;
      }
      setTicker("");
      setShares("");
      setCostBasis("");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="add-ticker">Ticker</Label>
            <Input
              id="add-ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              required
              maxLength={16}
              placeholder="NVDA"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-shares">Shares</Label>
            <Input
              id="add-shares"
              type="number"
              step="any"
              min={0}
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-cost">Cost / share</Label>
            <Input
              id="add-cost"
              type="number"
              step="any"
              min={0}
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="add-notes">Notes</Label>
            <Input
              id="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="optional"
            />
          </div>
          <div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Adding..." : "Add"}
            </Button>
          </div>
          {error && <p className="sm:col-span-6 text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
