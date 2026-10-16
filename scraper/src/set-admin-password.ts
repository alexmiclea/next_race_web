/**
 * Sets the admin's password for logging in at /admin/login. Typing is hidden, so the
 * password is never shown or saved anywhere except (hashed) in Supabase Auth.
 * Usage: npm run admin:password      (needs SUPABASE_URL and SUPABASE_SECRET_KEY in .env)
 */
import { passwordProblem } from './lib/password.ts';
import { connect } from './lib/supabase.ts';

const db = connect();
if (!db) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in scraper/.env');
if (!process.stdin.isTTY) throw new Error('Run this in a terminal, so the password can be typed hidden.');

const { data: admins, error } = await db.from('admins').select('user_id');
if (error) throw new Error(`Loading admins failed: ${error.message}`);
if (admins.length !== 1) throw new Error(`Expected exactly one admin, found ${admins.length}.`);
const { data: found, error: userError } = await db.auth.admin.getUserById(admins[0].user_id);
if (userError || !found.user?.email) throw new Error('Could not load the admin account.');
const email = found.user.email;

console.log(`Parolă nouă pentru ${email}`);
const password = await askHidden('Parola: ');
const problem = passwordProblem(password, email);
if (problem) {
  console.log(problem);
  process.exit(1);
}
if ((await askHidden('Încă o dată: ')) !== password) {
  console.log('Parolele nu coincid. Nimic nu a fost schimbat.');
  process.exit(1);
}

const { error: updateError } = await db.auth.admin.updateUserById(admins[0].user_id, { password });
if (updateError) throw new Error(`Saving the password failed: ${updateError.message}`);
console.log('Parola a fost salvată. Intră pe https://www.racely.ro/admin/login');
process.exit(0);

/** Reads one line from the terminal without echoing it. */
function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\u0003') {
          // Ctrl+C
          process.stdout.write('\n');
          process.exit(130);
        } else if (char === '\r' || char === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          process.stdout.write('\n');
          resolve(value);
          return;
        } else if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };
    stdin.on('data', onData);
  });
}
