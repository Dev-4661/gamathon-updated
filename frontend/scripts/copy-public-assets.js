import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcImages = path.join(root, 'src', 'assets', 'images');
const destImages = path.join(root, 'public', 'images');
const srcStyles = path.join(root, 'styles', 'gamezone.css');
const destStyles = path.join(root, 'public', 'styles', 'gamezone.css');
const logo = path.join(destImages, 'bollywood-outdoor-cinema-logo.png');
const favicon = path.join(root, 'public', 'favicon.png');

fs.mkdirSync(destImages, { recursive: true });
fs.mkdirSync(path.dirname(destStyles), { recursive: true });

if (fs.existsSync(srcImages)) {
  for (const file of fs.readdirSync(srcImages)) {
    fs.copyFileSync(path.join(srcImages, file), path.join(destImages, file));
  }
}

if (fs.existsSync(srcStyles)) {
  fs.copyFileSync(srcStyles, destStyles);
}

if (fs.existsSync(logo)) {
  fs.copyFileSync(logo, favicon);
}

console.log('Public assets copied for production build.');
