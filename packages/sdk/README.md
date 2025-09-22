# GitHub Agent Dashboard SDK

[![npm version](https://badge.fury.io/js/@github-agent%2Fsdk.svg)](https://badge.fury.io/js/@github-agent%2Fsdk)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

A comprehensive TypeScript SDK for interacting with the **GitHub Agent Dashboard** - an AI-powered repository management system with advanced LangGraph agents, Slack integration, and intelligent automation.

## Features

- 🤖 **AI Repository Analysis** - Deep codebase analysis with GPT-4o
- 💬 **Intelligent Chat** - Chat with your repositories using AI agents
- 📝 **Smart Todo Generation** - Automated task creation from code analysis
- 📊 **Meeting Recaps** - AI-generated project summaries
- 🔗 **Slack Integration** - Bot commands and notifications
- 🏗️ **Tech Stack Detection** - Automatic technology identification
- ⚡ **Real-time Updates** - Live repository synchronization
- 🔒 **Type-Safe** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install @github-agent/sdk
```

```bash
yarn add @github-agent/sdk
```

```bash
pnpm add @github-agent/sdk
```

## Quick Start

```typescript
import { GitHubAgentSDK } from '@github-agent/sdk';

// For local development
const client = GitHubAgentSDK.development();

// For production
const client = GitHubAgentSDK.production('your-app.vercel.app', 'your-api-key');

// From environment variables
const client = GitHubAgentSDK.fromEnvironment();

// Basic usage
const repositories = await client.getRepositories('user-id');
const analysis = await client.analyzeRepository({ repositoryId: 'repo-id' });
const response = await client.chat({
  message: 'What is the main technology stack?',
  userId: 'user-id',
  repositoryId: 'repo-id'
});
```

## API Reference

### Repository Management

#### Import Repositories

```typescript
const result = await client.importRepositories(
  'user-id',
  'github-token', // optional
  'github-username' // optional
);

console.log(`Imported ${result.imported_count} repositories`);
```

#### Get Repositories

```typescript
// Get all active repositories
const repos = await client.getRepositories('user-id');

// Get all repositories (including inactive)
const allRepos = await client.getRepositories('user-id', false);

// Get specific repository
const repo = await client.getRepository('repository-id');
```

#### Update Repository

```typescript
const updated = await client.updateRepository('repository-id', {
  is_active: true,
  description: 'Updated description'
});
```

### AI-Powered Analysis

#### Analyze Repository

```typescript
// Analyze by repository ID
const analysis = await client.analyzeRepository({
  repositoryId: 'repo-id'
});

// Analyze by GitHub URL
const analysis = await client.analyzeRepository({
  githubUrl: 'https://github.com/owner/repository'
});

// Force fresh analysis (bypass cache)
const analysis = await client.analyzeRepository({
  repositoryId: 'repo-id',
  forceRefresh: true
});

console.log('Analysis Results:', analysis.data);
```

#### Get Cached Analysis

```typescript
const cached = await client.getRepositoryAnalysis('repository-id');
if (cached.from_cache) {
  console.log('Retrieved from cache');
}
```

### Chat Interface

#### Send Chat Message

```typescript
const response = await client.chat({
  message: 'How can I improve the code quality?',
  userId: 'user-id',
  repositoryId: 'repo-id'
});

console.log('AI Response:', response.response);
```

#### Continue Conversation

```typescript
const response = await client.chat({
  message: 'Tell me more about that',
  userId: 'user-id',
  repositoryId: 'repo-id',
  conversationId: 'existing-conversation-id'
});
```

#### Get Conversations

```typescript
// All conversations for a user
const conversations = await client.getConversations('user-id');

// Repository-specific conversations
const repoConversations = await client.getConversations('user-id', 'repo-id');

// Get messages from a conversation
const messages = await client.getMessages('conversation-id');
```

### Todo Management

#### Get Todo Lists

```typescript
// All todo lists for a user
const todoLists = await client.getTodoLists('user-id');

// Repository-specific todos
const repoTodos = await client.getTodoLists('user-id', 'repository-id');
```

#### Create Todo List

```typescript
const todoList = await client.createTodoList({
  userId: 'user-id',
  repositoryId: 'repository-id',
  title: 'Security Improvements',
  description: 'Address security vulnerabilities',
  category: 'security',
  priority: 'high'
});
```

#### Generate Todos from Analysis

```typescript
const autoTodos = await client.generateTodos({
  userId: 'user-id',
  repositoryId: 'repository-id',
  categories: ['bug', 'feature', 'maintenance']
});

console.log(`Generated ${autoTodos.items?.length} todo items`);
```

#### Update Todo Item

```typescript
const updated = await client.updateTodoItem('item-id', {
  completed: true,
  actual_hours: 3
});
```

### Meeting Recaps

#### Get Recaps

```typescript
// All recaps for a user
const recaps = await client.getRecaps('user-id');

// Repository-specific recaps
const repoRecaps = await client.getRecaps('user-id', 'repository-id');
```

#### Generate Recap

```typescript
const recap = await client.generateRecap({
  userId: 'user-id',
  repositoryId: 'repository-id',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z',
  meetingReady: true
});

console.log('Meeting Recap:', recap.summary);
```

### Slack Integration

#### Get Slack Settings

```typescript
const settings = await client.getSlackSettings('user-id');
if (settings?.is_active) {
  console.log('Slack integration is active');
}
```

#### Configure Slack Integration

```typescript
await client.updateSlackSettings('user-id', {
  bot_name: 'My GitHub Bot',
  app_name: 'My GitHub Assistant',
  description: 'AI-powered repository assistant',
  features: {
    chat_commands: true,
    repo_updates: true,
    todo_notifications: true,
    meeting_recaps: true,
    direct_messages: true
  },
  scopes: [
    'channels:read',
    'chat:write',
    'commands',
    'im:write',
    'users:read',
    'app_mentions:read'
  ],
  botToken: 'xoxb-your-bot-token',
  signingSecret: 'your-signing-secret',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});
```

#### Remove Slack Integration

```typescript
await client.deleteSlackSettings('user-id');
```

## Configuration

### Environment Variables

```bash
# Required for GitHubAgentSDK.fromEnvironment()
GITHUB_AGENT_API_URL=https://your-app.vercel.app
GITHUB_AGENT_API_KEY=your-api-key
GITHUB_AGENT_TIMEOUT=30000
```

### Custom Configuration

```typescript
const client = new GitHubAgentSDK({
  baseUrl: 'https://your-custom-domain.com',
  apiKey: 'your-api-key',
  timeout: 60000, // 60 seconds
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## Error Handling

The SDK provides specific error types for better error handling:

```typescript
import { 
  GitHubAgentSDKError, 
  GitHubAgentAuthError, 
  GitHubAgentTimeoutError 
} from '@github-agent/sdk';

try {
  const repos = await client.getRepositories('user-id');
} catch (error) {
  if (error instanceof GitHubAgentAuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof GitHubAgentTimeoutError) {
    console.error('Request timed out:', error.message);
  } else if (error instanceof GitHubAgentSDKError) {
    console.error('SDK Error:', error.message, error.statusCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Advanced Usage

### Batch Operations

```typescript
// Analyze multiple repositories
const analyses = await Promise.all(
  repositories.map(repo => 
    client.analyzeRepository({ repositoryId: repo.id })
  )
);

// Generate todos for all repositories
const todoLists = await Promise.all(
  repositories.map(repo =>
    client.generateTodos({
      userId: 'user-id',
      repositoryId: repo.id
    })
  )
);
```

### Streaming Responses (Future)

```typescript
// Coming soon: Streaming chat responses
const stream = await client.chatStream({
  message: 'Explain the architecture',
  userId: 'user-id',
  repositoryId: 'repo-id'
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### Webhook Integration

```typescript
// Test webhook connectivity
const health = await client.health();
console.log('API Status:', health.status);
```

## Examples

### Complete Repository Analysis Workflow

```typescript
import { GitHubAgentSDK } from '@github-agent/sdk';

async function analyzeRepository(repoUrl: string, userId: string) {
  const client = GitHubAgentSDK.production('your-app.vercel.app');
  
  // Import repository
  const imported = await client.importRepositories(userId, undefined, 'username');
  const repo = imported.repositories[0];
  
  // Analyze repository
  const analysis = await client.analyzeRepository({ 
    repositoryId: repo.id 
  });
  
  // Generate todos based on analysis
  const todos = await client.generateTodos({
    userId,
    repositoryId: repo.id,
    analysisData: analysis.data
  });
  
  // Create meeting recap
  const recap = await client.generateRecap({
    userId,
    repositoryId: repo.id,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  });
  
  return { analysis, todos, recap };
}
```

### Slack Bot Integration

```typescript
import { GitHubAgentSDK } from '@github-agent/sdk';

const client = GitHubAgentSDK.fromEnvironment();

// Configure Slack bot
await client.updateSlackSettings('user-id', {
  bot_name: 'Repo Assistant',
  features: {
    chat_commands: true,
    repo_updates: true,
    todo_notifications: true,
    meeting_recaps: false,
    direct_messages: true
  },
  botToken: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// The bot will now respond to:
// /repo-analyze owner/repository
// /repo-chat owner/repository What's the tech stack?
// @bot_name analyze repo:owner/repository
```

## TypeScript Support

The SDK is built with TypeScript and provides comprehensive type definitions:

```typescript
import type { 
  Repository, 
  TodoList, 
  ChatResponse, 
  AnalysisResponse 
} from '@github-agent/sdk';

function processRepository(repo: Repository): void {
  console.log(`Repository: ${repo.full_name}`);
  console.log(`Language: ${repo.language}`);
  console.log(`Tech Stack:`, repo.tech_stack);
}
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Support

- 📧 Email: support@github-agent-dashboard.com
- 💬 Discord: [Join our community](https://discord.gg/github-agent)
- 📖 Documentation: [Full Documentation](https://docs.github-agent-dashboard.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/github-agent-dashboard/issues)

## Related Projects

- [GitHub Agent Dashboard](https://github.com/yourusername/github-agent-dashboard) - The main application
- [LangGraph](https://github.com/langchain-ai/langgraph) - Multi-agent workflow framework
- [OpenAI GPT-4o](https://openai.com/gpt-4) - AI model powering the analysis

---

Built with ❤️ by the GitHub Agent Dashboard team
