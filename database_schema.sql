-- portfolio-briefing-bot schema. Paste into the Neon SQL editor once per project.

CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  shares NUMERIC,
  cost_basis_per_share NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN NOT NULL,
  message_body TEXT,
  error_message TEXT
);

CREATE INDEX idx_holdings_ticker ON holdings(ticker);
