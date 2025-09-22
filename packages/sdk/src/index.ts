/**
 * GitHub Agent Dashboard SDK
 * 
 * A TypeScript SDK for interacting with the GitHub Agent Dashboard API
 * Provides AI-powered repository analysis, chat functionality, and Slack integration
 */

// Types and interfaces
export interface SDKConfig {
  /** Base URL of the GitHub Agent Dashboard instance */
  baseUrl: string;
  /** API key for authentication (optional) */
  apiKey?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom headers to include with requests */
  headers?: Record<string, string>;
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  language?: string;
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  forks: number;
  open_issues: number;
  default_branch: string;
  tech_stack: TechStack;
  analysis_summary?: string;
  last_analyzed?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TechStack {
  frameworks: string[];
  languages: string[];
  databases: string[];
  tools: string[];
  deployment: string[];
  testing: string[];
  styling: string[];
  apis: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  token_count: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  repository_id: string;
  title: string;
  summary?: string;
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface TodoList {
  id: string;
  user_id: string;
  repository_id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'archived';
  due_date?: string;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
  items?: TodoItem[];
}

export interface TodoItem {
  id: string;
  todo_list_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  labels: string[];
  github_issue_url?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Recap {
  id: string;
  user_id: string;
  repository_id: string;
  title: string;
  summary: string;
  key_updates: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
  }>;
  tech_changes: Array<{
    type: string;
    component: string;
    description: string;
    reason: string;
  }>;
  issues_resolved: Array<{
    title: string;
    description: string;
    severity: string;
    resolution: string;
  }>;
  new_features: Array<{
    title: string;
    description: string;
    status: string;
  }>;
  next_steps: Array<{
    title: string;
    description: string;
    priority: string;
  }>;
  meeting_ready: boolean;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface SlackSettings {
  bot_name: string;
  app_name: string;
  description: string;
  features: {
    chat_commands: boolean;
    repo_updates: boolean;
    todo_notifications: boolean;
    meeting_recaps: boolean;
    direct_messages: boolean;
  };
  scopes: string[];
  webhook_url?: string;
  is_active: boolean;
}

// Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatResponse extends APIResponse {
  response: string;
  conversation_id?: string;
  execution_time?: number;
  steps?: number;
}

export interface AnalysisResponse extends APIResponse {
  execution_time?: number;
  steps?: number;
  from_cache?: boolean;
}

export interface ImportResponse extends APIResponse {
  imported_count: number;
  repositories: Repository[];
}

// Error classes
export class GitHubAgentSDKError extends Error {
  constructor(message: string, public statusCode?: number, public details?: any) {
    super(message);
    this.name = 'GitHubAgentSDKError';
  }
}

export class GitHubAgentAuthError extends GitHubAgentSDKError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'GitHubAgentAuthError';
  }
}

export class GitHubAgentTimeoutError extends GitHubAgentSDKError {
  constructor(message = 'Request timeout') {
    super(message, 408);
    this.name = 'GitHubAgentTimeoutError';
  }
}

// Main SDK class
export class GitHubAgentSDK {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(config: SDKConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': '@github-agent/sdk/1.0.0',
      ...(config.headers || {}),
    };

    if (this.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
  }

  /**
   * Make an authenticated request to the API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...((options.headers as Record<string, string>) || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new GitHubAgentAuthError(errorData.error || 'Authentication failed');
        }
        
        throw new GitHubAgentSDKError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new GitHubAgentTimeoutError('Request timeout');
      }
      
      if (error instanceof GitHubAgentSDKError) {
        throw error;
      }
      
      throw new GitHubAgentSDKError(
        `SDK Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Repository Management
  
  /**
   * Import repositories from GitHub for a user
   */
  async importRepositories(
    userId: string,
    githubToken?: string,
    githubUsername?: string
  ): Promise<ImportResponse> {
    return this.request('/api/repositories/import', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        github_token: githubToken,
        github_username: githubUsername,
      }),
    });
  }

  /**
   * Get all repositories for a user
   */
  async getRepositories(userId: string, activeOnly = true): Promise<Repository[]> {
    const params = new URLSearchParams({ 
      userId,
      activeOnly: activeOnly.toString() 
    });
    
    const response = await this.request<APIResponse<Repository[]>>(
      `/api/repositories?${params}`
    );
    return response.data || [];
  }

  /**
   * Get a specific repository by ID
   */
  async getRepository(repositoryId: string): Promise<Repository> {
    const response = await this.request<APIResponse<Repository>>(
      `/api/repositories/${repositoryId}`
    );
    if (!response.data) {
      throw new GitHubAgentSDKError('Repository not found', 404);
    }
    return response.data;
  }

  /**
   * Update repository settings
   */
  async updateRepository(
    repositoryId: string, 
    updates: Partial<Repository>
  ): Promise<Repository> {
    const response = await this.request<APIResponse<Repository>>(
      `/api/repositories/${repositoryId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    if (!response.data) {
      throw new GitHubAgentSDKError('Failed to update repository');
    }
    return response.data;
  }

  // Repository Analysis

  /**
   * Analyze a repository using AI agents
   */
  async analyzeRepository(params: {
    repositoryId?: string;
    githubUrl?: string;
    forceRefresh?: boolean;
  }): Promise<AnalysisResponse> {
    const { repositoryId, githubUrl, forceRefresh = false } = params;
    
    if (!repositoryId && !githubUrl) {
      throw new GitHubAgentSDKError('Either repositoryId or githubUrl is required');
    }

    return this.request('/api/repositories/analyze', {
      method: 'POST',
      body: JSON.stringify({
        repositoryId,
        github_url: githubUrl,
        force_refresh: forceRefresh,
      }),
    });
  }

  /**
   * Get existing analysis for a repository
   */
  async getRepositoryAnalysis(repositoryId: string): Promise<AnalysisResponse> {
    return this.request(`/api/repositories/analyze?repositoryId=${repositoryId}`);
  }

  // Chat Interface

  /**
   * Send a chat message about a repository
   */
  async chat(params: {
    message: string;
    userId: string;
    repositoryId?: string;
    conversationId?: string;
  }): Promise<ChatResponse> {
    const { message, userId, repositoryId, conversationId } = params;
    
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

  /**
   * Get all conversations for a user
   */
  async getConversations(
    userId: string,
    repositoryId?: string
  ): Promise<Conversation[]> {
    const params = new URLSearchParams({ userId });
    if (repositoryId) params.append('repositoryId', repositoryId);
    
    const response = await this.request<APIResponse<Conversation[]>>(
      `/api/conversations?${params}`
    );
    return response.data || [];
  }

  /**
   * Get messages from a specific conversation
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const response = await this.request<APIResponse<ChatMessage[]>>(
      `/api/conversations/${conversationId}/messages`
    );
    return response.data || [];
  }

  // Todo Management

  /**
   * Get todo lists for a user
   */
  async getTodoLists(
    userId: string,
    repositoryId?: string
  ): Promise<TodoList[]> {
    const params = new URLSearchParams({ userId });
    if (repositoryId) params.append('repositoryId', repositoryId);
    
    const response = await this.request<APIResponse<TodoList[]>>(
      `/api/todos?${params}`
    );
    return response.data || [];
  }

  /**
   * Create a new todo list
   */
  async createTodoList(params: {
    userId: string;
    repositoryId: string;
    title: string;
    description?: string;
    category?: string;
    priority?: TodoList['priority'];
  }): Promise<TodoList> {
    const response = await this.request<APIResponse<TodoList>>('/api/todos', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    if (!response.data) {
      throw new GitHubAgentSDKError('Failed to create todo list');
    }
    return response.data;
  }

  /**
   * Update a todo item
   */
  async updateTodoItem(
    itemId: string,
    updates: Partial<TodoItem>
  ): Promise<TodoItem> {
    const response = await this.request<APIResponse<TodoItem>>(
      `/api/todos/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
    if (!response.data) {
      throw new GitHubAgentSDKError('Failed to update todo item');
    }
    return response.data;
  }

  /**
   * Generate todo lists automatically from repository analysis
   */
  async generateTodos(params: {
    userId: string;
    repositoryId: string;
    analysisData?: any;
    categories?: string[];
  }): Promise<TodoList> {
    const response = await this.request<APIResponse<TodoList>>(
      '/api/todos/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    if (!response.data) {
      throw new GitHubAgentSDKError('Failed to generate todos');
    }
    return response.data;
  }

  // Recap Generation

  /**
   * Get recaps for a user
   */
  async getRecaps(
    userId: string,
    repositoryId?: string
  ): Promise<Recap[]> {
    const params = new URLSearchParams({ userId });
    if (repositoryId) params.append('repositoryId', repositoryId);
    
    const response = await this.request<APIResponse<Recap[]>>(
      `/api/recaps?${params}`
    );
    return response.data || [];
  }

  /**
   * Generate a meeting recap for a repository
   */
  async generateRecap(params: {
    userId: string;
    repositoryId: string;
    startDate: string;
    endDate: string;
    meetingReady?: boolean;
  }): Promise<Recap> {
    const response = await this.request<APIResponse<Recap>>(
      '/api/recaps/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: params.userId,
          repositoryId: params.repositoryId,
          period_start: params.startDate,
          period_end: params.endDate,
          meeting_ready: params.meetingReady ?? true,
        }),
      }
    );
    if (!response.data) {
      throw new GitHubAgentSDKError('Failed to generate recap');
    }
    return response.data;
  }

  // Slack Integration

  /**
   * Get Slack settings for a user
   */
  async getSlackSettings(userId: string): Promise<SlackSettings | null> {
    const response = await this.request<APIResponse<SlackSettings>>(
      `/api/settings/slack?userId=${userId}`
    );
    return response.data || null;
  }

  /**
   * Update Slack settings
   */
  async updateSlackSettings(
    userId: string,
    settings: Partial<SlackSettings> & {
      botToken?: string;
      signingSecret?: string;
      clientId?: string;
      clientSecret?: string;
    }
  ): Promise<{ success: boolean; webhook_url?: string }> {
    return this.request('/api/settings/slack', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...settings,
      }),
    });
  }

  /**
   * Delete Slack settings
   */
  async deleteSlackSettings(userId: string): Promise<{ success: boolean }> {
    return this.request(`/api/settings/slack?userId=${userId}`, {
      method: 'DELETE',
    });
  }

  // Health Check

  /**
   * Check API health status
   */
  async health(): Promise<{ status: string; timestamp: string; version?: string }> {
    return this.request('/api/health');
  }

  // Static factory methods

  /**
   * Create SDK instance from environment variables
   */
  static fromEnvironment(): GitHubAgentSDK {
    const baseUrl = process.env.GITHUB_AGENT_API_URL;
    if (!baseUrl) {
      throw new GitHubAgentSDKError('GITHUB_AGENT_API_URL environment variable is required');
    }

    return new GitHubAgentSDK({
      baseUrl,
      apiKey: process.env.GITHUB_AGENT_API_KEY,
      timeout: process.env.GITHUB_AGENT_TIMEOUT 
        ? parseInt(process.env.GITHUB_AGENT_TIMEOUT) 
        : undefined,
    });
  }

  /**
   * Create SDK instance for local development
   */
  static development(port = 3000): GitHubAgentSDK {
    return new GitHubAgentSDK({
      baseUrl: `http://localhost:${port}`,
      timeout: 60000, // Longer timeout for development
    });
  }

  /**
   * Create SDK instance for production use
   */
  static production(domain: string, apiKey?: string): GitHubAgentSDK {
    return new GitHubAgentSDK({
      baseUrl: `https://${domain}`,
      apiKey,
      timeout: 30000,
    });
  }
}

// Default export
export default GitHubAgentSDK;

// Convenience exports
export const sdk = {
  /** Create SDK for local development */
  development: (port?: number) => GitHubAgentSDK.development(port),
  
  /** Create SDK for production */
  production: (domain: string, apiKey?: string) => GitHubAgentSDK.production(domain, apiKey),
  
  /** Create SDK from environment variables */
  fromEnv: () => GitHubAgentSDK.fromEnvironment(),
};

// Version info
export const VERSION = '1.0.0';
