import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mdPath = path.join(root, "docs", "Expertly-AI-Code-Documentation-Ar.md");
const cssPath = path.join(root, "docs", "pdf-rtl.css");
const outPath = path.join(root, "docs", "Expertly-AI-Code-Documentation-Ar.html");

const md = fs.readFileSync(mdPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Expertly AI — دليل الشرح والمراجعة</title>
  <style>
${css}
@media print {
  body { font-size: 10pt; }
  h1 { page-break-before: always; }
  h1:first-of-type { page-break-before: avoid; }
}
  </style>
</head>
<body>
${body}
<p style="margin-top:3rem;color:#666;font-size:10pt;">لحفظ كـ PDF: من المتصفح اختر طباعة ثم «حفظ كـ PDF» أو Microsoft Print to PDF.</p>
</body>
</html>`;

fs.writeFileSync(outPath, html, "utf8");
console.log("Wrote", outPath);
