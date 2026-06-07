import { FamilyMember } from '../types';

export function exportJSON(data: FamilyMember) {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pohon-keluarga.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportPNG(svgElement: SVGSVGElement | null) {
  if (!svgElement) return;
  // Fallback to simple svg export for now, html2canvas has issues with complex svgs sometimes
  exportSVG(svgElement);
}

export async function exportPDF(svgElement: SVGSVGElement | null) {
  if (!svgElement) return;
  // Mock PDF export, would use jsPDF + html2canvas
  alert("Fitur ekspor PDF akan segera hadir. Gunakan ekspor SVG sementara ini.");
}

export function exportSVG(svgElement: SVGSVGElement | null) {
  if (!svgElement) return;
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pohon-keluarga.svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Basic flatten function for CSV
function flattenTree(node: FamilyMember, parentId?: string): any[] {
  const row = {
    id: node.id,
    name: node.name,
    parentId: parentId || '',
    spouseName: node.spouseName || '',
    birthYear: node.birthYear || '',
    deathYear: node.deathYear || '',
    isAlive: node.isAlive,
    gender: node.gender || '',
    branch: node.branch || '',
    bio: node.bio || ''
  };
  let rows = [row];
  if (node.children) {
    for (const child of node.children) {
      rows = rows.concat(flattenTree(child, node.id));
    }
  }
  return rows;
}

export function exportCSV(data: FamilyMember) {
  const rows = flattenTree(data);
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pohon-keluarga.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
