# GitHub Agent Dashboard

A sophisticated AI-powered dashboard for managing and understanding your GitHub repositories using LangGraph multi-agent workflows and GPT-4o.

![GitHub Agent Dashboard](https://img.shields.io/badge/AI%20Powered-LangGraph-blue)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20TypeScript%20%7C%20Supabase-green)
![UI Theme](https://img.shields.io/badge/UI-Glassmorphic%20Dark-purple)

## ✨ Features

### 🤖 Multi-Agent AI System
- **Repository Analyzer**: Deep analysis of codebase structure, tech stack, and code quality
- **Todo Creator**: Generates actionable task lists based on repository analysis
- **Recap Generator**: Creates meeting-ready project summaries and status reports
- **Chat Assistant**: Intelligent conversations about your repositories
- **Tech Stack Analyzer**: Comprehensive technology assessment and recommendations
- **Meeting Prep**: Executive-ready summaries for stakeholder meetings

### 📊 Core Capabilities
- **Repository Import**: Seamlessly import repositories from GitHub
- **AI-Powered Analysis**: Understand architecture, dependencies, and code quality
- **Intelligent Chat**: Ask questions about your codebase and get AI-powered answers
- **Smart Todo Lists**: Generate prioritized tasks based on code analysis
- **Automated Recaps**: Perfect for meetings and project updates
- **Real-time Insights**: Track project health and development metrics

### 🎨 Modern UI/UX
- **Glassmorphic Design**: macOS Tahoe-inspired dark theme
- **Framer Motion Animations**: Smooth, physics-based interactions
- **Responsive Layout**: Works perfectly on desktop and mobile
- **Interactive Components**: Hover effects and micro-interactions
- **Dark Theme**: Easy on the eyes for long coding sessions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- GitHub Personal Access Token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/github-agent-dashboard.git
   cd github-agent-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   
   # GitHub API
   GITHUB_TOKEN=your_github_token_here
   
   # App Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   ```bash
   # Run the database schema
   # Copy the contents of /database/schema.sql and run in your Supabase SQL editor
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **AI/ML**: LangGraph, OpenAI GPT-4o, LangChain
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles (glassmorphic theme)
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Landing page
├── lib/
│   ├── agents/            # LangGraph agents
│   │   ├── config.ts      # Agent configurations
│   │   ├── tools.ts       # AI tools and functions
│   │   └── graphs/        # Agent graph definitions
│   ├── github.ts          # GitHub API integration
│   └── supabase.ts        # Database client
├── types/
│   └── database.ts        # TypeScript type definitions
└── components/            # React components (to be added)
```

### Database Schema

The system uses a comprehensive PostgreSQL schema with:
- **users**: User profiles and GitHub integration
- **repositories**: GitHub repository data and analysis
- **conversations**: Chat history with AI agents
- **messages**: Individual chat messages
- **todo_lists** & **todo_items**: Task management
- **recaps**: Project summaries and meeting reports
- **agent_executions**: LangGraph workflow tracking

## 🔧 Configuration

### OpenAI Setup
1. Get an API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env.local`: `OPENAI_API_KEY=your_key_here`

### Supabase Setup
1. Create a new project at [Supabase](https://supabase.com/)
2. Run the schema from `database/schema.sql`
3. Add credentials to `.env.local`

### GitHub Integration
1. Create a Personal Access Token at [GitHub Settings](https://github.com/settings/tokens)
2. Grant permissions: `repo`, `read:user`, `read:org`
3. Add to `.env.local`: `GITHUB_TOKEN=your_token_here`

## 🎯 Usage

### Importing Repositories
1. Click "Connect GitHub" on the dashboard
2. Authenticate with your GitHub account
3. Select repositories to import and analyze

### Repository Analysis
1. Select a repository from your dashboard
2. Click "Analyze" to start AI-powered analysis
3. Review tech stack, code quality, and recommendations

### Chat Interface
1. Navigate to any repository
2. Use the chat interface to ask questions:
   - "What's the architecture of this project?"
   - "Show me the main dependencies"
   - "What needs to be improved?"

### Todo Lists
1. Generate todo lists from repository analysis
2. Prioritize tasks automatically
3. Export to GitHub Issues (optional)

### Project Recaps
1. Select date range for analysis
2. Generate automated summaries
3. Export meeting-ready reports

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Environment Variables for Production
```env
NODE_ENV=production
OPENAI_API_KEY=your_production_key
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
GITHUB_TOKEN=your_production_github_token
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

## 🔮 Roadmap

### Phase 1: Core Features (Current)
- [x] Project setup with Next.js + TypeScript
- [x] Supabase database schema
- [x] LangGraph agent system
- [x] GitHub API integration
- [x] Glassmorphic UI foundation
- [ ] Chat interface implementation
- [ ] Todo system completion
- [ ] Recap generation system

### Phase 2: Enhanced Features
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Integration with more Git providers
- [ ] Mobile app (React Native)
- [ ] Advanced AI models fine-tuning

### Phase 3: Enterprise Features
- [ ] Team management
- [ ] Advanced security features
- [ ] Custom AI agent creation
- [ ] Enterprise SSO
- [ ] Advanced reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LangGraph](https://github.com/langchain-ai/langgraph) for multi-agent workflows
- [OpenAI](https://openai.com/) for GPT-4o
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Vercel](https://vercel.com/) for deployment platform
- [Framer Motion](https://www.framer.com/motion/) for animations

## 📞 Support

Need help? Have questions?
- 📧 Email: support@github-agent-dashboard.com
- 💬 Discord: [Join our community](https://discord.gg/your-invite)
- 📖 Docs: [Documentation](https://docs.github-agent-dashboard.com)

---

<div align="center">
  <strong>Built with ❤️ for developers who want to stay on top of their projects</strong>
</div># BishopTech GitHub Helper - AI Project Management API Hub

## 🚀 AI-Powered Project Management & GitHub Agent Dashboard

A comprehensive Next.js application that transforms into a centralized API hub for AI-powered project management, automated task generation, and intelligent code assistance.

### ✨ Key Features

- **🤖 AI Assistant**: Chat with your repositories using GPT-4o with real GitHub data access
- **📝 Smart Todo Generation**: AI-generated task lists based on repository analysis  
- **📊 Automated Recaps**: Weekly/monthly project summaries with GitHub metrics
- **🔗 RESTful API**: Complete API server for integration with other projects
- **📚 Interactive Documentation**: Beautiful API docs with live examples
- **🔐 API Key Management**: Secure authentication with usage tracking
- **🎨 Glassmorphic UI**: Modern dark theme with Framer Motion animations
- **📡 Real-time Streaming**: Streaming AI responses with markdown rendering

### 🛠 Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **AI/ML**: OpenAI GPT-4o, LangChain, LangGraph
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, Framer Motion
- **APIs**: GitHub API (Octokit), RESTful endpoints
- **Authentication**: API key-based with rate limiting

### 🎯 Use Cases

- **Cursor IDE Integration**: Add AI project management to any Cursor workspace
- **Automated Standup Reports**: Generate daily/weekly project summaries
- **Smart Task Planning**: AI-generated todos based on codebase analysis
- **Code Assistance**: Repository-aware AI chat for development help
- **Project Monitoring**: Real-time insights and progress tracking

### 🚀 Getting Started

1. **Clone and Install**
   \`\`\`bash
   git clone https://github.com/mbishopfx/bishoptech-githubhelper.git
   cd bishoptech-githubhelper
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.example .env.local
   # Add your API keys (OpenAI, Supabase, GitHub)
   \`\`\`

3. **Database Setup**
   \`\`\`bash
   # Run the database setup script in Supabase SQL Editor
   # Use database/quick-setup.sql for quick start
   \`\`\`

4. **Run Development Server**
   \`\`\`bash
   npm run dev
   # Open http://localhost:3000
   \`\`\`

### 📡 API Integration

Add to your Cursor rules for LLM integration:
\`\`\`
https://your-domain.com/llm.txt
\`\`\`

**Example API Usage:**
\`\`\`javascript
// Generate AI todos for any project
const todos = await fetch('/api/v1/todos', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer gha_your_key' },
  body: JSON.stringify({
    title: 'Sprint Tasks',
    project_id: 'proj_123',
    ai_generate: true,
    context_prompt: 'Focus on testing and performance'
  })
});
\`\`\`

### 🎨 Screenshots

- 🏠 **Dashboard**: Glassmorphic overview with real-time stats
- 💬 **AI Chat**: Streaming conversations with repository context  
- 📝 **Todo Management**: AI-generated and manual task lists
- 📊 **Recaps**: Automated project summaries and metrics
- 📚 **API Docs**: Interactive documentation with examples

### 🔗 API Endpoints

- \`GET /api/v1/status\` - System health check
- \`GET /api/v1/projects\` - List repositories  
- \`POST /api/v1/todos\` - Create AI-generated todo lists
- \`POST /api/v1/recaps\` - Generate project recaps
- \`POST /api/v1/ai/chat\` - Chat with AI assistant
- \`POST /api/v1/webhooks\` - Register notification webhooks

### 💡 Cursor Integration Examples

**Auto-generate todos when opening a project:**
\`\`\`typescript
export async function onProjectOpen(projectPath: string) {
  const project = await importProject(projectPath);
  await generateProjectTodos(project.id, 'Focus on development priorities');
  showTodosPanel();
}
\`\`\`

**Daily standup recap generation:**
\`\`\`typescript
export async function generateDailyStandup(projectId: string) {
  const recap = await fetch('/api/v1/recaps', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      period: 'daily'
    })
  });
  return recap.data.recap.summary;
}
\`\`\`

### 🚀 Deployment

Deploy to Vercel with one click:
\`\`\`bash
vercel --prod
\`\`\`

### 📄 License

MIT License - feel free to use in your projects!

---

**Built with ❤️ by BishopTech**
