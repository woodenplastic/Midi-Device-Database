#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function testPasswords() {
  console.log('🔍 Testing your password hashes...\n');
  
  const admin1Hash = '$2b$12$CyRHI4hfd4H5.92VBc.O9OnYIALZOY/ziu6MXsg3u9Ms.GRINpml.';
  const admin2Hash = '$2b$12$i1dHLoh6MojuTp8V4.YQ3OT4uLocdgQ72DGTco6VNmKlJAICErH76';
  
  // Test some common passwords to see which one matches
  const testPasswords = [
    'Admin_2024_Secure!',
    'SecurePass_2024!',
    'password123',
    'admin123',
    'test123',
    // Add your actual passwords here for testing
  ];
  
  console.log('Testing Admin 1 (adrianwild):');
  for (const password of testPasswords) {
    const isValid = await bcrypt.compare(password, admin1Hash);
    if (isValid) {
      console.log(`✅ Password found: "${password}"`);
      break;
    }
  }
  
  console.log('\nTesting Admin 2 (andreaskiesgen):');
  for (const password of testPasswords) {
    const isValid = await bcrypt.compare(password, admin2Hash);
    if (isValid) {
      console.log(`✅ Password found: "${password}"`);
      break;
    }
  }
  
  console.log('\n💡 If no passwords matched, add your actual passwords to the testPasswords array above.');
}

testPasswords().catch(console.error);