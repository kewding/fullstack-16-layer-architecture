package rfidtagging

import (
	"context"
	"fmt"
)

type UseCase interface {
	CheckUuid(ctx context.Context, uuid string) error
	CheckRfid(ctx context.Context, rfid string) error
	RfidTagging(ctx context.Context, req RfidTaggingRequest) error
}

type useCase struct {
	repo Repository
}

func NewUseCase(repo Repository) UseCase {
	return &useCase{repo: repo}
}

func (u *useCase) CheckUuid(ctx context.Context, uuid string) error {
	found, err := u.repo.UserUuidExists(ctx, uuid)
	if err != nil || !found {
		return ErrUuidNotFound
	}
	return nil
}

func (u *useCase) CheckRfid(ctx context.Context, rfid string) error {
	taken, err := u.repo.RfidTagTaken(ctx, rfid)
	if err != nil {
		return fmt.Errorf("failed to check rfid: %w", err)
	}
	if taken { // was: if err != nil || !found — wrong condition
		return ErrRfidTaken
	}

	hasRfid, err := u.repo.UserRfidExists(ctx, rfid)
	if err != nil {
		return fmt.Errorf("failed to check availability: %w", err)
	}
	if hasRfid {
		return ErrRfidPresent
	}
	return nil
}

func (u *useCase) RfidTagging(ctx context.Context, req RfidTaggingRequest) (err error) {
	// Re-run checks for safety before touching the DB
	if err := u.CheckUuid(ctx, req.Uuid); err != nil {
		return err // ErrUuidNotFound
	}
	if err := u.CheckRfid(ctx, req.Rfid); err != nil {
		return err // ErrRfidTaken or ErrRfidPresent
	}

	tx, err := u.repo.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("%w: cannot start transaction: %v", ErrRfidTaggingFailed, err)
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback(ctx)
			panic(p)
		} else if err != nil {
			tx.Rollback(ctx)
		} else {
			err = tx.Commit(ctx)
		}
	}()

	_, err = u.repo.LinkUserRfid(ctx, tx, req.Uuid, req.Rfid)
	if err != nil {
		return fmt.Errorf("%w: failed to link rfid: %v", ErrRfidTaggingFailed, err)
	}

	return nil
}
