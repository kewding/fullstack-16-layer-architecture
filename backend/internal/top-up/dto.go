package topup

type CheckRfidRequest struct {
	Rfid string `json:"rfid" validate:"required,min=8,max=100"`
}

type TopupCreditingRequest struct {
	Rfid string `json:"rfid" validate:"required,min=8,max=100"`
	Amount string `json:"amount" validate:"required,numeric,min=1,max=9999999"` 
}