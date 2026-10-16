import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MIN_PASSWORD_LENGTH, passwordProblem } from '../src/lib/password.ts';

const EMAIL = 'alex@example.com';

describe('passwordProblem', () => {
  it('accepts a long passphrase', () => {
    assert.equal(passwordProblem('cai verzi pe pereti 42', EMAIL), null);
  });

  it(`needs at least ${MIN_PASSWORD_LENGTH} characters`, () => {
    assert.match(passwordProblem('scurta1!', EMAIL)!, /cel puțin 12/);
  });

  it('rejects passwords longer than Supabase can store', () => {
    assert.match(passwordProblem('ă'.repeat(40), EMAIL)!, /prea lungă/);
  });

  it('rejects leading or trailing spaces, which are easy to type by mistake', () => {
    assert.match(passwordProblem(' cai verzi pe pereti', EMAIL)!, /spații/);
  });

  it('rejects a password that contains the email name', () => {
    assert.match(passwordProblem('parola-lui-alex-2026', EMAIL)!, /email/);
  });
});
