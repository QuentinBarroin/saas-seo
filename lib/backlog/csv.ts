/**
 * Sérialisation CSV conforme RFC 4180 : séparateur virgule, fin de ligne CRLF,
 * cellules contenant guillemet / virgule / retour-ligne entourées de guillemets
 * (les guillemets internes sont doublés).
 */
function escapeCsvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[]
): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');
}
