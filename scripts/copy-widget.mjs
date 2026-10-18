import { copyFile } from 'node:fs/promises';
await copyFile(new URL('../extensions/matcher/assets/matcher.js',import.meta.url),new URL('../public/matcher-widget.js',import.meta.url));
