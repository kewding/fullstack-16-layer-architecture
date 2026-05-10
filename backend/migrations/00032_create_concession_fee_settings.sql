-- +goose Up
-- +goose StatementBegin

CREATE TABLE concession_fee_settings (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type         TEXT          NOT NULL,
    -- fee_type values: 'utility_charges' | 'maintenance_rent'
    --                  | 'insurance_administrative' | 'performance_security'
    amount           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    -- effective_month is always the 1st day of the target month (e.g. 2025-06-01)
    effective_month  DATE          NOT NULL,
    set_by           UUID          REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT uq_fee_type_month UNIQUE (fee_type, effective_month),
    CONSTRAINT chk_fee_type CHECK (fee_type IN (
        'utility_charges',
        'maintenance_rent',
        'insurance_administrative',
        'performance_security'
    )),
    CONSTRAINT chk_amount_non_negative CHECK (amount >= 0)
);

CREATE INDEX idx_concession_fee_settings_type_month
    ON concession_fee_settings (fee_type, effective_month DESC);

COMMENT ON TABLE concession_fee_settings IS
    'One row per fee_type per calendar month. effective_month is always the 1st of the month. '
    'The active fee for any given month is the most recent row where effective_month <= that month.';

COMMENT ON COLUMN concession_fee_settings.effective_month IS
    'The first calendar day of the month this fee applies to. '
    'A new row is inserted for next month when admin changes a fee, '
    'or auto-carried-forward by the background job on the 1st if unchanged.';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS concession_fee_settings;
-- +goose StatementEnd