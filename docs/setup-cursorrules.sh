#!/bin/bash

# GitHub Helper - Cursor AI Setup Script
# This script sets up .cursorrules file for optimal AI assistance

echo "🚀 GitHub Helper - Cursor AI Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected: github-agent-dashboard/"
    exit 1
fi

# Check if .cursorrules already exists
if [ -f ".cursorrules" ]; then
    echo "⚠️  .cursorrules file already exists"
    echo ""
    read -p "Do you want to backup and replace it? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Create backup
        BACKUP_NAME=".cursorrules.backup.$(date +%Y%m%d_%H%M%S)"
        mv .cursorrules "$BACKUP_NAME"
        echo "✅ Backed up existing file to: $BACKUP_NAME"
    else
        echo "❌ Setup cancelled. Existing .cursorrules file preserved."
        exit 0
    fi
fi

# Copy the template
if [ -f "docs/example.cursorrules" ]; then
    cp docs/example.cursorrules .cursorrules
    echo "✅ Created .cursorrules from template"
else
    echo "❌ Error: docs/example.cursorrules not found"
    exit 1
fi

# Verify the file was created
if [ -f ".cursorrules" ]; then
    FILESIZE=$(wc -c < .cursorrules)
    echo "📊 File size: ${FILESIZE} bytes"
    echo ""
    echo "🎉 Setup Complete!"
    echo ""
    echo "📚 Available Documentation:"
    echo "   • docs/cursor-commit-guidelines.md - Commit message standards"
    echo "   • docs/cursor-commit-templates.md - Ready-to-use templates"
    echo "   • docs/cursor-ai-context-rules.md - AI context configuration"
    echo "   • docs/README-cursor-docs.md - Complete usage guide"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Restart Cursor IDE to load the new rules"
    echo "   2. Test AI assistance with project-specific questions"
    echo "   3. Use commit templates from docs/cursor-commit-templates.md"
    echo "   4. Customize .cursorrules for your specific needs"
    echo ""
    echo "✨ Your AI assistant now has complete project context!"
else
    echo "❌ Error: Failed to create .cursorrules file"
    exit 1
fi
