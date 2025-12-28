/*
  Warnings:

  - A unique constraint covering the columns `[paymentCode]` on the table `vouchers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentCode` to the `vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('MATCHED', 'UNMATCHED', 'MANUAL_REVIEW', 'PARTIAL_MATCH');

-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."AdmissionStatus" AS ENUM ('INQUIRY', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ENROLLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."vouchers" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "month" TEXT,
ADD COLUMN     "paymentCode" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."incoming_payments" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "bankReference" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "accountHolderName" TEXT,
    "remarks" TEXT,
    "rawData" JSONB,
    "matchStatus" "public"."MatchStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchedAt" TIMESTAMP(3),
    "matchedBy" TEXT,
    "extractedCode" TEXT,
    "voucherId" TEXT,
    "studentId" TEXT,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incoming_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_reconciliations" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "incomingPaymentId" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "matchType" "public"."MatchType" NOT NULL,
    "matchConfidence" DOUBLE PRECISION,
    "amountMatched" DOUBLE PRECISION NOT NULL,
    "discrepancy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "reconciledBy" TEXT,
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_admissions" (
    "id" TEXT NOT NULL,
    "admissionNo" TEXT,
    "inquiryNo" TEXT,
    "studentName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "public"."Gender" NOT NULL,
    "religion" "public"."Religion",
    "nationality" "public"."Nationality",
    "address" JSONB NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "classAppliedFor" TEXT NOT NULL,
    "status" "public"."AdmissionStatus" NOT NULL DEFAULT 'INQUIRY',
    "submittedBy" TEXT NOT NULL,
    "submittedByRole" "public"."Role" NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "grNumber" TEXT,
    "enrolledStudentId" TEXT,
    "schoolId" TEXT NOT NULL,
    "campusId" TEXT,
    "documents" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_admissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incoming_payments_schoolId_matchStatus_idx" ON "public"."incoming_payments"("schoolId", "matchStatus");

-- CreateIndex
CREATE INDEX "incoming_payments_voucherId_idx" ON "public"."incoming_payments"("voucherId");

-- CreateIndex
CREATE INDEX "incoming_payments_studentId_idx" ON "public"."incoming_payments"("studentId");

-- CreateIndex
CREATE INDEX "incoming_payments_extractedCode_idx" ON "public"."incoming_payments"("extractedCode");

-- CreateIndex
CREATE INDEX "incoming_payments_importBatchId_idx" ON "public"."incoming_payments"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "incoming_payments_schoolId_bankReference_key" ON "public"."incoming_payments"("schoolId", "bankReference");

-- CreateIndex
CREATE INDEX "payment_reconciliations_schoolId_idx" ON "public"."payment_reconciliations"("schoolId");

-- CreateIndex
CREATE INDEX "payment_reconciliations_incomingPaymentId_idx" ON "public"."payment_reconciliations"("incomingPaymentId");

-- CreateIndex
CREATE INDEX "payment_reconciliations_voucherId_idx" ON "public"."payment_reconciliations"("voucherId");

-- CreateIndex
CREATE INDEX "payment_reconciliations_studentId_idx" ON "public"."payment_reconciliations"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_admissions_admissionNo_key" ON "public"."student_admissions"("admissionNo");

-- CreateIndex
CREATE UNIQUE INDEX "student_admissions_inquiryNo_key" ON "public"."student_admissions"("inquiryNo");

-- CreateIndex
CREATE INDEX "student_admissions_schoolId_idx" ON "public"."student_admissions"("schoolId");

-- CreateIndex
CREATE INDEX "student_admissions_campusId_idx" ON "public"."student_admissions"("campusId");

-- CreateIndex
CREATE INDEX "student_admissions_status_idx" ON "public"."student_admissions"("status");

-- CreateIndex
CREATE INDEX "student_admissions_submittedBy_idx" ON "public"."student_admissions"("submittedBy");

-- CreateIndex
CREATE INDEX "student_admissions_grNumber_idx" ON "public"."student_admissions"("grNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_paymentCode_key" ON "public"."vouchers"("paymentCode");

-- CreateIndex
CREATE INDEX "vouchers_paymentCode_idx" ON "public"."vouchers"("paymentCode");

-- AddForeignKey
ALTER TABLE "public"."incoming_payments" ADD CONSTRAINT "incoming_payments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incoming_payments" ADD CONSTRAINT "incoming_payments_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incoming_payments" ADD CONSTRAINT "incoming_payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_incomingPaymentId_fkey" FOREIGN KEY ("incomingPaymentId") REFERENCES "public"."incoming_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_admissions" ADD CONSTRAINT "student_admissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_admissions" ADD CONSTRAINT "student_admissions_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "public"."campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
