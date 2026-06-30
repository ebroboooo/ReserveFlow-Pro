import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src');

const replacements = [
  ['org-reserveflow-pro', 'org-smilecare-pro'],
  ['glass-btn-primary', 'btn-primary'],
  ['glass-btn-secondary', 'btn-secondary'],
  ['glass-input', 'input-field'],
  ['glass-card-hover', 'card-hover'],
  ['glass-card', 'card'],
  ['glass-panel', 'panel'],
  ['/book/apex-preset', '/book/smilecare-clinic'],
  ['ReserveFlow Pro', 'SmileCare Pro'],
  ['ReserveFlow', 'SmileCare Pro'],
  ['bg-slate-950/80', 'bg-slate-900/40'],
  ['bg-slate-950/50', 'bg-slate-900/30'],
  ['bg-slate-950', 'bg-slate-50'],
  ['bg-slate-900/60', 'bg-slate-100'],
  ['bg-slate-900/50', 'bg-slate-50'],
  ['bg-slate-900/40', 'bg-slate-50'],
  ['bg-slate-900/30', 'bg-slate-50'],
  ['bg-slate-900', 'bg-white'],
  ['bg-slate-850', 'bg-slate-100'],
  ['bg-slate-800/50', 'bg-slate-100'],
  ['bg-slate-800/40', 'bg-slate-100'],
  ['bg-slate-800/20', 'bg-slate-50'],
  ['bg-slate-800', 'bg-slate-100'],
  ['border-slate-850/60', 'border-slate-200'],
  ['border-slate-850/40', 'border-slate-200'],
  ['border-slate-850', 'border-slate-200'],
  ['border-slate-800/80', 'border-slate-200'],
  ['border-slate-800/60', 'border-slate-200'],
  ['border-slate-800/40', 'border-slate-100'],
  ['border-slate-800', 'border-slate-200'],
  ['border-slate-700', 'border-slate-300'],
  ['text-slate-550', 'text-slate-500'],
  ['text-slate-300', 'text-slate-700'],
  ['text-slate-200', 'text-slate-800'],
  ['text-brand-300', 'text-brand-700'],
  ['text-brand-400', 'text-brand-600'],
  ['text-brand-100', 'text-brand-700'],
  ['hover:text-brand-300', 'hover:text-brand-700'],
  ['hover:border-brand-500/30', 'hover:border-brand-300'],
  ['Customer Database', 'Patient Database'],
  ['Register Customer', 'Register Patient'],
  ['Customer Registered', 'Patient Registered'],
  ['Customer Deleted', 'Patient Deleted'],
  ['customer profile', 'patient profile'],
  ['Manage client', 'Manage patient'],
  ['Select Specialist / Instructor', 'Select Doctor'],
  ['Select Service', 'Select Dental Service'],
  ['Select Branch location', 'Select Clinic Location'],
  ['Employee Management', 'Doctor Management'],
  ['Add Employee', 'Add Doctor'],
  ['Add Service', 'Add Dental Service'],
  ['Services Management', 'Dental Services'],
  ['Back to Customer Database', 'Back to Patient Database'],
  ['No customers found', 'No patients found'],
  ['register a new customer', 'register a new patient'],
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory() && entry !== 'node_modules') {
      files.push(...walk(full));
    } else if (/\.(tsx|ts)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

for (const file of walk(srcDir)) {
  let content = readFileSync(file, 'utf8');
  const original = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  content = content.replace(/text-white(?![\w-])/g, (match, offset) => {
    const snippet = content.slice(Math.max(0, offset - 80), offset + 40);
    if (snippet.includes('btn-primary') || snippet.includes('bg-brand-6') || snippet.includes('bg-brand-5') || snippet.includes('text-white flex')) {
      return match;
    }
    return 'text-slate-900';
  });
  if (content !== original) {
    writeFileSync(file, content);
    console.log('Updated:', file.replace(srcDir, 'src'));
  }
}
