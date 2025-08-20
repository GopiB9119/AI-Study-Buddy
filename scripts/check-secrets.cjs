const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

console.log('🔍 Checking environment setup...');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `# Gemini API Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Custom API URL (defaults to Google's Gemini API)
# GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# Server Configuration
PORT=4000
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with template');
  console.log('🚨 IMPORTANT: Please add your actual GEMINI_API_KEY to .env file');
} else {
  console.log('✅ .env file already exists');
}

// Check if API key is set
require('dotenv').config();
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
  console.log('🚨 WARNING: GEMINI_API_KEY is not set properly in .env file');
  console.log('Please get your API key from: https://aistudio.google.com/app/apikey');
} else {
  console.log('✅ GEMINI_API_KEY is configured');
}

console.log('\n🚀 Setup complete! Run the following commands:');
console.log('   npm install          # Install dependencies');
console.log('   npm run dev:all      # Start both server and client');
console.log('   npm run server       # Start only the server');
console.log('   npm run dev          # Start only the client');
