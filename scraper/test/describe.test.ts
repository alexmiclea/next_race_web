import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  descriptionProblems,
  MIN_PAGE_CHARS,
  MAX_PAGE_CHARS,
  missingEvidence,
  normalizeForMatch,
  pageText,
  parseDrafts,
  skipReason,
} from '../src/lib/describe.ts';

describe('pageText', () => {
  it('keeps visible text and drops scripts, styles, navigation and footer', () => {
    const { text } = pageText(`<html><body>
      <nav>Acasă | Contact</nav>
      <script>var x = 1;</script><style>p { color: red }</style>
      <h1>Alergăraș în Făgăraș</h1>
      <p>Traseul trece prin pădure.</p>
      <footer>© Organizator</footer>
    </body></html>`);
    assert.match(text, /Alergăraș în Făgăraș/);
    assert.match(text, /Traseul trece prin pădure\./);
    assert.doesNotMatch(text, /Acasă|var x|color: red|Organizator/);
  });

  it('prefers <main> when the page has one', () => {
    const { text } = pageText('<body><aside>Reclamă</aside><main><p>Cursa</p></main></body>');
    assert.equal(text, 'Cursa');
  });

  it('keeps neighbouring blocks apart', () => {
    const { text } = pageText('<body><div>Start din centru</div><div>Sosire la cetate</div></body>');
    assert.match(text, /centru\nSosire/);
  });

  it('cuts very long pages and says so', () => {
    const { text, truncated } = pageText(`<body><p>${'a'.repeat(MAX_PAGE_CHARS + 10)}</p></body>`);
    assert.equal(text.length, MAX_PAGE_CHARS);
    assert.equal(truncated, true);
  });
});

describe('normalizeForMatch', () => {
  it('unifies case, spaces, cedilla letters, quotes and dashes', () => {
    assert.equal(normalizeForMatch('Şosea  „Ţepeș”  –  Start'), 'șosea "țepeș" - start');
  });
});

describe('missingEvidence', () => {
  const page = 'Traseul urcă pe creasta Făgărașului.\nStartul se dă din Piața Mare.';

  it('accepts quotes that are on the page, ignoring case and spacing', () => {
    assert.deepEqual(missingEvidence(['urcă pe   creasta', 'STARTUL SE DĂ'], page), []);
  });

  it('catches quotes that are not on the page (invented facts)', () => {
    assert.deepEqual(missingEvidence(['urcă pe creasta', 'cu 2000 m diferență de nivel'], page), [
      'cu 2000 m diferență de nivel',
    ]);
  });
});

describe('descriptionProblems', () => {
  const page = 'Traseul urcă pe creasta Făgărașului. Startul se dă din Piața Mare din Sibiu.';
  const good = 'Cursă montană al cărei traseu urcă pe creasta Făgărașului, cu plecare din Piața Mare din Sibiu.';

  it('passes a factual description backed by quotes from the page', () => {
    assert.deepEqual(descriptionProblems(good, ['urcă pe creasta Făgărașului', 'Piața Mare din Sibiu'], page), []);
  });

  it('rejects evidence that is not on the page', () => {
    const problems = descriptionProblems(good, ['urcă pe creasta Făgărașului', 'cea mai frumoasă cursă'], page);
    assert.match(problems.join(), /evidence not found/);
  });

  it('rejects a description with no evidence', () => {
    assert.match(descriptionProblems(good, [], page).join(), /no evidence/);
  });

  it('rejects years and prices', () => {
    assert.match(descriptionProblems(`${good} Ediția 2027.`, ['Piața Mare'], page).join(), /year/);
    assert.match(descriptionProblems(`${good} Taxa este 150 lei.`, ['Piața Mare'], page).join(), /price/);
  });

  it('rejects descriptions that are too short', () => {
    assert.match(descriptionProblems('Cursă la Sibiu.', ['Sibiu'], page).join(), /too short/);
  });
});

describe('skipReason', () => {
  it('skips Facebook pages, which need a login', () => {
    assert.equal(skipReason('https://www.facebook.com/events/123'), 'Facebook page');
    assert.equal(skipReason('https://m.facebook.com/FagetWinterRace'), 'Facebook page');
    assert.equal(skipReason('https://fb.com/x'), 'Facebook page');
  });

  it('does not mistake other sites with "facebook" in the address for Facebook', () => {
    assert.equal(skipReason('https://alergaras.ro/facebook-gallery'), null);
  });

  it('skips pages with almost no text', () => {
    assert.match(skipReason('https://alergaras.ro/', { text: 'Loading…' })!, /almost no text/);
  });

  it('accepts a normal organizer page', () => {
    assert.equal(skipReason('https://alergaras.ro/', { text: 'a'.repeat(MIN_PAGE_CHARS) }), null);
  });
});

describe('parseDrafts', () => {
  it('reads descriptions and "not enough facts" entries', () => {
    const drafts = parseDrafts(
      JSON.stringify([
        { id: 'a', description: 'Cursă montană.', evidence: ['creasta'] },
        { id: 'b', description: null, evidence: [], note: 'pagina e despre alt eveniment' },
      ]),
    );
    assert.equal(drafts.length, 2);
    assert.equal(drafts[1].description, null);
    assert.equal(drafts[1].note, 'pagina e despre alt eveniment');
  });

  it('reports invalid JSON clearly', () => {
    assert.throws(() => parseDrafts('[{"id": "a",}]'), /not valid JSON/);
  });

  it('requires a list', () => {
    assert.throws(() => parseDrafts('{"id": "a"}'), /must be a list/);
  });

  it('lists every problem at once, with the draft number', () => {
    assert.throws(
      () =>
        parseDrafts(
          JSON.stringify([
            { description: 'x', evidence: [] },
            { id: 'b', description: 5, evidence: 'creasta' },
          ]),
        ),
      (error: Error) =>
        /draft 1: missing "id"/.test(error.message) &&
        /draft 2: "description" must be text or null/.test(error.message) &&
        /draft 2: "evidence" must be a list of quotes/.test(error.message),
    );
  });
});
