const fs = require('fs');

const content = fs.readFileSync('script.js', 'utf8');

const updated = content.replace(
/                case 'nameAZ':\n                    return a.text.toLowerCase\(\).localeCompare\(b.text.toLowerCase\(\)\);\n                case 'nameZA':\n                    return b.text.toLowerCase\(\).localeCompare\(a.text.toLowerCase\(\)\);/,
`                case 'nameAZ':
                    return a._lowerText.localeCompare(b._lowerText);
                case 'nameZA':
                    return b._lowerText.localeCompare(a._lowerText);`
);

fs.writeFileSync('script.js', updated);
