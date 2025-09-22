// Database types for GitHub Agent Dashboard

export interface User {
  id: string;
  email: string;
  github_username?: string;
  github_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Repository {
  id: string;
  user_id: string;
  github_id: number;
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
  last_commit_sha?: string;
  last_commit_date?: string;
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

export interface RepositoryFile {
  id: string;
  repository_id: string;
  file_path: string;
  file_type?: string;
  file_content?: string;
  analysis?: string;
  importance_score: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  repository_id: string;
  title: string;
  summary?: string;
  context: ConversationContext;
  created_at: string;
  updated_at: string;
}

export interface ConversationContext {
  focus_areas: string[];
  current_task?: string;
  relevant_files: string[];
  key_concepts: string[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: MessageMetadata;
  token_count: number;
  created_at: string;
}

export interface MessageMetadata {
  agent_type?: string;
  tool_calls?: ToolCall[];
  sources?: string[];
  confidence?: number;
  reasoning?: string;
}

export interface ToolCall {
  name: string;
  input: Record<string, any>;
  output: Record<string, any>;
  duration: number;
}

export interface TodoList {
  id: string;
  user_id: string;
  repository_id: string;
  title: string;
  description?: string;
  category: TodoCategory;
  priority: Priority;
  status: 'active' | 'completed' | 'archived';
  due_date?: string;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
  items?: TodoItem[];
}

export type TodoCategory = 
  | 'bug' 
  | 'feature' 
  | 'maintenance' 
  | 'meeting-prep' 
  | 'documentation' 
  | 'refactor' 
  | 'testing' 
  | 'deployment';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface TodoItem {
  id: string;
  todo_list_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
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
  key_updates: KeyUpdate[];
  tech_changes: TechChange[];
  issues_resolved: Issue[];
  new_features: Feature[];
  performance_metrics: PerformanceMetrics;
  team_contributions: Record<string, ContributionStats>;
  next_steps: NextStep[];
  meeting_ready: boolean;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface KeyUpdate {
  type: 'feature' | 'bugfix' | 'improvement' | 'documentation' | 'infrastructure';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  commit_sha?: string;
}

export interface TechChange {
  type: 'added' | 'updated' | 'removed' | 'configured';
  component: string;
  description: string;
  version?: string;
  reason: string;
}

export interface Issue {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution: string;
  github_issue_url?: string;
}

export interface Feature {
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  estimated_effort: string;
  assignee?: string;
}

export interface PerformanceMetrics {
  build_time?: string;
  test_coverage?: number;
  bundle_size?: string;
  lighthouse_score?: number;
  response_time?: string;
  uptime?: string;
}

export interface ContributionStats {
  commits: number;
  lines_added: number;
  lines_removed: number;
  files_changed: number;
  pull_requests: number;
}

export interface NextStep {
  title: string;
  description: string;
  priority: Priority;
  estimated_effort: string;
  assigned_to?: string;
  due_date?: string;
}

export interface AgentExecution {
  id: string;
  user_id: string;
  conversation_id: string;
  agent_type: AgentType;
  graph_state: Record<string, any>;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  status: 'running' | 'completed' | 'failed' | 'paused';
  error_message?: string;
  step_count: number;
  token_usage: number;
  execution_time?: number;
  created_at: string;
  updated_at: string;
}

export type AgentType = 
  | 'repo_analyzer'
  | 'todo_creator' 
  | 'recap_generator' 
  | 'chat_assistant'
  | 'tech_stack_analyzer'
  | 'meeting_prep'
  | 'todo_generator';

export interface AgentStep {
  id: string;
  execution_id: string;
  step_name: string;
  step_type: 'tool_call' | 'llm_call' | 'decision' | 'analysis' | 'synthesis';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  duration: number;
  status: 'running' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface AnalysisCache {
  id: string;
  repository_id: string;
  analysis_type: 'tech_stack' | 'structure' | 'dependencies' | 'commits' | 'issues';
  cache_key: string;
  cached_data: Record<string, any>;
  expires_at: string;
  created_at: string;
}

// LangGraph specific types
export interface GraphState {
  messages: Message[];
  repository?: Repository;
  current_task?: string;
  analysis_results?: Record<string, any>;
  next_action?: string;
  context?: Record<string, any>;
}

export interface AgentTools {
  github_analyzer: {
    analyze_repository: (repoId: string) => Promise<any>;
    fetch_commits: (repoId: string, since?: string) => Promise<any>;
    fetch_issues: (repoId: string, state?: 'open' | 'closed' | 'all') => Promise<any>;
    fetch_pull_requests: (repoId: string, state?: 'open' | 'closed' | 'all') => Promise<any>;
  };
  todo_creator: {
    create_todo_list: (data: Partial<TodoList>) => Promise<TodoList>;
    create_todo_items: (listId: string, items: Partial<TodoItem>[]) => Promise<TodoItem[]>;
    prioritize_todos: (items: TodoItem[]) => Promise<TodoItem[]>;
  };
  recap_generator: {
    generate_recap: (repoId: string, startDate: string, endDate: string) => Promise<Recap>;
    analyze_commits: (commits: any[]) => Promise<KeyUpdate[]>;
    extract_metrics: (repoId: string) => Promise<PerformanceMetrics>;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// GitHub API types (simplified)
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  language?: string;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  created_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  merged_at?: string;
  html_url: string;
}

// UI Component Props types
export interface RepositoryCardProps {
  repository: Repository;
  onSelect: (repo: Repository) => void;
  onAnalyze: (repo: Repository) => void;
  isSelected?: boolean;
  isAnalyzing?: boolean;
}

export interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export interface TodoListProps {
  todoList: TodoList;
  onUpdate: (list: TodoList) => void;
  onDelete: (listId: string) => void;
}

export interface RecapCardProps {
  recap: Recap;
  onEdit: (recap: Recap) => void;
  onDelete: (recapId: string) => void;
  onExport: (recap: Recap) => void;
}

// Email Settings and Reporting
export interface EmailSettings {
  id: string;
  user_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  sender_name: string;
  sender_email: string;
  logo_url: string;
  company_name: string;
  primary_color: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  type: 'repository_report' | 'alert' | 'notification';
  subject: string;
  html_content: string;
  text_content?: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RepositoryReport {
  id: string;
  user_id: string;
  repository_id: string;
  title: string;
  summary: string;
  commit_summary: CommitSummary[];
  issue_summary: IssueSummary[];
  pull_request_summary: PullRequestSummary[];
  performance_metrics: ReportMetrics;
  recommendations: string[];
  period_start: string;
  period_end: string;
  generated_at: string;
  email_sent: boolean;
  email_sent_at?: string;
  recipients: string[];
}

export interface CommitSummary {
  author: string;
  commit_count: number;
  lines_added: number;
  lines_removed: number;
  files_changed: number;
  most_active_files: string[];
}

export interface IssueSummary {
  total_issues: number;
  open_issues: number;
  closed_issues: number;
  critical_issues: number;
  avg_resolution_time: number;
  top_labels: string[];
}

export interface PullRequestSummary {
  total_prs: number;
  open_prs: number;
  merged_prs: number;
  draft_prs: number;
  avg_review_time: number;
  top_contributors: string[];
}

export interface ReportMetrics {
  build_success_rate: number;
  test_coverage: number;
  code_quality_score: number;
  security_score: number;
  performance_score: number;
  dependencies_outdated: number;
}

export interface EmailSchedule {
  id: string;
  user_id: string;
  repository_id?: string;
  template_id: string;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'on_event';
  schedule_config: ScheduleConfig;
  recipients: string[];
  is_active: boolean;
  last_sent_at?: string;
  next_scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleConfig {
  day_of_week?: number;
  day_of_month?: number;
  hour: number;
  minute: number;
  timezone: string;
  events?: string[];
}
