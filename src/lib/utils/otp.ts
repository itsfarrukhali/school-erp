// src/lib/utils/otp.ts

/**
 * OTP (One-Time Password) Utility Functions
 * Generates and validates 6-digit verification codes
 */

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit numeric code
 */
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Get OTP expiry time (15 minutes from now)
 * @returns {Date} Expiry timestamp
 */
export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
}

/**
 * Check if OTP has expired
 * @param {Date | null} expiryDate - The expiry timestamp
 * @returns {boolean} True if expired
 */
export function isOTPExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  return new Date() > new Date(expiryDate);
}

/**
 * Validate OTP code format
 * @param {string} otp - The OTP to validate
 * @returns {boolean} True if valid format
 */
export function isValidOTPFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Check if user can request a new OTP (rate limiting)
 * Prevents spam by enforcing 1-minute cooldown
 * @param {Date | null} lastSent - Last verification sent timestamp
 * @returns {boolean} True if can send
 */
export function canSendOTP(lastSent: Date | null): boolean {
  if (!lastSent) return true;
  
  const now = new Date();
  const lastSentTime = new Date(lastSent);
  const diffInSeconds = (now.getTime() - lastSentTime.getTime()) / 1000;
  
  // Allow new OTP after 60 seconds
  return diffInSeconds >= 60;
}

/**
 * Get remaining cooldown time in seconds
 * @param {Date | null} lastSent - Last verification sent timestamp
 * @returns {number} Seconds remaining, 0 if can send
 */
export function getRemainingCooldown(lastSent: Date | null): number {
  if (!lastSent) return 0;
  
  const now = new Date();
  const lastSentTime = new Date(lastSent);
  const diffInSeconds = (now.getTime() - lastSentTime.getTime()) / 1000;
  const remaining = Math.max(0, 60 - diffInSeconds);
  
  return Math.ceil(remaining);
}
