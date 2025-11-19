import nodemailer from "nodemailer";
import verificationEmailTemplate from "@/emails/verificationEmailTemplate";

export async function sendVerificationEmail(
  email: string,
  username: string,
  verificationCode: string
) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const htmlContent = verificationEmailTemplate(
      username,
      verificationCode,
      email
    );
    const subject = "Verify Your Account - Homecare";

    const info = await transporter.sendMail({
      from: `"Homecare" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
