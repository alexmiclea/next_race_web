/** Rules for the admin password, kept separate so they can be unit-tested. */

export const MIN_PASSWORD_LENGTH = 12;
/** Supabase (bcrypt) ignores anything past 72 bytes, so longer passwords aren't safer. */
export const MAX_PASSWORD_BYTES = 72;

/** Why a password can't be used, or null when it's fine. Messages are shown in the terminal. */
export function passwordProblem(password: string, email: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.`;
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return `Parola e prea lungă (maximum ${MAX_PASSWORD_BYTES} de octeți).`;
  }
  if (password.trim() !== password) return 'Parola nu poate începe sau se termina cu spații.';
  if (password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
    return 'Parola nu poate conține adresa de email.';
  }
  return null;
}
