// src/lib/bank-statement-parser.ts

/**
 * Bank Statement Parser
 * Parses CSV/Excel files from various banks
 * Supports multiple bank formats
 */

import { parse } from "csv-parse/sync";

export interface ParsedTransaction {
  bankReference: string;
  transactionDate: Date;
  amount: number;
  accountHolderName?: string;
  remarks?: string;
  rawData: Record<string, any>;
}

export interface BankFormat {
  name: string;
  columns: {
    date: string | string[];
    amount: string | string[];
    reference: string | string[];
    accountHolder?: string | string[];
    remarks?: string | string[];
  };
  dateFormat?: string;
  skipRows?: number;
}

/**
 * Predefined bank formats for Pakistan
 */
export const BANK_FORMATS: Record<string, BankFormat> = {
  HBL: {
    name: "Habib Bank Limited",
    columns: {
      date: ["Transaction Date", "Date", "VALUE DATE"],
      amount: ["Amount", "AMOUNT", "Credit Amount"],
      reference: ["Reference", "REF NO", "Transaction ID"],
      accountHolder: ["Account Title", "ACCOUNT TITLE"],
      remarks: ["Description", "DESCRIPTION", "Narration"],
    },
    skipRows: 0,
  },
  UBL: {
    name: "United Bank Limited",
    columns: {
      date: ["Value Date", "Date"],
      amount: ["Credit", "Amount"],
      reference: ["Transaction ID", "Reference"],
      remarks: ["Description", "Narration"],
    },
    skipRows: 0,
  },
  MCB: {
    name: "Muslim Commercial Bank",
    columns: {
      date: ["Date", "Transaction Date"],
      amount: ["Credit Amount", "Amount"],
      reference: ["Reference No", "Ref"],
      remarks: ["Description"],
    },
    skipRows: 0,
  },
  ALLIED: {
    name: "Allied Bank",
    columns: {
      date: ["Date"],
      amount: ["Credit"],
      reference: ["Reference"],
      remarks: ["Particulars"],
    },
    skipRows: 0,
  },
  MEEZAN: {
    name: "Meezan Bank",
    columns: {
      date: ["Date", "Value Date"],
      amount: ["Credit", "Amount"],
      reference: ["Reference", "Trans ID"],
      remarks: ["Description"],
    },
    skipRows: 0,
  },
  GENERIC: {
    name: "Generic Format",
    columns: {
      date: ["date", "Date", "transaction_date", "Transaction Date"],
      amount: ["amount", "Amount", "credit", "Credit"],
      reference: ["reference", "Reference", "ref", "Ref", "transaction_id"],
      accountHolder: ["account_holder", "Account Holder", "name", "Name"],
      remarks: [
        "remarks",
        "Remarks",
        "description",
        "Description",
        "narration",
      ],
    },
    skipRows: 0,
  },
};

/**
 * Find matching column name from array of possible names
 */
function findColumn(
  headers: string[],
  possibleNames: string | string[]
): string | undefined {
  const names = Array.isArray(possibleNames) ? possibleNames : [possibleNames];
  return headers.find((h) =>
    names.some((n) => h.toLowerCase().trim() === n.toLowerCase().trim())
  );
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string): Date {
  // Try common date formats
  const formats = [
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      // Try to parse
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Fallback to Date constructor
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return date;
}

/**
 * Parse amount from string
 */
function parseAmount(amountStr: string): number {
  // Remove currency symbols, commas, and spaces
  const cleaned = amountStr.replace(/[^\d.-]/g, "");
  const amount = parseFloat(cleaned);
  if (isNaN(amount)) {
    throw new Error(`Invalid amount format: ${amountStr}`);
  }
  return Math.abs(amount); // Always positive for credits
}

/**
 * Parse CSV bank statement
 */
export function parseBankStatement(
  csvContent: string,
  bankFormat: BankFormat = BANK_FORMATS.GENERIC
): ParsedTransaction[] {
  try {
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      from: bankFormat.skipRows ? bankFormat.skipRows + 1 : 1,
    }) as Record<string, any>[];

    if (!records || records.length === 0) {
      throw new Error("No data found in CSV file");
    }

    // Get headers
    const headers = Object.keys(records[0]);

    // Find column mappings
    const dateCol = findColumn(headers, bankFormat.columns.date);
    const amountCol = findColumn(headers, bankFormat.columns.amount);
    const referenceCol = findColumn(headers, bankFormat.columns.reference);
    const accountHolderCol = bankFormat.columns.accountHolder
      ? findColumn(headers, bankFormat.columns.accountHolder)
      : undefined;
    const remarksCol = bankFormat.columns.remarks
      ? findColumn(headers, bankFormat.columns.remarks)
      : undefined;

    if (!dateCol || !amountCol || !referenceCol) {
      throw new Error(
        `Required columns not found. Found headers: ${headers.join(", ")}`
      );
    }

    // Parse transactions
    const transactions: ParsedTransaction[] = [];

    for (const record of records) {
      try {
        const amount = parseAmount(record[amountCol]);

        // Skip if amount is 0 or negative (debits)
        if (amount <= 0) continue;

        const transaction: ParsedTransaction = {
          bankReference: record[referenceCol]?.toString().trim() || "",
          transactionDate: parseDate(record[dateCol]),
          amount,
          accountHolderName: accountHolderCol
            ? record[accountHolderCol]?.toString().trim()
            : undefined,
          remarks: remarksCol
            ? record[remarksCol]?.toString().trim()
            : undefined,
          rawData: record,
        };

        // Skip if no reference
        if (!transaction.bankReference) continue;

        transactions.push(transaction);
      } catch (error) {
        console.error("Error parsing transaction:", error, record);
        // Continue with next record
      }
    }

    return transactions;
  } catch (error) {
    throw new Error(
      `Failed to parse bank statement: ${(error as Error).message}`
    );
  }
}

/**
 * Auto-detect bank format from CSV headers
 */
export function detectBankFormat(csvContent: string): BankFormat {
  try {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      to: 1, // Only read first row
    }) as Record<string, any>[];

    if (!records || records.length === 0) {
      return BANK_FORMATS.GENERIC;
    }

    const headers = Object.keys(records[0]).map((h) => h.toLowerCase());

    // Try to match against known bank formats
    for (const [key, format] of Object.entries(BANK_FORMATS)) {
      if (key === "GENERIC") continue;

      const dateCol = findColumn(
        headers,
        Array.isArray(format.columns.date)
          ? format.columns.date.map((d) => d.toLowerCase())
          : [format.columns.date.toLowerCase()]
      );
      const amountCol = findColumn(
        headers,
        Array.isArray(format.columns.amount)
          ? format.columns.amount.map((a) => a.toLowerCase())
          : [format.columns.amount.toLowerCase()]
      );

      if (dateCol && amountCol) {
        console.log(`Detected bank format: ${format.name}`);
        return format;
      }
    }

    console.log("Using generic bank format");
    return BANK_FORMATS.GENERIC;
  } catch (error) {
    console.error("Error detecting bank format:", error);
    return BANK_FORMATS.GENERIC;
  }
}

/**
 * Validate parsed transactions
 */
export function validateTransactions(transactions: ParsedTransaction[]): {
  valid: ParsedTransaction[];
  invalid: Array<{ transaction: ParsedTransaction; errors: string[] }>;
} {
  const valid: ParsedTransaction[] = [];
  const invalid: Array<{ transaction: ParsedTransaction; errors: string[] }> =
    [];

  for (const transaction of transactions) {
    const errors: string[] = [];

    if (!transaction.bankReference) {
      errors.push("Missing bank reference");
    }
    if (
      !transaction.transactionDate ||
      isNaN(transaction.transactionDate.getTime())
    ) {
      errors.push("Invalid transaction date");
    }
    if (!transaction.amount || transaction.amount <= 0) {
      errors.push("Invalid amount");
    }

    if (errors.length > 0) {
      invalid.push({ transaction, errors });
    } else {
      valid.push(transaction);
    }
  }

  return { valid, invalid };
}
