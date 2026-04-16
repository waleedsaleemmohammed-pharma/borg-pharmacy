import { LOGO_BASE64 } from '@/data/logoBase64';

function getExportHTML(element: HTMLElement, title: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Cairo', sans-serif; 
      direction: rtl; 
      padding: 20px;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0e7490; color: white; padding: 10px 8px; font-size: 12px; font-weight: 900; }
    td { padding: 8px; border: 1px solid #ddd; font-size: 10px; vertical-align: top; }
    tr:nth-child(even) { background: #f8f9fa; }
    .header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #0e7490; }
    .header img { width: 50px; height: 50px; border-radius: 50%; margin-bottom: 5px; }
    .header h1 { font-size: 18px; font-weight: 900; color: #0e7490; }
    .header p { font-size: 12px; font-weight: 700; color: #333; }
    .company-tag { display: inline-block; padding: 2px 6px; margin: 1px 0; border-radius: 4px; font-weight: 900; font-size: 9px; }
    .company-main { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .company-normal { background: #f3f4f6; color: #111; border: 1px solid #e5e7eb; }
    .stat-card { display: inline-block; padding: 10px 20px; margin: 5px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 900; }
    .stat-label { font-size: 10px; font-weight: 700; color: #666; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${LOGO_BASE64}" alt="logo" />
  </div>
  ${element.innerHTML}
</body>
</html>`;
}

export function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = getExportHTML(element, filename);
  printWindow.document.write(html + `
    <script>
      window.onload = function() { 
        setTimeout(function() { window.print(); window.close(); }, 300);
      };
    <\/script>
  `);
  printWindow.document.close();
}

export function downloadAsHTML(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const html = getExportHTML(element, filename);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
