import { sendEmail } from "@/lib/email";
import { generateWelcomeEmail, generatePasswordResetEmail } from "../templates";

export class EmailService {
  static async sendWelcomeEmail(userData: {
    name: string;
    email: string;
    activationToken?: string;
  }) {
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
}
