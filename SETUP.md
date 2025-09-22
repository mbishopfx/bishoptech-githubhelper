# 🚀 GitHub Agent Dashboard - Quick Setup

Your credentials have been configured! Follow these steps to get your AI-powered GitHub repository management system running.

## ✅ Credentials Configured

- **Supabase URL**: `https://qkskwkfjtfksihxrljgg.supabase.co`
- **OpenAI API Key**: ✓ Configured
- **JWT Secret**: ✓ Configured

## 📋 Setup Steps

### 1. Setup Database Schema

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your [Supabase Dashboard](https://supabase.com/project/qkskwkfjtfksihxrljgg)
2. Navigate to **SQL Editor**
3. Copy the entire contents of `/database/schema.sql`
4. Paste into the SQL Editor and click **Run**
5. ✅ Database tables will be created

**Option B: Using Setup Script** (if you prefer automation)

```bash
cd github-agent-dashboard
node setup/init-database.js
```

### 2. Get GitHub Token (Optional but Recommended)

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Create a **Classic Token** with these scopes:
   - `repo` (Full repository access)
   - `read:user` (Read user profile)
   - `read:org` (Read organization data)
3. Copy the token and add to `.env.local`:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here
   ```

### 3. Start the Application

The dev server is already running at **http://localhost:3002**!

If you need to restart:
```bash
npm run dev
```

## 🎯 What You Can Do Now

### ✨ **Immediate Features**
- **Beautiful Landing Page** - Visit http://localhost:3002
- **Dashboard Overview** - Navigate to dashboard
- **Chat Interface** - Start conversations with repositories
- **Settings Configuration** - Set up Slack integration

### 🤖 **AI Features Available**
- **Repository Analysis** - Deep codebase insights
- **Intelligent Chat** - Ask questions about your code
- **Tech Stack Detection** - Automatic technology identification
- **Code Quality Assessment** - Health metrics and recommendations

### 🔗 **Slack Integration Setup**
1. Go to **Dashboard → Settings** 
2. Configure your Slack bot settings
3. Generate app manifest
4. Create Slack app at [api.slack.com](https://api.slack.com/apps)
5. Add webhook URL: `http://localhost:3002/api/slack/events`

## 🧪 Testing the System

### Test Repository Analysis
```bash
curl -X POST http://localhost:3002/api/repositories/analyze \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/facebook/react"}'
```

### Test Chat System
```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this repository about?",
    "userId": "test-user"
  }'
```

### Test Health Endpoint
```bash
curl http://localhost:3002/api/health
```

## 🔧 Configuration Options

### Environment Variables
Your `.env.local` is configured with:
- ✅ OpenAI GPT-4o integration
- ✅ Supabase database connection
- ✅ Authentication secrets
- ⚙️ GitHub token (add when ready)
- ⚙️ Slack credentials (add when ready)

### Database Tables Created
- `users` - User profiles and GitHub integration
- `repositories` - GitHub repository data
- `conversations` - Chat history with AI
- `messages` - Individual chat messages  
- `todo_lists` & `todo_items` - Task management
- `recaps` - Meeting summaries
- `agent_executions` - AI workflow tracking
- `slack_settings` - Slack bot configuration

## 🎨 UI Features

### Glassmorphic Design
- **macOS Tahoe inspired** dark theme
- **Backdrop blur effects** and elegant animations
- **Framer Motion** physics-based interactions
- **Responsive design** for all devices

### Navigation
- **Collapsible sidebar** with smooth animations
- **Quick actions** and shortcuts
- **Search functionality** across repositories
- **Real-time updates** and notifications

## 🚀 Next Steps

### For Development
1. **Add GitHub repositories** to start analysis
2. **Test AI chat** with your codebase
3. **Generate todo lists** from code analysis
4. **Create meeting recaps** for project updates

### For Production
1. **Deploy to Vercel** using the deployment guide
2. **Configure custom domain**
3. **Set up monitoring** and analytics
4. **Scale with team members**

## 📚 Documentation

- **Full API Reference**: Check `/src/lib/sdk/` for complete TypeScript SDK
- **Database Schema**: See `/database/schema.sql` for full structure
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md` for production setup
- **Architecture**: LangGraph multi-agent system with GPT-4o

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Test Supabase connection
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     https://qkskwkfjtfksihxrljgg.supabase.co/rest/v1/users
```

**Environment Variable Issues**
```bash
# Check if variables are loaded
node -e "require('dotenv').config({ path: '.env.local' }); console.log('OpenAI Key:', !!process.env.OPENAI_API_KEY)"
```

**Build Issues**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 🎉 You're Ready!

Your GitHub Agent Dashboard is now configured and ready to revolutionize how you manage your repositories with AI-powered insights!

Visit **http://localhost:3002** to start exploring your new AI-powered repository management system.

---

**Need help?** The system includes comprehensive error handling, detailed logging, and helpful error messages to guide you through any issues.
