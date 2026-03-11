package rfidtagging

import (
	"context"
)


type Repository interface {
	UserUuidExists(ctx context.Context, uuid string) (bool, error)
	UserRfidExists(ctx context.Context, uuid string) (bool, error)
	RfidTagTaken(ctx context.Context, rfid string) (bool, error)

	BeginTx(ctx context.Context) (Tx, error)

	LinkUserRfid(ctx context.Context, tx Tx, uuid string, rfid string) (string, error)
}

type Tx interface {
    Commit(ctx context.Context) error
    Rollback(ctx context.Context) error
}   