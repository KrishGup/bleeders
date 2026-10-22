/** Two-letter monogram for a character crest: "Ichigo Kurosaki" → "IK". */
export function initialsOf(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, '')
    .split(/[\s-]+/)
    .filter((w) => /\p{L}/u.test(w) && !['no', 'de', 'la', 'del', 'tu'].includes(w.toLowerCase()));
  const letters = words.map((w) => [...w.normalize('NFD').replace(/[\u0300-\u036f]/g, '')][0]!.toUpperCase());
  if (letters.length <= 2) return letters.join('');
  return letters[0]! + letters[letters.length - 1]!;
}
