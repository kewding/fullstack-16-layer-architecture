package medicalinfo



type MedicalInfoRequest struct {
	BloodType                    string   `json:"blood_type"`
	HeightCm                     float64  `json:"height_cm"`
	WeightKg                     float64  `json:"weight_kg"`
	Allergens                    []string `json:"allergens"`
	CustomAllergens              []string `json:"custom_allergens"`
	MedicalConditions            []string `json:"medical_conditions"`
	Medications                  []string `json:"medications"`
	EmergencyContactName         string   `json:"emergency_contact_name"`
	EmergencyContactNumber       string   `json:"emergency_contact_number"`
	EmergencyContactRelationship string   `json:"emergency_contact_relationship"`
}

type MedicalInfoResponse struct {
	BloodType                    string   `json:"blood_type"`
	HeightCm                     float64  `json:"height_cm"`
	WeightKg                     float64  `json:"weight_kg"`
	Allergens                    []string `json:"allergens"`
	CustomAllergens              []string `json:"custom_allergens"`
	MedicalConditions            []string `json:"medical_conditions"`
	Medications                  []string `json:"medications"`
	EmergencyContactName         string   `json:"emergency_contact_name"`
	EmergencyContactNumber       string   `json:"emergency_contact_number"`
	EmergencyContactRelationship string   `json:"emergency_contact_relationship"`
}