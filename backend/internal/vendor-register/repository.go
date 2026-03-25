package vendorregister

import "context"

type Repository interface {
	// invite validation
	GetInviteEmailByToken(ctx context.Context, token string) (string, error)
	MarkInviteUsed(ctx context.Context, tx Tx, token string) error

	// user creation
	EmailExists(ctx context.Context, email string) (bool, error)
	CreateUser(ctx context.Context, tx Tx, email string, hashedPassword string) (string, error)
	CreateUserInfo(ctx context.Context, tx Tx, userID string, req VendorRegisterRequest) error
	CreateStall(ctx context.Context, tx Tx, userID string, businessName string) error
	CreateWallet(ctx context.Context, tx Tx, userID string) error
	CreateVendorRecord(ctx context.Context, tx Tx, userID string, email string) error

	

	BeginTx(ctx context.Context) (Tx, error)
}

type Tx interface {
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}