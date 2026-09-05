const fs = require('fs');
const files = [
  'src/routes/alerts.ts',
  'src/routes/assets.ts',
  'src/routes/creator-settings.ts',
  'src/routes/overlays.ts',
  'src/routes/triggers.ts'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/c\.req\.param\("id"\)/g, 'c.req.param("id")!');
  fs.writeFileSync(file, content);
}
