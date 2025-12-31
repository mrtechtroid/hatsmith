// import zxcvbn from "zxcvbn";
import { getTranslations as t } from "../../locales";

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'


const minute = 60,
      hour = minute * 60,
      day = hour * 24,
      month = day * 31,
      year = month * 12,
      century = year * 100;

const strength = {
  0: t("very_weak"),
  1: t("weak"),
  2: t("moderate"),
  3: t("good"),
  4: t("strong"),
};

const display_time = (seconds) => {
  let base, display_str, ref;

  (ref =
    seconds < 1
      ? [null, `${t('less_second')}`]
      : seconds < minute
      ? ((base = Math.round(seconds)), [base, base + ` ${t('seconds')}`])
      : seconds < hour
      ? ((base = Math.round(seconds / minute)), [base, base + ` ${t('minutes')}`])
      : seconds < day
      ? ((base = Math.round(seconds / hour)), [base, base + ` ${t('hours')}`])
      : seconds < month
      ? ((base = Math.round(seconds / day)), [base, base + ` ${t('days')}`])
      : seconds < year
      ? ((base = Math.round(seconds / month)), [base, base + ` ${t('months')}`])
      : seconds < century
      ? ((base = Math.round(seconds / year)), [base, base + ` ${t('years')}`])
      : [null, t('centuries')]),
    (display_str = ref[1]);
  return display_str;
};

const options = {
  translations: zxcvbnEnPackage.translations,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
}
zxcvbnOptions.setOptions(options)

// Enhanced password complexity validation (CWE-521)
// Minimum length increased from 12 to 16 characters
// Added complexity validation (3+ character types required)
const validatePasswordComplexity = (password) => {
  const minLength = 16; // Increased from 12 to 16 characters
  const errors = [];
  
  // Length check
  if (password.length < minLength) {
    errors.push(t("password_too_short").replace("{min}", minLength));
  }
  
  // Character type checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  
  const characterTypes = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars];
  const typeCount = characterTypes.filter(Boolean).length;
  
  // Require at least 3 different character types
  if (typeCount < 3) {
    errors.push(t("password_complexity_required"));
  }
  
  // Common weak password patterns
  const weakPatterns = [
    /^(.)\1+$/, // All same character
    /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential
    /^(password|123456|qwerty|admin|letmein|welcome|monkey|dragon|master|shadow|login|princess|football|baseball|superman|batman|trustno1)/i, // Common passwords
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push(t("password_too_common"));
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    meetsMinLength: password.length >= minLength,
    hasComplexity: typeCount >= 3
  };
};

const passwordStrengthCheck = (password) => {
  // First check basic complexity requirements
  const complexityCheck = validatePasswordComplexity(password);
  
  if (!complexityCheck.isValid) {
    return [t("insufficient"), t("improve_password"), complexityCheck.errors];
  }
  
  let strengthResult = zxcvbn(password);
  console.log(strengthResult);
  let score = strengthResult.score;
  let crackTimeInSeconds = strengthResult.crackTimesSeconds.offlineSlowHashing1e4PerSecond;
  let crackTime = display_time(crackTimeInSeconds);
  // Adjust score based on enhanced requirements
  if (password.length >= 20 && complexityCheck.hasComplexity) {
    score = Math.min(4, score + 1); // Bonus for very long complex passwords
  }
  
  return [strength[score], crackTime, []];
  return [strength[score], crackTime];
};
// Export the complexity validator for use in components
export const validatePasswordComplexity = validatePasswordComplexity;

// Export minimum length constant
export const MIN_PASSWORD_LENGTH = 16;


export default passwordStrengthCheck;
