package rfidtagging

type CheckRfidRequest struct {
	Rfid string `json:"rfid" validate:"required,min=8,max=100"`
}

type RfidTaggingRequest struct {
	Uuid string `json:"uuid" validate:"required,max=155"`
	Rfid string `json:"rfid" validate:"required,min=8,max=100"`
}
