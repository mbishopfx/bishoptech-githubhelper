import { ChatOpenAI } from '@langchain/openai';
import { AgentType, GraphState } from '@/types/database';

// OpenAI GPT-4o configuration
export const createLLM = (temperature = 0.1, maxTokens = 4000) => {
  return new ChatOpenAI({
    model: 'gpt-4o',
    temperature,
    maxTokens,
    apiKey: process.env.OPENAI_API_KEY!,
  });
};

// Agent system prompts
export const AGENT_PROMPTS = {
  repo_analyzer: `You are a senior software engineer and repository analyst. Your role is to analyze GitHub repositories and provide comprehensive insights about codebases.

Key responsibilities:
- Analyze repository structure, tech stack, and dependencies
- Identify key files, patterns, and architecture
- Assess code quality, documentation, and best practices
- Extract meaningful insights about project status and health
- Provide actionable recommendations for improvement

Always be thorough, accurate, and provide specific examples from the codebase when possible.`,

  todo_creator: `You are an expert project manager and productivity specialist. Your role is to create comprehensive, actionable todo lists based on repository analysis and user requirements.

Key responsibilities:
- Create well-structured todo lists with clear priorities
- Break down complex tasks into manageable subtasks
- Assign appropriate priority levels and effort estimates
- Consider dependencies and logical task ordering
- Generate todos that are specific, measurable, and actionable

Focus on practical outcomes and clear next steps that developers can immediately act upon.`,

  recap_generator: `You are a technical program manager specializing in project summaries and status reports. Your role is to create comprehensive recaps that are perfect for meetings and stakeholder updates.

Key responsibilities:
- Analyze recent repository activity and changes
- Summarize key updates, features, and bug fixes
- Identify performance improvements and technical debt
- Track team contributions and collaboration patterns
- Generate executive-ready summaries with clear metrics
- Provide forward-looking recommendations and next steps

Create recaps that tell a clear story of project progress and trajectory.`,

  chat_assistant: `You are an intelligent code assistant with deep knowledge of software development and project management. You help developers understand their repositories, answer technical questions, and provide guidance.

Key responsibilities:
- Answer questions about code, architecture, and project status
- Help navigate complex codebases and find specific information
- Provide technical guidance and best practice recommendations
- Explain code patterns, dependencies, and relationships
- Assist with debugging, optimization, and improvement suggestions

Be conversational, helpful, and provide context-aware responses based on the specific repository being discussed.`,

  tech_stack_analyzer: `You are a technology specialist and architecture analyst. Your role is to deeply analyze the technical stack and dependencies of repositories.

Key responsibilities:
- Identify all technologies, frameworks, and libraries in use
- Analyze dependency relationships and version compatibility
- Assess security vulnerabilities and update requirements
- Evaluate performance implications of technology choices
- Recommend modernization and optimization opportunities
- Map out the complete technical architecture

Provide detailed technical insights that help teams make informed decisions about their stack.`,

  meeting_prep: `You are an executive assistant and meeting facilitator specializing in technical project updates. Your role is to prepare comprehensive meeting materials from repository data.

Key responsibilities:
- Create executive summaries suitable for stakeholder meetings
- Prepare talking points about project progress and blockers
- Generate visual-ready data about metrics and milestones
- Identify key decisions needed and discussion topics
- Create follow-up action items and responsibility assignments
- Format information for different audience types (technical/non-technical)

Focus on clear communication that enables productive meetings and decision-making.`,

  todo_generator: `You are an expert software project manager and development consultant. Your role is to analyze repositories comprehensively and generate intelligent, actionable todo items that improve code quality, maintainability, and project health.

Key responsibilities:
- Perform deep analysis of repository structure, commits, and activity
- Identify technical debt, security vulnerabilities, and performance issues
- Generate specific, actionable improvement tasks with clear priorities
- Assess project health and deployment readiness
- Recommend architecture improvements and best practices
- Create practical todo items with effort estimates and impact scores

Focus on creating todos that will have the maximum positive impact on project quality and developer productivity.`
};

// Agent configuration templates
export const AGENT_CONFIGS: Record<AgentType, {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
  maxSteps: number;
  temperature: number;
}> = {
  repo_analyzer: {
    name: 'Repository Analyzer',
    description: 'Analyzes GitHub repositories for structure, tech stack, and code quality',
    systemPrompt: AGENT_PROMPTS.repo_analyzer,
    tools: ['github_fetch', 'file_analyzer', 'tech_stack_detector', 'code_quality_assessor'],
    maxSteps: 10,
    temperature: 0.1,
  },
  todo_creator: {
    name: 'Todo List Creator',
    description: 'Creates comprehensive todo lists based on repository analysis',
    systemPrompt: AGENT_PROMPTS.todo_creator,
    tools: ['repo_scanner', 'task_prioritizer', 'effort_estimator', 'dependency_mapper'],
    maxSteps: 8,
    temperature: 0.2,
  },
  recap_generator: {
    name: 'Project Recap Generator',
    description: 'Generates meeting-ready project summaries and status reports',
    systemPrompt: AGENT_PROMPTS.recap_generator,
    tools: ['commit_analyzer', 'metrics_collector', 'team_tracker', 'progress_assessor'],
    maxSteps: 12,
    temperature: 0.1,
  },
  chat_assistant: {
    name: 'Intelligent Chat Assistant',
    description: 'Provides conversational help with repository questions and guidance',
    systemPrompt: AGENT_PROMPTS.chat_assistant,
    tools: ['code_search', 'context_retriever', 'explanation_generator', 'guidance_provider'],
    maxSteps: 6,
    temperature: 0.3,
  },
  tech_stack_analyzer: {
    name: 'Tech Stack Analyzer',
    description: 'Deeply analyzes technology stack, dependencies, and architecture',
    systemPrompt: AGENT_PROMPTS.tech_stack_analyzer,
    tools: ['dependency_scanner', 'vulnerability_checker', 'compatibility_analyzer', 'architecture_mapper'],
    maxSteps: 15,
    temperature: 0.1,
  },
  meeting_prep: {
    name: 'Meeting Preparation Assistant',
    description: 'Prepares comprehensive meeting materials and executive summaries',
    systemPrompt: AGENT_PROMPTS.meeting_prep,
    tools: ['summary_generator', 'metrics_formatter', 'talking_points_creator', 'action_item_extractor'],
    maxSteps: 8,
    temperature: 0.2,
  },
  todo_generator: {
    name: 'Advanced Todo Generator',
    description: 'Performs comprehensive repository analysis to generate intelligent todo lists',
    systemPrompt: AGENT_PROMPTS.todo_generator,
    tools: ['repo_scanner', 'commit_analyzer', 'health_checker', 'priority_assessor', 'todo_creator'],
    maxSteps: 15,
    temperature: 0.2,
  },
};

// Default graph state structure
export const createInitialGraphState = (
  agentType: AgentType,
  input: Record<string, any>
): GraphState => {
  return {
    messages: [],
    current_task: `Execute ${agentType} workflow`,
    analysis_results: {},
    next_action: 'start',
    context: {
      agent_type: agentType,
      input_data: input,
      step_count: 0,
      start_time: Date.now(),
      max_steps: AGENT_CONFIGS[agentType].maxSteps,
    },
  };
};

// Graph node types
export type GraphNodeFunction = (state: GraphState) => Promise<GraphState>;

// Common graph utilities
export const shouldContinue = (state: GraphState): boolean => {
  const maxSteps = state.context?.max_steps || 10;
  const currentStep = state.context?.step_count || 0;
  
  return currentStep < maxSteps && state.next_action !== 'end';
};

export const incrementStepCount = (state: GraphState): GraphState => {
  return {
    ...state,
    context: {
      ...state.context,
      step_count: (state.context?.step_count || 0) + 1,
    },
  };
};

export const setNextAction = (state: GraphState, action: string): GraphState => {
  return {
    ...state,
    next_action: action,
  };
};

// Error handling utilities
export const handleAgentError = (state: GraphState, error: Error): GraphState => {
  return {
    ...state,
    next_action: 'handleError',
    context: {
      ...state.context,
      error_message: error.message,
      error_stack: error.stack,
    },
  };
};

// LLM response parsing utilities
export const parseAgentResponse = (response: string): {
  action: string;
  reasoning: string;
  data: Record<string, any>;
} => {
  try {
    // Try to extract structured response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        action: parsed.action || 'continue',
        reasoning: parsed.reasoning || 'No reasoning provided',
        data: parsed.data || {},
      };
    }
    
    // Fallback to text parsing
    return {
      action: 'continue',
      reasoning: response,
      data: { response },
    };
  } catch (error) {
    return {
      action: 'handleError',
      reasoning: `Failed to parse response: ${error}`,
      data: { raw_response: response },
    };
  }
};

// Token counting utilities
export const estimateTokenCount = (text: string): number => {
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
};

export const calculateCost = (inputTokens: number, outputTokens: number): number => {
  // GPT-4o pricing (approximate)
  const inputCostPer1K = 0.005;
  const outputCostPer1K = 0.015;
  
  return (inputTokens / 1000) * inputCostPer1K + (outputTokens / 1000) * outputCostPer1K;
};
