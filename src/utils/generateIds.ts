// src/utils/generateIds.ts
export function generateUID(prefix: string = "U"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`.toUpperCase();
}

export function generateStudentID(schoolCode: string): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `STU${schoolCode}${timestamp}${random}`;
}

export function generateTeacherID(schoolCode: string): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `TCH${schoolCode}${timestamp}${random}`;
}
