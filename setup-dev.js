#!/usr/bin/env node

/**
 * Quick setup script for Komplexáci development environment
 * Run: node setup-dev.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Komplexáci development environment...');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local from template...');
  
  const envExample = fs.readFileSync('.env.example', 'utf8');
  fs.writeFileSync('.env.local', envExample);
  
  console.log('✅ .env.local created!');
  console.log('⚠️  Please update .env.local with your actual API keys');
} else {
  console.log('✅ .env.local already exists');
}

// Install dependencies if needed
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  require('child_process').execSync('npm install', { stdio: 'inherit' });
}

console.log('🎮 Ready to start development!');
console.log('Run: npm run dev');
