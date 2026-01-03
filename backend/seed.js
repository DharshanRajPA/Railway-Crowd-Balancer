import { initDB, getDB } from './lib/db.js';

/**
 * Seed database with initial platform data
 */
function seedDatabase() {
  console.log('[Seed] Initializing database...');
  initDB();
  
  const db = getDB();
  
  // Check if platforms already exist
  const existing = db.prepare('SELECT COUNT(*) as count FROM platforms').get();
  
  if (existing.count > 0) {
    console.log('[Seed] Database already seeded. Skipping...');
    return;
  }
  
  // Insert 3 platforms
  const platforms = [
    { name: 'Platform 1', area: 1000 },
    { name: 'Platform 2', area: 1000 },
    { name: 'Platform 3', area: 1000 }
  ];
  
  const insert = db.prepare('INSERT INTO platforms (name, area) VALUES (?, ?)');
  const insertMany = db.transaction((platforms) => {
    for (const platform of platforms) {
      insert.run(platform.name, platform.area);
    }
  });
  
  insertMany(platforms);
  
  console.log('[Seed] Database seeded successfully with 3 platforms');
  console.log('[Seed] Platforms:');
  platforms.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} - ${p.area} m²`);
  });
}

// Run seed
try {
  seedDatabase();
  process.exit(0);
} catch (error) {
  console.error('[Seed] Error:', error);
  process.exit(1);
}

