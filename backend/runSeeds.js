const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const seedsDir = path.join(__dirname, 'src', 'seeds');
const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.ts'));

console.log('Ejecutando seeds en src/seeds:');
for (const file of files) {
  const fullPath = path.join(seedsDir, file);
  console.log(`- Ejecutando ${file}`);
  try {
    execSync(`npx ts-node "${fullPath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Error ejecutando ${file}:`, err.message);
  }
}
console.log('Seeds ejecutados.');
