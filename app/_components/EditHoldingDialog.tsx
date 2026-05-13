"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Holding } from "@/lib/types";

export function EditHoldingDialog({ holding }: { holding: Holding }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ticker, setTicker] = useState(holding.ticker);
  const [shares, setShares] = useState(holding.shares != null ? String(holding.shares) : "");
  const [costBasis, setCostBasis] = useState(
    holding.cost_basis_per_share != null ? String(holding.cost_basis_per_share) : "",
  );
  const [notes, setNotes] = useState(holding.notes ?? "");

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = {
      ticker: ticker.trim().toUpperCase(),
      shares: shares.trim() ? parseFloat(shares) : null,
      cost_basis_per_share: costBasis.trim() ? parseFloat(costBasis) : null,
      notes: notes.trim() || null,
    };

    startTransition(async () => {
      const res = await fetch(`/api/holdings/${holding.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Failed to save");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete ${holding.ticker}?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/holdings/${holding.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${holding.ticker}`}>
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit holding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-ticker">Ticker</Label>
            <Input
              id="edit-ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              required
              maxLength={16}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-shares">Shares</Label>
              <Input
                id="edit-shares"
                type="number"
                step="any"
                min={0}
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-cost">Cost / share</Label>
              <Input
                id="edit-cost"
                type="number"
                step="any"
                min={0}
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 className="mr-1" /> Delete
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
