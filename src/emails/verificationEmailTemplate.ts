// src/emails/verificationEmailTemplate.ts
export default function verificationEmailTemplate(
  username: string,
  otp: string,
  email: string,
  appName: string = "Homecare",
  companyName: string = "Homecare"
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${appName} Verification Code</title>
  <style>
    body { margin: 0; padding: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #333; }
    .container { margin: 0 auto; width: 100%; max-width: 600px; padding: 20px; }
    .header { border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .header a { font-size: 1.4em; color: #000; text-decoration: none; font-weight: 600; }
    .otp { background: #00bc69; margin: 20px 0; width: max-content; padding: 15px 25px; color: #fff; border-radius: 5px; font-size: 1.5em; letter-spacing: 2px; font-weight: bold; }
    .footer { color: #666; font-size: 0.8em; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a>Verify Your ${appName} Account</a>
    </div>
    <p>Dear <strong>${username}</strong>,</p>
    <p>Thank you for signing up for <strong>${appName}</strong>!</p>
    <p>Your verification code is:</p>
    <div class="otp">${otp}</div>
    <p>This code will expire in 1 hour.</p>
    <p>This email was sent to <a href="mailto:${email}">${email}</a></p>
    <p>If you didn't create this account, please ignore this email.</p>
    <div class="footer">
      <p>Best regards,<br/>${companyName} Team</p>
    </div>
  </div>
</body>
</html>
  `;
}
