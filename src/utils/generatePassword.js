const _sodium = require("libsodium-wrappers");
const dicewareWordlist = require("../helpers/eef_word_list.json");

// Enhanced password generation with 256-bit entropy (CWE-330)
// Upgraded from 128-bit to 256-bit entropy for better security
export const generatePassword = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Generate 32 bytes (256 bits) of random data instead of 16 bytes (128 bits)
  let password = sodium.to_base64(
    sodium.randombytes_buf(32),
    sodium.base64_variants.URLSAFE_NO_PADDING
  );
  return password;
};

// Enhanced passphrase generation with better error handling and 6 words
export const generatePassPhrase = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  const numWords = 6; // Increased from 5 to 6 words for better entropy
  const passphraseWords = [];
  const maxRetries = 100; // Prevent infinite loops

  for (let i = 0; i < numWords; i++) {
    let wordFound = false;
    let retryCount = 0;

    while (!wordFound && retryCount < maxRetries) {
      let diceKey = "";

      // Roll 5 dice (numbers from 1 to 6) using cryptographically secure random
      for (let j = 0; j < 5; j++) {
        const roll = sodium.randombytes_uniform(6) + 1; // [1–6]
        diceKey += roll.toString();
      }

      const word = dicewareWordlist[diceKey];

      if (word) {
        passphraseWords.push(word);
        wordFound = true;
      } else {
        retryCount++;
      }
    }

    // If we couldn't find a word after max retries, use a fallback
    if (!wordFound) {
      // Generate a fallback word using secure random characters
      const fallbackWord = generateFallbackWord(sodium);
      passphraseWords.push(fallbackWord);
    }
  }

  return passphraseWords.join("-");
};
// Fallback word generation for edge cases
const generateFallbackWord = (sodium) => {
  const charset = "abcdefghijklmnopqrstuvwxyz";
  const wordLength = 6;
  let fallbackWord = "";
  
  for (let i = 0; i < wordLength; i++) {
    const randomIndex = sodium.randombytes_uniform(charset.length);
    fallbackWord += charset[randomIndex];
  }
  
  return fallbackWord;
};

// Secure memory clearing utility for sensitive data
export const clearSensitiveData = (data) => {
  // Note: JavaScript strings are immutable - this function cannot actually clear
  // the original string data. Consider using typed arrays (Uint8Array) for
  // sensitive data that needs to be securely cleared.
  console.warn('clearSensitiveData: JavaScript strings cannot be securely cleared');
};
