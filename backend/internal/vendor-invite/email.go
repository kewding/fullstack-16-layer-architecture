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
	SendApprovalEmail(toEmail string, ownerName string, stallName string) error
	SendRemovalEmail(toEmail string, ownerName string, stallName string, balance float64, totalSales float64) error
  SendFeeReminderEmail(toEmail string, adminName string, nextMonth string) error
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

func (s *gmailEmailSender) SendApprovalEmail(toEmail string, ownerName string, stallName string) error {
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
    <h2 style="color: #111;">Congratulations, %s! 🎉</h2>
    <p style="color: #555; line-height: 1.6;">
      Your vendor application for <strong>%s</strong> has been reviewed and approved.
      You are now officially an active vendor on our platform.
    </p>
    <h3 style="color: #111;">Next Steps:</h3>
    <ol style="color: #555; line-height: 2;">
      <li>Log in to your vendor account</li>
      <li>Set up your product listings</li>
      <li>Start accepting orders from students</li>
    </ol>
    <a href="%s/login" style="
      display: inline-block;
      margin-top: 24px;
      padding: 14px 28px;
      background-color: #22c55e;
      color: black;
      font-weight: bold;
      text-decoration: none;
      border-radius: 999px;
    ">Go to Dashboard</a>
    <p style="margin-top: 32px; color: #999; font-size: 12px;">
      Welcome to the platform. We look forward to working with you.
    </p>
  </div>
</body>
</html>`, ownerName, stallName, s.appURL)

	m := gomail.NewMessage()
	m.SetHeader("From", s.fromEmail)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Your Vendor Application Has Been Approved!")
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(s.host, s.port, s.username, s.password)
	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send approval email: %w", err)
	}

	return nil
}

func (s *gmailEmailSender) SendRemovalEmail(toEmail string, ownerName string, stallName string, balance float64, totalSales float64) error {
	formatPeso := func(val float64) string {
		return fmt.Sprintf("₱%.2f", val)
	}

	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
    <h2 style="color: #111;">Important Notice, %s</h2>
    <p style="color: #555; line-height: 1.6;">
      We regret to inform you that your business <strong>%s</strong> has been removed
      from active business status on our platform. Your account has been reverted to
      <strong>For Review</strong> status pending further assessment.
    </p>

    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #111; margin-top: 0;">Account Summary</h3>
      <table style="width: 100%%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #555;">Current Wallet Balance</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111;">%s</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #555; border-top: 1px solid #eee;">Total Sales</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #111; border-top: 1px solid #eee;">%s</td>
        </tr>
      </table>
    </div>

    <p style="color: #555; line-height: 1.6;">
      If you believe this was done in error or would like to appeal this decision,
      please contact our support team as soon as possible. Your data and account
      information remain intact during the review period.
    </p>

    <p style="margin-top: 32px; color: #999; font-size: 12px;">
      This is an automated notice from the platform administration.
    </p>
  </div>
</body>
</html>`,
		ownerName,
		stallName,
		formatPeso(balance),
		formatPeso(totalSales),
	)

	m := gomail.NewMessage()
	m.SetHeader("From", s.fromEmail)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Notice: Your Business Status Has Been Updated")
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(s.host, s.port, s.username, s.password)
	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send removal email: %w", err)
	}

	return nil
}

func (s *gmailEmailSender) SendFeeReminderEmail(toEmail, adminName, nextMonth string) error {
	htmlBody := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
    <h2 style="color: #111;">Hello, %s!</h2>
    <p style="color: #555; line-height: 1.6;">
      This is a reminder to review and update the concession fees for <strong>%s</strong>.
      Fees can be updated until the last day of this month.
      If no changes are made, the current fees will automatically carry forward.
    </p>
    <a href="%s/admin/fees" style="
      display: inline-block;
      margin-top: 24px;
      padding: 14px 28px;
      background-color: #3F6F64;
      color: white;
      font-weight: bold;
      text-decoration: none;
      border-radius: 999px;
    ">Review Fees →</a>
    <p style="margin-top: 32px; color: #999; font-size: 12px;">
      You are receiving this because you are an administrator on the platform.
    </p>
  </div>
</body>
</html>`, adminName, nextMonth, s.appURL)

	m := gomail.NewMessage()
	m.SetHeader("From", s.fromEmail)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", fmt.Sprintf("Reminder: Review Concession Fees for %s", nextMonth))
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(s.host, s.port, s.username, s.password)

	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("failed to send fee reminder email: %w", err)
	}

	return nil
}
