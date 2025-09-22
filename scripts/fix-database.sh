#!/bin/bash

# GitHub Agent Dashboard - Database Fix Script (Shell version)
# This script fixes the Supabase database schema automatically

echo "🔧 GitHub Agent Dashboard - Database Fix Script"
echo "==============================================="
echo

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please make sure you have configured your environment variables"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo
fi

echo "🔗 Running database fix script..."
echo

# Run the Node.js script
node scripts/fix-database-simple.js

# Check exit code
if [ $? -eq 0 ]; then
    echo
    echo "🎉 Database fix completed successfully!"
    echo
    echo "You can now test your APIs:"
    echo "  - Todo generation: should work"
    echo "  - Recap generation: should work" 
    echo "  - Chat functionality: should work"
    echo
else
    echo
    echo "❌ Database fix failed!"
    echo "Please check the error messages above"
    echo
    exit 1
fi
