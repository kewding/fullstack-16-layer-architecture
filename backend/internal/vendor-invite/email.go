package vendorinvite

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type EmailSender interface {
	SendInviteEmail(toEmail string, token string) error
}

type resendEmailSender struct {
	apiKey  string
	baseURL string
	fromEmail string
}

func NewResendEmailSender(apiKey string, fromEmail string) EmailSender {
	return &resendEmailSender{
		apiKey:    apiKey,
		baseURL:   "https://api.resend.com/emails",
		fromEmail: fromEmail,
	}
}

func (s *resendEmailSender) SendInviteEmail(toEmail string, token string) error {
	registrationURL := fmt.Sprintf("https://yourdomain.com/vendor/register?token=%s", token)

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
    <h2 style="color: #111;">You're invited to join as a Vendor</h2>
    <p style="color: #555; line-height: 1.6;">
      You have been personally invited by our team to register as a vendor on our platform.
      Click the button below to complete your registration. This link is valid for <strong>72 hours</strong>.
    </p>
    <a href="%s" style="
      display: inline-block;
      margin-top: 24px;
      padding: 14px 28px;
      background-color: #22c55e;
      color: black;
      font-weight: bold;
      text-decoration: none;
      border-radius: 999px;
    ">Register as Vendor</a>
    <p style="margin-top: 32px; color: #999; font-size: 12px;">
      If you did not expect this invitation, you can safely ignore this email.
      This link will expire after 72 hours.
    </p>
  </div>
</body>
</html>`, registrationURL)

	payload := map[string]any{
		"from":    s.fromEmail,
		"to":      []string{toEmail},
		"subject": "You're invited to register as a Vendor",
		"html":    htmlBody,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	req, err := http.NewRequest("POST", s.baseURL, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API error: status %d", resp.StatusCode)
	}

	return nil
}