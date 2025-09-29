#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 MIDI Database Security Setup Tool');
console.log('=====================================\n');

async function generateJWTSecret() {
  const secret = crypto.randomBytes(64).toString('hex');
  console.log('📦 JWT Secret (copy to Vercel env vars):');
  console.log(`JWT_SECRET=${secret}\n`);
  return secret;
}

async function generatePasswordHash(password) {
  const hash = await bcrypt.hash(password, 12);
  return hash;
}

async function setup() {
  try {
    // Generate JWT Secret
    const jwtSecret = await generateJWTSecret();
    
    // Get admin usernames and passwords
    const admin1Username = await askQuestion('Enter username for Admin 1 (default: admin1): ') || 'admin1';
    const admin1Password = await askQuestion('Enter secure password for Admin 1: ');
    
    const admin2Username = await askQuestion('Enter username for Admin 2 (default: admin2): ') || 'admin2';
    const admin2Password = await askQuestion('Enter secure password for Admin 2: ');
    
    console.log('\n🔄 Generating password hashes...\n');
    
    const admin1Hash = await generatePasswordHash(admin1Password);
    const admin2Hash = await generatePasswordHash(admin2Password);
    
    console.log('🎉 Your Vercel Environment Variables:');
    console.log('====================================');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log(`NODE_ENV=production`);
    console.log(`ADMIN1_USERNAME=${admin1Username}`);
    console.log(`ADMIN1_PASSWORD_HASH=${admin1Hash}`);
    console.log(`ADMIN2_USERNAME=${admin2Username}`);
    console.log(`ADMIN2_PASSWORD_HASH=${admin2Hash}`);
    console.log(`RATE_LIMIT_ATTEMPTS=5`);
    console.log(`RATE_LIMIT_WINDOW_MINUTES=15`);
    console.log(`ACCOUNT_LOCKOUT_ATTEMPTS=3`);
    console.log(`ACCOUNT_LOCKOUT_MINUTES=30`);
    console.log(`JWT_EXPIRY_HOURS=2`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Copy each variable above to your Vercel dashboard');
    console.log('2. Go to Settings → Environment Variables in your Vercel project');
    console.log('3. Add each variable for Production, Preview, and Development');
    console.log('4. Deploy your project with: npx vercel --prod');
    console.log('\n🔒 Your admin credentials:');
    console.log(`Admin 1: ${admin1Username} / ${admin1Password}`);
    console.log(`Admin 2: ${admin2Username} / ${admin2Password}`);
    console.log('\n⚠️  Save these credentials securely!');
    
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

// Validate password strength
function validatePassword(password) {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);
  
  if (password.length < minLength) {
    throw new Error(`Password must be at least ${minLength} characters long`);
  }
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasNonalphas) {
    throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
  }
  
  return true;
}

setup();