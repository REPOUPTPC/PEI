import fs from 'fs';
import Papa from 'papaparse';

const csvContent = fs.readFileSync('scripts/lista_unidades_curriculares.csv', 'utf8');
const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

function normalizeString(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

const clusters = new Map();

for (const row of parsed.data) {
  let name = row.Nombre_Unidad_Curricular;
  if (!name || name.trim().toUpperCase() === 'NULL') continue;
  name = name.trim().replace(/\\+$/, '').trim().replace(/^["']|["']$/g, '').trim().replace(/\s+/g, ' ');

  const norm = normalizeString(name);
  if (!clusters.has(norm)) {
    clusters.set(norm, new Set());
  }
  clusters.get(norm).add(name);
}

const multi = [];
for (const [norm, set] of clusters.entries()) {
  if (set.size > 1) {
    multi.push({ norm, variants: Array.from(set) });
  }
}

console.log('Clusters with multiple variants:', multi.length);
fs.writeFileSync('scripts/clusters_variants.json', JSON.stringify(multi, null, 2));
