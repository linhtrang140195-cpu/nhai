import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync('dist', { recursive: true, force: true });
copyDir('public', 'dist');

const siteBody = fs.readFileSync('public/site.html', 'utf8');
const fonts = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap';
const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Free Fire - 9 Nam Giu Chuoi</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${fonts}" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
${siteBody}
<script src="script.js"></script>
</body>
</html>`;

fs.writeFileSync('dist/index.html', html, 'utf8');
console.log('Build complete -> dist/');
