// src/lib/payment-matcher.ts

/**
 * Payment Matching Engine
 * Automatically matches incoming bank payments to fee vouchers
 */

import prisma from "./prisma";
import { extractPaymentCodes } from "./payment-code-generator";
import type { MatchType } from "@prisma/client";

export interface MatchResult {
  success: boolean;
  matchType: MatchType;
  confidence: number;
  voucherId?: string;
  studentId?: string;
  message: string;
}

export interface PaymentMatchingOptions {
  allowPartialMatch?: boolean;
  confidenceThreshold?: number; // 0-100
  amountTolerance?: number; // Percentage tolerance for amount matching
}

/**
 * Match a single incoming payment to a voucher
 */
export async function matchPayment(
  incomingPaymentId: string,
  schoolId: string,
  options: PaymentMatchingOptions = {}
): Promise<MatchResult> {
  const {
    allowPartialMatch = true,
    confidenceThreshold = 80,
    amountTolerance = 5, // 5% tolerance
  } = options;

  // Get the incoming payment
  const payment = await prisma.incomingPayment.findUnique({
    where: { id: incomingPaymentId },
  });

  if (!payment) {
    return {
      success: false,
      matchType: "MANUAL",
      confidence: 0,
      message: "Payment not found",
    };
  }

  // Extract payment codes from remarks
  const extractedCodes = extractPaymentCodes(payment.remarks || "");

  if (extractedCodes.length === 0) {
    return {
      success: false,
      matchType: "MANUAL",
      confidence: 0,
      message: "No payment code found in remarks",
    };
  }

  // Try to match each extracted code
  for (const code of extractedCodes) {
    const voucher = await prisma.voucher.findFirst({
      where: {
        paymentCode: code,
        schoolId,
        status: {
          in: ["PENDING", "PARTIAL"],
        },
      },
      include: {
        student: true,
      },
    });

    if (voucher) {
      // Calculate confidence based on amount matching
      const amountDifference = Math.abs(payment.amount - voucher.amountDue);
      const amountDifferencePercent =
        (amountDifference / voucher.amountDue) * 100;

      let confidence = 100;

      // Reduce confidence if amounts don't match exactly
      if (amountDifferencePercent > 0) {
        confidence -= Math.min(amountDifferencePercent * 2, 30);
      }

      // Check if amount is within tolerance
      if (amountDifferencePercent > amountTolerance) {
        if (!allowPartialMatch) {
          continue; // Try next code
        }
        confidence -= 20;
      }

      // Update the incoming payment with match info
      await prisma.incomingPayment.update({
        where: { id: incomingPaymentId },
        data: {
          extractedCode: code,
          voucherId: voucher.id,
          studentId: voucher.studentId,
          matchStatus: confidence >= confidenceThreshold ? "MATCHED" : "MANUAL_REVIEW",
          matchedAt: new Date(),
        },
      });

      // If confidence is high enough, create reconciliation record
      if (confidence >= confidenceThreshold) {
        await createReconciliation({
          incomingPaymentId: payment.id,
          voucherId: voucher.id,
          studentId: voucher.studentId,
          schoolId,
          matchType: "AUTO",
          confidence,
          amountMatched: payment.amount,
          discrepancy: amountDifference,
        });

        // Update voucher status
        const newStatus =
          payment.amount >= voucher.amountDue ? "PAID" : "PARTIAL";
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { status: newStatus },
        });
      }

      return {
        success: true,
        matchType: "AUTO",
        confidence,
        voucherId: voucher.id,
        studentId: voucher.studentId,
        message: `Matched to voucher ${voucher.voucherNumber} for student ${(voucher as any).student.studentName}`,
      };
    }
  }

  return {
    success: false,
    matchType: "MANUAL",
    confidence: 0,
    message: "No matching voucher found for extracted codes",
  };
}

/**
 * Match multiple payments in batch
 */
export async function matchPaymentsBatch(
  incomingPaymentIds: string[],
  schoolId: string,
  options: PaymentMatchingOptions = {}
): Promise<{
  matched: number;
  unmatched: number;
  manualReview: number;
  results: MatchResult[];
}> {
  const results: MatchResult[] = [];
  let matched = 0;
  let unmatched = 0;
  let manualReview = 0;

  for (const paymentId of incomingPaymentIds) {
    const result = await matchPayment(paymentId, schoolId, options);
    results.push(result);

    if (result.success && result.confidence >= (options.confidenceThreshold || 80)) {
      matched++;
    } else if (result.success && result.confidence < (options.confidenceThreshold || 80)) {
      manualReview++;
    } else {
      unmatched++;
    }
  }

  return {
    matched,
    unmatched,
    manualReview,
    results,
  };
}

/**
 * Create a payment reconciliation record
 */
async function createReconciliation(data: {
  incomingPaymentId: string;
  voucherId: string;
  studentId: string;
  schoolId: string;
  matchType: MatchType;
  confidence: number;
  amountMatched: number;
  discrepancy: number;
  reconciledBy?: string;
  notes?: string;
}) {
  return prisma.paymentReconciliation.create({
    data: {
      incomingPaymentId: data.incomingPaymentId,
      voucherId: data.voucherId,
      studentId: data.studentId,
      schoolId: data.schoolId,
      matchType: data.matchType,
      matchConfidence: data.confidence,
      amountMatched: data.amountMatched,
      discrepancy: data.discrepancy,
      reconciledBy: data.reconciledBy,
      notes: data.notes,
    },
  });
}

/**
 * Manual match - link an incoming payment to a voucher
 */
export async function manualMatch(
  incomingPaymentId: string,
  voucherId: string,
  userId: string,
  notes?: string
): Promise<MatchResult> {
  const payment = await prisma.incomingPayment.findUnique({
    where: { id: incomingPaymentId },
  });

  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: { student: true },
  });

  if (!payment || !voucher) {
    return {
      success: false,
      matchType: "MANUAL",
      confidence: 0,
      message: "Payment or voucher not found",
    };
  }

  // Update incoming payment
  await (prisma as any).incomingPayment.update({
    where: { id: incomingPaymentId },
    data: {
      voucherId: voucher.id,
      studentId: voucher.studentId,
      matchStatus: "MATCHED",
      matchedAt: new Date(),
      matchedBy: userId,
    },
  });

  // Create reconciliation record
  const discrepancy = Math.abs(payment.amount - voucher.amountDue);
  await createReconciliation({
    incomingPaymentId: payment.id,
    voucherId: voucher.id,
    studentId: voucher.studentId,
    schoolId: payment.schoolId,
    matchType: "MANUAL",
    confidence: 100,
    amountMatched: payment.amount,
    discrepancy,
    reconciledBy: userId,
    notes,
  });

  // Update voucher status
  const newStatus = payment.amount >= voucher.amountDue ? "PAID" : "PARTIAL";
  await prisma.voucher.update({
    where: { id: voucherId },
    data: { status: newStatus },
  });

  return {
    success: true,
    matchType: "MANUAL",
    confidence: 100,
    voucherId: voucher.id,
    studentId: voucher.studentId,
    message: `Manually matched to voucher ${voucher.voucherNumber}`,
  };
}

/**
 * Get unmatched payments for a school
 */
export async function getUnmatchedPayments(schoolId: string) {
  return prisma.incomingPayment.findMany({
    where: {
      schoolId,
      matchStatus: {
        in: ["UNMATCHED", "MANUAL_REVIEW"],
      },
    },
    orderBy: {
      transactionDate: "desc",
    },
  });
}

/**
 * Get reconciliation report
 */
export async function getReconciliationReport(
  schoolId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { schoolId };

  if (startDate || endDate) {
    where.reconciledAt = {};
    if (startDate) where.reconciledAt.gte = startDate;
    if (endDate) where.reconciledAt.lte = endDate;
  }

  const reconciliations = await prisma.paymentReconciliation.findMany({
    where,
    include: {
      incomingPayment: true,
      voucher: true,
      student: true,
    },
    orderBy: {
      reconciledAt: "desc",
    },
  });

  const summary = {
    totalReconciled: reconciliations.length,
    autoMatched: reconciliations.filter((r) => r.matchType === "AUTO").length,
    manualMatched: reconciliations.filter((r) => r.matchType === "MANUAL").length,
    totalAmount: reconciliations.reduce((sum, r) => sum + r.amountMatched, 0),
    totalDiscrepancy: reconciliations.reduce((sum, r) => sum + r.discrepancy, 0),
  };

  return {
    summary,
    reconciliations,
  };
}
