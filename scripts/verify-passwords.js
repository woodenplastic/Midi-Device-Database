#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function verifyPassword() {
  console.log('🔑 Password Verification Tool');
  console.log('============================\n');
  
  const admin1Hash = '$2b$12$CyRHI4hfd4H5.92VBc.O9OnYIALZOY/ziu6MXsg3u9Ms.GRINpml.';
  const admin2Hash = '$2b$12$i1dHLoh6MojuTp8V4.YQ3OT4uLocdgQ72DGTco6VNmKlJAICErH76';
  
  try {
    const password1 = await askQuestion('Enter password for adrianwild: ');
    const isValid1 = await bcrypt.compare(password1, admin1Hash);
    console.log(`adrianwild: ${isValid1 ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    const password2 = await askQuestion('Enter password for andreaskiesgen: ');
    const isValid2 = await bcrypt.compare(password2, admin2Hash);
    console.log(`andreaskiesgen: ${isValid2 ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (isValid1 && isValid2) {
      console.log('\n🎉 Both passwords are correct! Your local setup should work.');
      console.log('\n📝 Use these credentials to login:');
      console.log(`Username: adrianwild | Password: ${password1}`);
      console.log(`Username: andreaskiesgen | Password: ${password2}`);
    } else {
      console.log('\n⚠️  Some passwords are incorrect. You may need to regenerate the hashes.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

verifyPassword();