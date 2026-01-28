/**
 * Script สำหรับ generate bcrypt hash สำหรับ passwords
 * 
 * Usage:
 *   node scripts/generate-bcrypt-hash.js
 * 
 * หรือ generate hash เดียว:
 *   node -e "require('bcryptjs').hash('password123', 10).then(console.log)"
 */

const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('🔐 Generating bcrypt hashes...\n');
  
  const passwords = {
    'admin123': 'admin',
    'password123': 'tech1',
    'client123': 'client1'
  };
  
  for (const [password, username] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`-- ${username} (${password}):`);
    console.log(`'${hash}'`);
    console.log('');
  }
  
  console.log('✅ Done! Copy hashes above to SQL script.');
}

generateHashes().catch(console.error);
