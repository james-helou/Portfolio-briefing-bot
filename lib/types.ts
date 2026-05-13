export type Holding = {
  id: string;
  ticker: string;
  shares: number | null;
  cost_basis_per_share: number | null;
  notes: string | null;
};
