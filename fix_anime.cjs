const fs = require('fs');
let content = fs.readFileSync('packages/alert-engine/src/themes/anime/AnimeAlert.tsx', 'utf8');
content = content.replace(/skewX: '-15deg'/g, "transform: 'skewX(-15deg)'");
content = content.replace(/skewX: '0deg'/g, "transform: 'skewX(0deg)'");
content = content.replace(/skewX: -15/g, "transform: 'skewX(-15deg)'");
fs.writeFileSync('packages/alert-engine/src/themes/anime/AnimeAlert.tsx', content);
