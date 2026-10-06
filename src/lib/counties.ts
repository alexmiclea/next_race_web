/** Lowercase without diacritics, so "brasov" finds "Brașov" and "iasi" finds "Iași". */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Whether a county name matches what the user typed in the search box. */
export function matchesSearch(name: string, query: string): boolean {
  const folded = fold(query);
  return folded === "" || fold(name).includes(folded);
}

/**
 * Short summary of the selected county names for a closed dropdown: the first
 * `max` names, plus how many more are selected.
 */
export function summarizeCounties(names: string[], max = 2): { shown: string[]; more: number } {
  return { shown: names.slice(0, max), more: Math.max(0, names.length - max) };
}
