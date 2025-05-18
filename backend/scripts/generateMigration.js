const { execSync } = require('child_process');

const args = process.argv.slice(2);
const nameArg = args.find(arg => arg.startsWith('--name='));

if (!nameArg) {
  console.error('Error: Please provide a migration name using --name=YourMigrationName');
  process.exit(1);
}

const migrationName = nameArg.split('=')[1];
if (!migrationName) {
  console.error('Error: Migration name cannot be empty');
  process.exit(1);
}

try {
  execSync(`yarn run typeorm migration:generate -d src/typeorm.config.ts ./src/migrations/${migrationName}`, 
    { stdio: 'inherit' }
  );
} catch (error) {
  console.error('Migration generation failed');
  process.exit(1);
}