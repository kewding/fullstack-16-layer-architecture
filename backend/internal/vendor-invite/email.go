package vendorinvite

import (
	"fmt"

	gomail "gopkg.in/gomail.v2"
)

type gmailEmailSender struct {
	host      string
	port      int
	username  string
	password  string
	fromEmail string
	appURL    string
}

type EmailSender interface {
	SendInviteEmail(toEmail string, ownerName string, token string) error
	SendRevocationEmail(toEmail string, ownerName string) error
}

func NewGmailEmailSender(host string, port int, username, password, fromEmail string, appURL string) EmailSender {
	return &gmailEmailSender{
		host:      host,
		port:      port,
		username:  username,
		password:  password,
		fromEmail: fromEmail,
		appURL:    appURL,
	}
}

func (s *gmailEmailSender) SendInviteEmail(toEmail string, ownerName string, token string) error {
	registrationURL := fmt.Sprintf("%s/vendor-register?token=%s", s.appURL, token)

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
    <h2 style="color: #111;">Hello, %s!</h2>
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
</html>`, ownerName, registrationURL)

	m := gomail.NewMessage()
	m.SetHeader("From", s.fromEmail)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "You're invited to register as a Vendor")
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(s.host, s.port, s.username, s.password)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (s *gmailEmailSender) SendRevocationEmail(toEmail string, ownerName string) error {
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
    <h2 style="color: #111;">Hello, %s</h2>
    <p style="color: #555; line-height: 1.6;">
      We sincerely apologize for any confusion. A vendor invitation was recently sent to this 
      email address in error. Please disregard the previous invitation email you received.
    </p>
    <p style="color: #555; line-height: 1.6;">
      For your security, the invitation link that was sent to you has been permanently 
      deactivated and can no longer be used to access our platform.
    </p>
    <p style="color: #555; line-height: 1.6;">
      If you did not receive any invitation email, you can safely ignore this message.
      If you have any concerns, please contact our support team.
    </p>
    <p style="margin-top: 32px; color: #999; font-size: 12px;">
      This is an automated security notice. No action is required on your part.
    </p>
  </div>
</body>
</html>`, ownerName)

	m := gomail.NewMessage()
	m.SetHeader("From", s.fromEmail)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Important: Your Vendor Invitation Has Been Revoked")
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(s.host, s.port, s.username, s.password)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send revocation email: %w", err)
	}

	return nil
}
