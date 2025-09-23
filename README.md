# GitHub Helper - AI Project Management System 🤖

> Transform your GitHub repositories into an AI-powered project management hub. Solo-dev organization, finally figured out.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript)
![OpenAI](https://img.shields.io/badge/AI-GPT--4o-green?logo=openai)
![Supabase](https://img.shields.io/badge/Database-Supabase-green?logo=supabase)

## ✨ What This Actually Does

Stop hunting down project timelines. Stop scrambling for client meeting summaries. This system reads your actual repositories and gives you:

- **🧠 AI Repository Analysis**: Deep understanding of your codebase structure, tech stack, and code quality
- **📝 Smart Todo Generation**: AI creates actionable task lists based on your actual code, not generic templates  
- **📊 Automated Project Recaps**: Perfect meeting summaries with real GitHub metrics
- **💬 Repository Chat**: Ask your codebase questions and get intelligent answers
- **🔗 Full REST API**: Integrate with Cursor IDE, Slack, or anywhere else you need project data
- **🎨 Beautiful UI**: Glassmorphic dark theme that doesn't hurt your eyes during late-night coding

## 🚀 Quick Start (5 Minutes to Running)

### 1. Clone & Install
```bash
git clone https://github.com/mbishopfx/bishoptech-githubhelper.git
cd bishoptech-githubhelper
npm install
```

### 2. Get Your API Keys

You'll need these services (all have free tiers):

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy it (starts with `sk-`)

#### Supabase Setup
1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy your **Project URL** and **anon public** key
5. Go to Settings → API → Service Role keys
6. Copy your **service_role** key (keep this secret!)

#### GitHub Token
1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Create new token (classic)
3. Select scopes: `repo`, `read:user`, `read:org`
4. Copy your token (starts with `ghp_` or `github_pat_`)

### 3. Environment Setup
```bash
# Copy the environment template
cp .env.local.example .env.local
```

Edit `.env.local` with your keys:
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# GitHub Integration
GITHUB_TOKEN=your-github-token-here

# App Security (generate a random 32+ character string)
NEXTAUTH_SECRET=your-random-secret-string-here

# Single User Configuration (personalize it!)
SINGLE_USER_EMAIL=your-email@example.com
SINGLE_USER_GITHUB_USERNAME=your-github-username
SINGLE_USER_NAME=Your Display Name

# API Security (for integrations)
MASTER_API_KEY=gha_your-generated-api-key
```

### 4. Database Setup
```bash
# Copy the database setup script
# Go to your Supabase project → SQL Editor
# Paste and run the contents of: database/quick-setup.sql
```

Or run it manually:
1. Open Supabase SQL Editor
2. Copy contents from `database/quick-setup.sql`
3. Run the script
4. Verify tables were created in Table Editor

### 5. Run It!
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the GitHub Helper dashboard!

## 🏗️ Architecture Overview

### Backend Power (API Layer)
- **Next.js 15 API Routes**: Rock-solid `/api/v1/` endpoints
- **LangGraph Multi-Agent System**: AI agents that specialize in different tasks
- **GPT-4o Integration**: Context-aware AI that actually understands your code
- **Supabase PostgreSQL**: Scalable database with Row Level Security
- **GitHub API via Octokit**: Real-time repository data and analysis
- **Single-User Auth**: Simplified security model for personal/small team use

### Frontend Experience
- **Glassmorphic UI**: macOS-inspired dark theme that looks professional
- **Framer Motion**: Smooth animations and micro-interactions
- **TypeScript**: Full type safety across the entire application  
- **Tailwind CSS**: Utility-first styling with custom glassmorphic components
- **Real-time Streaming**: AI responses stream in real-time, no loading screens
- **Mobile Responsive**: Works great on phones and tablets

### Project Structure
```
src/
├── app/
│   ├── api/v1/              # Versioned API endpoints
│   │   ├── ai/chat/         # AI chat functionality
│   │   ├── projects/        # Repository management
│   │   ├── todos/           # Task management
│   │   └── recaps/          # Project summaries
│   └── dashboard/           # UI pages
│       ├── chat/            # Chat interface
│       ├── todos/           # Task management
│       └── repositories/    # Repository browser
├── lib/
│   ├── agents/              # AI agent implementations
│   │   ├── graphs/          # LangGraph workflow definitions
│   │   └── tools.ts         # AI tools and functions
│   ├── github.ts            # GitHub API integration
│   └── supabase.ts          # Database client
└── components/ui/           # Reusable UI components
```

## 🎯 How to Use It

### Import Your Repositories
1. Navigate to **Repositories** in the dashboard
2. Click **Import from GitHub**
3. Your repositories will be analyzed automatically
4. Review the AI-generated insights

### Generate Smart Todos
1. Select any repository
2. Click **Generate Todo List**
3. AI analyzes your code and creates actionable tasks
4. Tasks are prioritized based on code complexity and dependencies

### Create Project Recaps
1. Go to **Recaps** section
2. Select date range and repositories
3. AI generates meeting-ready summaries with:
   - Progress metrics from GitHub
   - Recent commits and changes
   - Identified issues and recommendations
   - Next steps and priorities

### Chat With Your Repositories
1. Open any repository in the **Chat** interface
2. Ask questions like:
   - "What's the main architecture of this project?"
   - "What dependencies need updating?"
   - "What would be the best way to add user authentication?"
3. AI provides context-aware answers based on your actual code

## 🔗 API Integration

### Cursor IDE Integration
Add this to your Cursor rules:
```
# GitHub Helper API
LLM Integration: https://your-deployment.vercel.app/llm.txt
```

### Example API Calls
```javascript
// Generate AI todos for any project
const response = await fetch('/api/v1/todos', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer gha_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Sprint Planning Tasks',
    ai_generate: true,
    context_prompt: 'Focus on testing and performance improvements'
  })
});

// Get project recap
const recap = await fetch('/api/v1/recaps', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer gha_your_api_key' },
  body: JSON.stringify({
    period: 'weekly',
    include_metrics: true
  })
});
```

## 🚀 Deployment (Production Ready)

### Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables for Production
Add these in your Vercel dashboard:
```
NODE_ENV=production
OPENAI_API_KEY=your_production_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
GITHUB_TOKEN=your_production_github_token
NEXTAUTH_SECRET=your_production_secret_minimum_32_chars
SINGLE_USER_EMAIL=your-email@domain.com
SINGLE_USER_GITHUB_USERNAME=your-github-username
SINGLE_USER_NAME=Your Display Name
MASTER_API_KEY=gha_your_production_api_key
```

## 🔧 Customization

### Modify AI Behavior
Edit `src/lib/agents/config.ts`:
```typescript
export const AI_CONFIG = {
  model: 'gpt-4o',  // Change AI model
  temperature: 0.7,  // Adjust creativity (0.0-1.0)
  maxTokens: 2000,   // Response length limit
};
```

### Custom UI Theme
Modify `tailwind.config.ts` and `src/app/globals.css` for your branding.

### Add New AI Agents
Create new graphs in `src/lib/agents/graphs/` using the LangGraph framework.

## 🐛 Troubleshooting

### Common Issues

**"Can't connect to Supabase"**
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure you ran the database setup script
- Check that your Supabase project is active (not paused)

**"GitHub API rate limit exceeded"**
- Your `GITHUB_TOKEN` might be invalid or expired
- Create a new token with proper scopes: `repo`, `read:user`, `read:org`
- GitHub has rate limits - wait an hour or upgrade to GitHub Pro

**"OpenAI API errors"**
- Check your `OPENAI_API_KEY` is correct (starts with `sk-`)
- Verify you have credits in your OpenAI account
- Some features require GPT-4 access

**"Database errors"**
- Run `database/quick-setup.sql` again in Supabase SQL Editor
- Check that all tables were created in your Supabase Table Editor
- Verify your `SUPABASE_SERVICE_ROLE_KEY` has full database access

### Getting Help

If you're stuck:
1. Check the [Issues tab](https://github.com/mbishopfx/bishoptech-githubhelper/issues) for similar problems
2. Create a new issue with:
   - Your operating system
   - Node.js version (`node --version`)
   - Error message (remove any API keys!)
   - Steps you've tried

## 📄 License

MIT License - feel free to fork, modify, and use in your own projects!

## 🙏 Built With

- [Next.js 15](https://nextjs.org/) - React framework
- [OpenAI GPT-4o](https://openai.com/) - AI language model  
- [LangGraph](https://github.com/langchain-ai/langgraph) - Multi-agent AI workflows
- [Supabase](https://supabase.com/) - PostgreSQL database and auth
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [GitHub API](https://docs.github.com/en/rest) - Repository data access

---

<div align="center">
<strong>Built with ❤️ for developers who want to stay organized without the overhead</strong>

<p>⭐ Star this repo if it helps you get organized!</p>

<p>🐛 Found a bug? <a href="https://github.com/mbishopfx/bishoptech-githubhelper/issues">Report it here</a></p>
</div>