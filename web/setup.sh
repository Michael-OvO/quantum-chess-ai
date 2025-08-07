#!/bin/bash

echo "🚀 Setting up Quantum Chess Battleground..."

# Fix npm permissions if needed
echo "📦 Fixing npm permissions (may require password)..."
sudo chown -R $(whoami) ~/.npm

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local from template
echo "🔐 Creating .env.local file..."
cp .env.local.example .env.local

echo "✅ Setup complete! Run 'npm run dev' to start the development server."