import fs from 'fs';
import Papa from 'papaparse';

const csvContent = fs.readFileSync('scripts/lista_unidades_curriculares.csv', 'utf8');
const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

console.log('Total rows parsed:', parsed.data.length);

function normalizeName(name) {
  if (!name) return '';
  let clean = name.trim();
  // Remove trailing backslash, quotes, etc.
  clean = clean.replace(/\\+$/, '').trim();
  clean = clean.replace(/^["']|["']$/g, '').trim();
  // Replace multiple spaces with a single space
  clean = clean.replace(/\s+/g, ' ');
  return clean;
}

const rawList = parsed.data
  .map(row => normalizeName(row.Nombre_Unidad_Curricular))
  .filter(name => name && name.toUpperCase() !== 'NULL');

console.log('Valid non-null rows:', rawList.length);

const uniqueSet = new Set(rawList);
console.log('Unique raw names count:', uniqueSet.size);

// Let's inspect some of the names
const sorted = Array.from(uniqueSet).sort((a, b) => a.localeCompare(b, 'es'));
fs.writeFileSync('scripts/unique_unidades_preview.json', JSON.stringify(sorted, null, 2));
console.log('Saved preview to scripts/unique_unidades_preview.json');
