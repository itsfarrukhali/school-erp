// src/lib/constants.ts
export const ROLES = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  SCHOOLADMIN: "School Admin",
  PRINCIPAL: "Principal",
  CAMPUSHEAD: "Campus Head",
  TEACHER: "Teacher",
  ADMISSIONOFFICER: "Admission Officer",
  COMPUTEROPERATOR: "Computer Operator",
  ACCOUNTANT: "Accountant",
  STUDENT: "Student",
  PARENT: "Parent",
} as const;

export const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHERS", label: "Others" },
] as const;

export const BLOOD_GROUPS = [
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A-" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B-" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB-" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O-" },
] as const;

export const RELIGIONS = [
  { value: "ISLAM", label: "Islam" },
  { value: "CHRISTIANITY", label: "Christianity" },
  { value: "HINDUISM", label: "Hinduism" },
  { value: "BUDDHISM", label: "Buddhism" },
  { value: "JAINISM", label: "Jainism" },
  { value: "ZOROASTRIANISM", label: "Zoroastrianism" },
  { value: "OTHERS", label: "Others" },
] as const;

export const NATIONALITIES = [
  { value: "PAKISTANI", label: "Pakistani" },
  { value: "AFGHANISTANI", label: "Afghanistani" },
  { value: "CHINESE", label: "Chinese" },
  { value: "IRANIAN", label: "Iranian" },
  { value: "INDIAN", label: "Indian" },
  { value: "USA", label: "USA" },
  { value: "OTHER", label: "Other" },
] as const;
