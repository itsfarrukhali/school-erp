// src/lib/payment-code-generator.ts

/**
 * Payment Code Generator
 * Generates unique 6-10 digit codes for fee vouchers
 * Used for automated payment reconciliation
 */

import prisma from "./prisma";

/**
 * Generate a random numeric code of specified length
 */
function generateRandomCode(length: number): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

/**
 * Generate a unique payment code
 * @param schoolId - School ID for scoping
 * @param length - Length of code (default: 8)
 * @param maxAttempts - Maximum attempts to generate unique code (default: 10)
 * @returns Unique payment code
 */
export async function generatePaymentCode(
  schoolId: string,
  length: number = 8,
  maxAttempts: number = 10
): Promise<string> {
  // Validate length
  if (length < 6 || length > 10) {
    throw new Error("Payment code length must be between 6 and 10 digits");
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRandomCode(length);

    // Check if code already exists
    const existing = await prisma.voucher.findFirst({
      where: {
        paymentCode: code,
        schoolId,
      },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate unique payment code after ${maxAttempts} attempts`
  );
}

/**
 * Generate a sequential payment code based on school and date
 * Format: YYMMDD + 4-digit sequence
 * Example: 24120100001
 */
export async function generateSequentialPaymentCode(
  schoolId: string
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const datePrefix = `${year}${month}${day}`;

  // Get the count of vouchers created today for this school
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  const count = await prisma.voucher.count({
    where: {
      schoolId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const sequence = (count + 1).toString().padStart(4, "0");
  const code = `${datePrefix}${sequence}`;

  // Verify uniqueness
  const existing = await prisma.voucher.findFirst({
    where: {
      paymentCode: code,
      schoolId,
    },
  });

  if (existing) {
    // If collision, fall back to random generation
    return generatePaymentCode(schoolId, 10);
  }

  return code;
}

/**
 * Validate payment code format
 */
export function isValidPaymentCode(code: string): boolean {
  // Must be 6-10 digits
  return /^\d{6,10}$/.test(code);
}

/**
 * Extract payment codes from text
 * Looks for 6-10 digit numbers in the text
 */
export function extractPaymentCodes(text: string): string[] {
  if (!text) return [];

  // Match 6-10 digit numbers
  const matches = text.match(/\b\d{6,10}\b/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Generate QR code data for payment voucher
 */
export function generateQRCodeData(voucher: {
  paymentCode: string;
  studentName: string;
  amount: number;
  dueDate: Date;
}): string {
  return JSON.stringify({
    type: "FEE_PAYMENT",
    code: voucher.paymentCode,
    student: voucher.studentName,
    amount: voucher.amount,
    dueDate: voucher.dueDate.toISOString(),
  });
}

/**
 * Format payment code for display
 * Example: 12345678 -> 1234-5678
 */
export function formatPaymentCode(code: string): string {
  if (code.length === 8) {
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }
  if (code.length === 10) {
    return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6)}`;
  }
  return code;
}
