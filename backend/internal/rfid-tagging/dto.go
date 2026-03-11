package rfidtagging

type CheckUuidRequest struct {
	Uuid string `json:"uuid" validate:"required,max=155"`
}

type CheckRfidRequest struct {
	Rfid string `json:"rfid" validate:"required,min=8,max=100"`
}

type RfidTaggingRequest struct {
	Uuid string `json:"uuid" validate:"required,max=155"`
	Rfid string `json:"rfid" validate:"required,min=8,max=100"`
}
