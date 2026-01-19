import { sendEmail } from "@/lib/email";
import {
  generateWelcomeEmail,
  generatePasswordResetEmail,
  generateAdminNewUserPendingEmail,
  generatePendingApprovalEmail,
  generateAccountApprovedEmail,
} from "../templates";

export class EmailService {
  static async sendWelcomeEmail(userData: { name: string; email: string }) {
    try {
      const { html, subject } = generateWelcomeEmail(userData);

      const result = await sendEmail({
        to: userData.email,
        subject,
        html,
      });

      if (!result.success) {
        throw new Error("Failed to send welcome email");
      }

      return result;
    } catch (error) {
      console.error("Error sending welcome email:", error);
      throw error;
    }
  }

  static async sendPasswordResetEmail(userData: {
    name: string;
    email: string;
    resetToken: string;
  }) {
    try {
      const { html, subject } = generatePasswordResetEmail(userData);

      const result = await sendEmail({
        to: userData.email,
        subject,
        html,
      });

      if (!result.success) {
        throw new Error("Failed to send password reset email");
      }

      return result;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  }

  static async sendAccountActivationEmail(userData: {
    name: string;
    email: string;
    activationToken: string;
  }) {
    return this.sendWelcomeEmail(userData);
  }

  static async sendAdminNewUserPendingEmail(args: {
    to: string;
    newUserEmail: string;
    newUserName: string;
  }) {
    const { subject, html } = generateAdminNewUserPendingEmail({
      newUserEmail: args.newUserEmail,
      newUserName: args.newUserName,
    });

    return sendEmail({
      to: args.to,
      subject,
      html,
    });
  }

  static async sendPendingApprovalEmail(userData: {
    name: string;
    email: string;
  }) {
    const { html, subject } = generatePendingApprovalEmail(userData);

    return sendEmail({
      to: userData.email,
      subject,
      html,
    });
  }
  static async sendAccountApprovedEmail(userData: {
    name: string;
    email: string;
  }) {
    const { html, subject } = generateAccountApprovedEmail(userData);
    return sendEmail({ to: userData.email, subject, html });
  }
}
