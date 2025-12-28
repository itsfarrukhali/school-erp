// src/app/api/payment/import-statement/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import prisma from "@/lib/prisma";
import {
  parseBankStatement,
  detectBankFormat,
  validateTransactions,
  BANK_FORMATS,
} from "@/lib/bank-statement-parser";
import { matchPaymentsBatch } from "@/lib/payment-matcher";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to import statements
    const allowedRoles = [
      "SUPERADMIN",
      "ADMIN",
      "SCHOOLADMIN",
      "PRINCIPAL",
      "ACCOUNTANT",
    ];

    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "You don't have permission to import bank statements" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bankFormatKey = formData.get("bankFormat") as string;
    const schoolId = formData.get("schoolId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    // Read file content
    const content = await file.text();

    // Detect or use specified bank format
    let bankFormat = bankFormatKey
      ? BANK_FORMATS[bankFormatKey]
      : detectBankFormat(content);

    if (!bankFormat) {
      bankFormat = BANK_FORMATS.GENERIC;
    }

    // Parse transactions
    const parsedTransactions = parseBankStatement(content, bankFormat);

    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found in file" },
        { status: 400 }
      );
    }

    // Validate transactions
    const { valid, invalid } = validateTransactions(parsedTransactions);

    // Generate batch ID for this import
    const importBatchId = nanoid();

    // Import valid transactions
    const importedPayments = [];
    const duplicates = [];

    for (const transaction of valid) {
      try {
        // Check for duplicates
        const existing = await (prisma as any).incomingPayment.findFirst({
          where: {
            schoolId,
            bankReference: transaction.bankReference,
          },
        });

        if (existing) {
          duplicates.push({
            bankReference: transaction.bankReference,
            reason: "Duplicate transaction",
          });
          continue;
        }

        // Create incoming payment record
        const payment = await (prisma as any).incomingPayment.create({
          data: {
            schoolId,
            bankReference: transaction.bankReference,
            transactionDate: transaction.transactionDate,
            amount: transaction.amount,
            accountHolderName: transaction.accountHolderName,
            remarks: transaction.remarks,
            rawData: transaction.rawData,
            importBatchId,
            matchStatus: "UNMATCHED",
          },
        });

        importedPayments.push(payment);
      } catch (error) {
        console.error("Error importing transaction:", error, transaction);
      }
    }

    // Auto-match imported payments
    const paymentIds = importedPayments.map((p) => p.id);
    const matchResults = await matchPaymentsBatch(paymentIds, schoolId, {
      allowPartialMatch: true,
      confidenceThreshold: 80,
      amountTolerance: 5,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: "IncomingPayment",
        entityId: importBatchId,
        action: "IMPORT",
        performedBy: session.user.id,
        schoolId,
        after: {
          importBatchId,
          totalTransactions: parsedTransactions.length,
          imported: importedPayments.length,
          duplicates: duplicates.length,
          invalid: invalid.length,
          matched: matchResults.matched,
          unmatched: matchResults.unmatched,
          manualReview: matchResults.manualReview,
        },
        note: `Imported bank statement with ${importedPayments.length} transactions`,
      },
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalTransactions: parsedTransactions.length,
        imported: importedPayments.length,
        duplicates: duplicates.length,
        invalid: invalid.length,
        matched: matchResults.matched,
        unmatched: matchResults.unmatched,
        manualReview: matchResults.manualReview,
      },
      importBatchId,
      bankFormat: bankFormat.name,
      invalidTransactions: invalid.map((i) => ({
        data: i.transaction,
        errors: i.errors,
      })),
      duplicateTransactions: duplicates,
    });
  } catch (error) {
    console.error("Error importing bank statement:", error);
    return NextResponse.json(
      {
        error: "Failed to import bank statement",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve import history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const importBatchId = searchParams.get("importBatchId");

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    const where: any = { schoolId };
    if (importBatchId) {
      where.importBatchId = importBatchId;
    }

    const payments = await (prisma as any).incomingPayment.findMany({
      where,
      include: {
        voucher: {
          include: {
            student: {
              select: {
                studentName: true,
                grNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("Error fetching import history:", error);
    return NextResponse.json(
      { error: "Failed to fetch import history" },
      { status: 500 }
    );
  }
}
