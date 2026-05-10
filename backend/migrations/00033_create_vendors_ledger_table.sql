-- +goose Up
-- +goose StatementBegin

CREATE TYPE vendors_ledger_entry_type AS ENUM (
    'gross_profit',    -- monthly CREDIT: sum of sales for the billing month
    'concession_fee',  -- monthly DEBIT:  sum of 4 fee components for the billing month
    'remittance'       -- DEBIT on remittance approval
);

CREATE TABLE vendors_ledger (
    id             UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id      UUID                        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    entry_type     vendors_ledger_entry_type   NOT NULL,

    -- amount is always stored as a positive value
    amount         DECIMAL(12,2)               NOT NULL CHECK (amount >= 0),

    -- direction: +1 = credit (adds to balance), -1 = debit (subtracts from balance)
    direction      SMALLINT                    NOT NULL CHECK (direction IN (1, -1)),

    -- billing_month: 1st of the month this entry belongs to; NULL for remittances
    billing_month  DATE,

    -- reference back to the source record
    reference_id   UUID,
    reference_type TEXT,

    -- note / audit trail
    note           TEXT,

    created_at     TIMESTAMPTZ                 NOT NULL DEFAULT now(),

    -- prevent double-posting: only one gross_profit and one concession_fee per vendor per month
    CONSTRAINT uq_ledger_vendor_month_type
        UNIQUE NULLS NOT DISTINCT (vendor_id, billing_month, entry_type)
        -- NOTE: NULLS NOT DISTINCT is Postgres 15+. If on < 15, use a partial unique index below.
);

-- Partial unique index fallback for Postgres < 15 (uncomment if needed):
-- CREATE UNIQUE INDEX uq_ledger_vendor_month_gross
--     ON vendors_ledger (vendor_id, billing_month)
--     WHERE entry_type = 'gross_profit' AND billing_month IS NOT NULL;
-- CREATE UNIQUE INDEX uq_ledger_vendor_month_fee
--     ON vendors_ledger (vendor_id, billing_month)
--     WHERE entry_type = 'concession_fee' AND billing_month IS NOT NULL;

CREATE INDEX idx_vendors_ledger_vendor_date
    ON vendors_ledger (vendor_id, created_at DESC);

CREATE INDEX idx_vendors_ledger_billing_month
    ON vendors_ledger (vendor_id, billing_month DESC);

COMMENT ON TABLE vendors_ledger IS
    'Double-entry-style ledger for vendor financial activity. '
    'Net balance = SUM(amount * direction). '
    'Wallet.balance for the vendor is kept in sync on every insert.';

COMMENT ON COLUMN vendors_ledger.direction IS
    '+1 = credit (gross_profit), -1 = debit (concession_fee, remittance)';

COMMENT ON COLUMN vendors_ledger.billing_month IS
    'First day of the billing month this entry belongs to. NULL for remittance entries.';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS vendors_ledger;
DROP TYPE IF EXISTS vendors_ledger_entry_type;
-- +goose StatementEnd