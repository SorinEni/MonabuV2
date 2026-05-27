/**
 * utils/usernameGenerator.js
 *
 * Generates a random, human-friendly temporary username such as
 * "fluffy-bunny-4821" and verifies it is not already taken before returning.
 *
 * The generated username:
 *   - Follows the pattern: <adjective>-<animal>-<4-digit number>
 *   - Is all lowercase, using only letters, digits, and hyphens
 *   - Fits within the 32-character username limit
 *   - Has tempUsername: true so the user can later claim a permanent one
 */

import User from "#models/User";
import { ADJECTIVES, ANIMALS } from "#constants/namesGenerator";


function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCandidate() {
  const adj = pickRandom(ADJECTIVES);
  const animal = pickRandom(ANIMALS);
  const num = String(Math.floor(Math.random() * 9000) + 1000); // 1000–9999
  return `${adj}-${animal}-${num}`;
}

/**
 * Generates a unique temporary username that is not already taken in the DB.
 * Retries up to 10 times before giving back a UUID-based fallback.
 */
export async function generateTempUsername() {
  for (let i = 0; i < 10; i++) {
    const candidate = generateCandidate();
    const taken = await User.exists({ username: candidate });
    if (!taken) return candidate;
  }
  // Extremely unlikely fallback: just use a timestamp-based handle
  return `user-${Date.now().toString(36)}`;
}
