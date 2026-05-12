package studenttransactions

// Repository is the port that the use-case depends on.
// The postgres implementation satisfies this interface.
type Repository interface {
	List(req ListRequest) ([]TransactionRow, int, error)
}