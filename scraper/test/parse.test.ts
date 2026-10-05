import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  cityFromName,
  parseDatePrefix,
  parseDistances,
  parseLocation,
} from '../src/lib/parse.ts';
import { parseBulletList } from '../src/parsers/bullet-list.ts';

describe('parseDatePrefix', () => {
  it('parses a single day', () => {
    assert.deepEqual(parseDatePrefix('Ianuarie 23: Oradea City Trail', 2027), {
      startDate: '2027-01-23',
      endDate: '2027-01-23',
      startTime: null,
      rest: 'Oradea City Trail',
    });
  });

  it('parses a range within a month and across months', () => {
    const sameMonth = parseDatePrefix('Aprilie 24-25: X', 2027)!;
    assert.equal(sameMonth.startDate, '2027-04-24');
    assert.equal(sameMonth.endDate, '2027-04-25');

    const acrossMonths = parseDatePrefix('Ianuarie 01 – Decembrie 31: X', 2027)!;
    assert.equal(acrossMonths.endDate, '2027-12-31');
  });

  it('parses a start time', () => {
    const date = parseDatePrefix('Octombrie 25, ora 3:59: Cursa Imposibilă', 2026)!;
    assert.equal(date.startTime, '03:59');
    assert.equal(date.rest, 'Cursa Imposibilă');
  });

  it('rejects non-dates and impossible dates', () => {
    assert.equal(parseDatePrefix('În fiecare joi, de la ora 19: …', 2027), null);
    assert.equal(parseDatePrefix('Februarie 30: X', 2027), null);
  });
});

describe('parseLocation', () => {
  it('splits city and county code', () => {
    assert.deepEqual(parseLocation('Făgăraș BV'), { city: 'Făgăraș', county: 'BV', isVirtual: false });
  });

  it('maps non-standard county codes', () => {
    assert.equal(parseLocation('Toplița HG').county, 'HR');
  });

  it('looks up county seats', () => {
    assert.deepEqual(parseLocation('Cluj-Napoca'), { city: 'Cluj-Napoca', county: 'CJ', isVirtual: false });
  });

  it('treats "oriunde" as virtual', () => {
    assert.equal(parseLocation('oriunde').isVirtual, true);
  });
});

describe('parseDistances', () => {
  it('parses kilometres, decimal commas and categories', () => {
    assert.deepEqual(parseDistances('21km, 2,5km, 21k, copii'), [
      { label: '21km', km: 21 },
      { label: '2,5km', km: 2.5 },
      { label: '21k', km: 21 },
      { label: 'copii', km: null },
    ]);
  });
});

describe('cityFromName', () => {
  it('finds a county seat anywhere in the name', () => {
    assert.equal(cityFromName('Timișoara 21k'), 'Timișoara');
    assert.equal(cityFromName('Alba Iulia City Race'), 'Alba Iulia');
    assert.equal(cityFromName('Semimaraton Iași'), 'Iași');
    assert.equal(cityFromName('Wizz Air Cluj-Napoca Marathon'), 'Cluj-Napoca');
  });

  it('understands aliases', () => {
    assert.equal(cityFromName('Bucharest Half Marathon'), 'București');
    assert.equal(cityFromName('Semimaratonul Craiovei'), 'Craiova');
  });

  it('matches whole words only', () => {
    assert.equal(cityFromName('Aradul Vechi Run'), null);
  });
});

describe('parseBulletList', () => {
  const html = `<div>
    <p><em>• Ianuarie 23:</em> <strong><a href="https://www.facebook.com/FagetWinterRace">Făget Winter Race</a></strong>, Cluj-Napoca &#8211; 21km, 15km, 7km</p>
    <p><em>• Aprilie 24-25:</em>&nbsp;<strong><a href="https://alergaras.ro/">Alergăraș în Făgăraș</a></strong>, Făgăraș BV – 46km, 3km, kids, ștafetă</p>
    <p><em>• Martie 21:</em>&nbsp;<strong><a href="https://21k.ro/portfolio/timisoara/">Timișoara 21k</a></strong> &#8211; 21km, 10km</p>
    <p><em>• Octombrie 25:</em> <strong><a href="https://x.ro/">Timișoara City Marathon</a></strong>, 42km, 21km</p>
    <p><em>• Mai 08:</em> <strong><a href="https://x.ro/c">Csíkborzsova Maraton</a></strong>, Bârzava HR</p>
    <p><em>• (RM) Martie 14:</em>&nbsp;<strong><a href="https://sporter.md/">Mileștii Mici WineRun</a></strong>, Mileștii Mici &#8211; Republica Moldova &#8211; 10km</p>
    <p>• În fiecare joi, de la ora 19, are loc în Brăila o alergare de grup.</p>
    <p>Dacă ai vreo completare, te rog scrie-mi!</p>
  </div>`;
  const url = 'https://calendar.example.ro/alergare-2027/';
  const { races, skipped } = parseBulletList(html, {
    url,
    year: 2027,
    today: '2027-02-01',
    sport: 'running',
    itemSelector: 'p',
  });
  const byName = Object.fromEntries(races.map((race) => [race.name, race]));

  it('keeps upcoming Romanian races and skips the rest', () => {
    assert.deepEqual(Object.keys(byName).sort(), [
      'Alergăraș în Făgăraș',
      'Csíkborzsova Maraton',
      'Timișoara 21k',
      'Timișoara City Marathon',
    ]);
    assert.deepEqual(skipped.map((skip) => skip.reason).sort(), ['not-romania', 'past', 'recurring']);
  });

  it('parses name, location, distances and link', () => {
    const race = byName['Alergăraș în Făgăraș'];
    assert.equal(race.startDate, '2027-04-24');
    assert.equal(race.endDate, '2027-04-25');
    assert.equal(race.city, 'Făgăraș');
    assert.equal(race.county, 'BV');
    assert.deepEqual(race.distances.map((d) => d.label), ['46km', '3km', 'kids', 'ștafetă']);
    assert.equal(race.websiteUrl, 'https://alergaras.ro/');
    assert.equal(race.source, 'calendar.example.ro');
    assert.equal(race.sourceUrl, url);
    assert.equal(race.sport, 'running');
    assert.equal(race.externalKey, 'alergaras-in-fagaras-2027-04-24');
    assert.deepEqual(race.warnings, []);
  });

  it('infers the city from the name and flags it', () => {
    const race = byName['Timișoara 21k'];
    assert.equal(race.city, 'Timișoara');
    assert.equal(race.county, 'TM');
    assert.match(race.warnings.join(), /inferred/);
  });

  it('handles distances after a comma instead of a dash', () => {
    assert.deepEqual(byName['Timișoara City Marathon'].distances.map((d) => d.km), [42, 21]);
  });

  it('handles a location without distances', () => {
    const race = byName['Csíkborzsova Maraton'];
    assert.equal(race.city, 'Bârzava');
    assert.equal(race.county, 'HR');
    assert.match(race.warnings.join(), /No distances/);
  });
});
