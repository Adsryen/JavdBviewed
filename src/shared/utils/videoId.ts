export function extractVideoId(rawText: string): string | null {
  if (!rawText) return null;

  const trimmed = rawText.trim();
  const patterns = [
    /^([A-Z]{2,6}-\d{2,6})/i,
    /^(\d{4,8}_\d{1,3})/,
    /^(FC2-PPV-\d+)/i,
    /^(\d{6,12})/,
    /^([a-z0-9]+-\d+_\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  const firstWord = trimmed.split(/\s+/)[0];
  if (!firstWord) return null;

  const cleanId = firstWord.replace(/[^\x00-\x7F]/g, '').toUpperCase();
  return cleanId.length >= 3 ? cleanId : null;
}
