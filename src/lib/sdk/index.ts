// GitHub Agent Dashboard SDK
// For interacting with the hosted API on Vercel

export interface SDKConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  open_issues: number;
  updated_at: string;
  tech_stack?: any;
  analysis_summary?: string;
  last_analyzed?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  conversation_id?: string;
  execution_time?: number;
  steps?: number;
  error?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: any;
  execution_time?: number;
  steps?: number;
  from_cache?: boolean;
  error?: string;
}

export interface TodoList {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  items?: TodoItem[];
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
  labels: string[];
}

export interface Recap {
  id: string;
  title: string;
  summary: string;
  key_updates: any[];
  tech_changes: any[];
  issues_resolved: any[];
  new_features: any[];
  next_steps: any[];
  period_start: string;
  period_end: string;
}

export class GitHubAgentSDK {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: SDKConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000; // 30 second default
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`SDK Request failed: ${error.message}`);
      }
      throw new Error('SDK Request failed: Unknown error');
    }
  }

  // Repository Management
  async importRepositories(
    userId: string,
    githubToken?: string,
    githubUsername?: string
  ): Promise<{ success: boolean; imported_count: number; repositories: Repository[] }> {
    return this.request('/api/repositories/import', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        github_token: githubToken,
        github_username: githubUsername,
      }),
    });
  }

  async getRepositories(userId: string): Promise<Repository[]> {
    const response = await this.request<{ data: Repository[] }>(
      `/api/repositories?userId=${userId}`
    );
    return response.data;
  }

  async getRepository(repositoryId: string): Promise<Repository> {
    const response = await this.request<{ data: Repository }>(
      `/api/repositories/${repositoryId}`
    );
    return response.data;
  }

  // Repository Analysis
  async analyzeRepository(
    repositoryId?: string,
    githubUrl?: string,
    forceRefresh = false
  ): Promise<AnalysisResponse> {
    return this.request('/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify({
        repositoryId,
        github_url: githubUrl,
        force_refresh: forceRefresh,
      }),
    });
  }

  async getRepositoryAnalysis(repositoryId: string): Promise<AnalysisResponse> {
    return this.request(`/api/repositories/analyze?repositoryId=${repositoryId}`);
  }

  // Chat Interface
  async chat(
    message: string,
    userId: string,
    repositoryId?: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        userId,
        repositoryId,
        conversationId,
      }),
    });
  }

  async getConversations(
    userId: string,
    repositoryId?: string
  ): Promise<{ data: any[] }> {
    const params = new URLSearchParams({ userId });
    if (repositoryId) params.append('repositoryId', repositoryId);
    
    return this.request(`/api/conversations?${params}`);
  }

  async getMessages(conversationId: string): Promise<{ data: any[] }> {
    return this.request(`/api/conversations/${conversationId}/messages`);
  }

  // Todo Management
  async getTodoLists(
    userId: string,
    repositoryId?: string
  ): Promise<{ data: TodoList[] }> {
    const params = new URLSearchParams({ userId });
    if (repositoryId) params.append('repositoryId', repositoryId);
    
    return this.request(`/api/todos?${params}`);
  }

  async createTodoList(
    userId: string,
    repositoryId: string,
    data: Partial<TodoList>
  ): Promise<{ data: TodoList }> {
    return this.request('/api/todos', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        repositoryId,
        ...data,
      }),
    });
  }

  async updateTodoItem(
    itemId: string,
    updates: Partial<TodoItem>
  ): Promise<{ data: TodoItem }> {
    return this.request(`/api/todos/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async generateTodos(
    userId: string,
    repositoryId: string,
    analysisData?: any
  ): Promise<{ data: TodoList }> {
    return this.request('/api/todos/generate', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        repositoryId,
        analysisData,
      }),
    });
  }

  // Recap Generation
  async getRecaps(
    userId: string,
    repositoryId?: string
  ): Promise<{ data: Recap[] }> {
    const params = new URLSearchParams({ userId });
    if (repositoryId) params.append('repositoryId', repositoryId);
    
    return this.request(`/api/recaps?${params}`);
  }

  async generateRecap(
    userId: string,
    repositoryId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: Recap }> {
    return this.request('/api/recaps/generate', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        repositoryId,
        period_start: startDate,
        period_end: endDate,
      }),
    });
  }

  // Slack Integration
  async getSlackSettings(userId: string): Promise<{ data: any }> {
    return this.request(`/api/settings/slack?userId=${userId}`);
  }

  async updateSlackSettings(
    userId: string,
    settings: any
  ): Promise<{ success: boolean }> {
    return this.request('/api/settings/slack', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...settings,
      }),
    });
  }

  async deleteSlackSettings(userId: string): Promise<{ success: boolean }> {
    return this.request(`/api/settings/slack?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  // Webhook Testing
  async testWebhook(endpoint: string): Promise<{ success: boolean; response: any }> {
    return this.request('/api/webhooks/test', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  // Health Check
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/health');
  }

  // Utilities
  static createFromEnv(): GitHubAgentSDK {
    const baseUrl = process.env.GITHUB_AGENT_API_URL || 'http://localhost:3000';
    const apiKey = process.env.GITHUB_AGENT_API_KEY;
    
    return new GitHubAgentSDK({
      baseUrl,
      apiKey,
      timeout: 60000, // 60 seconds for production
    });
  }

  static create(baseUrl: string, apiKey?: string): GitHubAgentSDK {
    return new GitHubAgentSDK({
      baseUrl,
      apiKey,
      timeout: 60000,
    });
  }
}

// Export types for external use
export type {
  SDKConfig,
  Repository,
  ChatResponse,
  AnalysisResponse,
  TodoList,
  TodoItem,
  Recap,
};

// Default export
export default GitHubAgentSDK;

// Convenience functions for common operations
export const sdk = {
  // Quick setup for development
  development: () => GitHubAgentSDK.create('http://localhost:3000'),
  
  // Quick setup for production
  production: (domain: string, apiKey?: string) => 
    GitHubAgentSDK.create(`https://${domain}`, apiKey),
  
  // Environment-based setup
  fromEnv: () => GitHubAgentSDK.createFromEnv(),
};

// Example usage documentation
export const examples = {
  basic: `
import { GitHubAgentSDK } from '@/lib/sdk';

const client = new GitHubAgentSDK({
  baseUrl: 'https://your-app.vercel.app',
  apiKey: 'your-api-key', // optional
});

// Import repositories
const result = await client.importRepositories('user-id', 'github-token');

// Analyze a repository
const analysis = await client.analyzeRepository('repo-id');

// Chat with a repository
const response = await client.chat(
  'What is the main technology stack?',
  'user-id',
  'repo-id'
);
`,
  
  slack: `
import { sdk } from '@/lib/sdk';

const client = sdk.production('your-app.vercel.app', 'api-key');

// Configure Slack integration
await client.updateSlackSettings('user-id', {
  botName: 'My GitHub Bot',
  botToken: 'xoxb-...',
  signingSecret: 'your-secret',
  features: {
    chatCommands: true,
    repoUpdates: true,
  },
});
`,

  webhooks: `
// Test webhook connectivity
const client = sdk.fromEnv();
const test = await client.testWebhook('/api/slack/events');
console.log('Webhook test:', test);
`,
};
