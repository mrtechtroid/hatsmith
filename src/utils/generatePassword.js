const _sodium = require("libsodium-wrappers");
const dicewareWordlist = require("../helpers/eef_word_list.json");
export const generatePassword = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  let password = sodium.to_base64(
    sodium.randombytes_buf(16),
    sodium.base64_variants.URLSAFE_NO_PADDING
  );
  return password;
};

export const generatePassPhrase = async () =>{
  await _sodium.ready;
  const sodium = _sodium;
  const numWords = 5;
  const passphraseWords = [];

  for (let i = 0; i < numWords; i++) {
    let diceKey = "";

    // Roll 5 dice (numbers from 1 to 6)
    for (let j = 0; j < 5; j++) {
      const roll = sodium.randombytes_uniform(6) + 1; // [1–6]
      diceKey += roll.toString();
    }

    const word = dicewareWordlist[diceKey];

    if (!word) {
      // If key not found, redo this word
      i--;
      continue;
    }

    passphraseWords.push(word);
  }

  return passphraseWords.join("-");
};