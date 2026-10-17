const fs = require('fs');
const path = require('path');
const { chromium } = require('./backend/node_modules/playwright');

(async () => {
  try {
    const mdContent = fs.readFileSync('Proposed-structure-hackathon.md', 'utf8');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Convert basic markdown formatting to clean HTML
    const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const lines = mdContent.split('\n');
    let htmlBody = '';
    let inCode = false;
    let codeContent = '';
    
    for (const line of lines) {
      if (line.startsWith('```')) {
        if (inCode) {
          htmlBody += `<pre><code>${escapeHtml(codeContent)}</code></pre>\n`;
          codeContent = '';
          inCode = false;
        } else {
          inCode = true;
        }
        continue;
      }
      
      if (inCode) {
        codeContent += line + '\n';
        continue;
      }
      
      if (line.startsWith('# ')) {
        htmlBody += `<h1>${escapeHtml(line.slice(2))}</h1>\n`;
      } else if (line.startsWith('## ')) {
        htmlBody += `<h2>${escapeHtml(line.slice(3))}</h2>\n`;
      } else if (line.startsWith('### ')) {
        htmlBody += `<h3>${escapeHtml(line.slice(4))}</h3>\n`;
      } else if (line.trim() === '---') {
        htmlBody += `<hr/>\n`;
      } else if (line.trim().startsWith('- ')) {
        htmlBody += `<li>${escapeHtml(line.trim().slice(2))}</li>\n`;
      } else if (line.trim()) {
        htmlBody += `<p>${escapeHtml(line)}</p>\n`;
      }
    }

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Proposed-structure-hackathon</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 25px 35px; color: #1e293b; font-size: 13px; }
  h1 { color: #0f172a; border-bottom: 2px solid #06b6d4; padding-bottom: 6px; font-size: 22px; margin-top: 10px; }
  h2 { color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px; font-size: 16px; }
  h3 { color: #334155; font-size: 14px; margin-top: 16px; }
  pre { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; font-family: Consolas, monospace; font-size: 10px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
  code { font-family: Consolas, monospace; font-size: 11px; }
  p { margin: 6px 0; }
  li { margin-left: 20px; margin-bottom: 4px; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
</style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

    await page.setContent(fullHtml, { waitUntil: 'load' });
    await page.pdf({
      path: 'Proposed-structure-hackathon.pdf',
      format: 'A4',
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
      printBackground: true
    });
    await browser.close();
    console.log('SUCCESS: Proposed-structure-hackathon.pdf created!');
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
})();
