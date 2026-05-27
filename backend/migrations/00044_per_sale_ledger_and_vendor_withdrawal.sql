-- +goose Up
-- +goose StatementBegin

ALTER TABLE vendors_ledger
    DROP CONSTRAINT IF EXISTS uq_ledger_vendor_month_type;

CREATE UNIQUE INDEX uq_ledger_vendor_sale_gross
    ON vendors_ledger (vendor_id, reference_id)
    WHERE entry_type = 'gross_profit' AND reference_id IS NOT NULL;

CREATE UNIQUE INDEX uq_ledger_vendor_month_fee
    ON vendors_ledger (vendor_id, billing_month)
    WHERE entry_type = 'concession_fee' AND billing_month IS NOT NULL;

ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'vendor_withdrawal_accepted';
ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'vendor_withdrawal_rejected';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS uq_ledger_vendor_sale_gross;
DROP INDEX IF EXISTS uq_ledger_vendor_month_fee;

ALTER TABLE vendors_ledger
    ADD CONSTRAINT uq_ledger_vendor_month_type
        UNIQUE NULLS NOT DISTINCT (vendor_id, billing_month, entry_type);

-- +goose StatementEnd