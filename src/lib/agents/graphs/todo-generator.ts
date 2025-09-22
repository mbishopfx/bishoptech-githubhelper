import { StateGraph, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createLLM, AGENT_CONFIGS, incrementStepCount, setNextAction, handleAgentError } from '../config';
import { allTools } from '../tools';
import { GraphState } from '@/types/database';
import { db } from '@/lib/supabase';
import { Octokit } from '@octokit/rest';

// Enhanced Todo Generation Graph with comprehensive repository analysis
export class TodoGeneratorGraph {
  private graph: StateGraph<GraphState>;
  private llm: any;
  private octokit: Octokit;

  constructor() {
    this.llm = createLLM(AGENT_CONFIGS.todo_generator?.temperature || 0.2);
    this.llm = this.llm.bind({ tools: allTools });
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<GraphState> {
    const graph = new StateGraph({
      channels: {
        messages: {
          value: (x: any, y: any) => x.concat(y),
          default: () => [],
        },
        repositoryId: {
          value: null,
          default: () => null,
        },
        userId: {
          value: null,
          default: () => null,
        },
        context: {
          value: (x: any, y: any) => ({ ...x, ...y }),
          default: () => ({}),
        },
        analysis: {
          value: (x: any, y: any) => ({ ...x, ...y }),
          default: () => ({}),
        },
        todos: {
          value: (x: any, y: any) => [...(x || []), ...(y || [])],
          default: () => [],
        },
        stepCount: {
          value: (x: number, y: number) => y,
          default: () => 0,
        },
        executionId: {
          value: null,
          default: () => null,
        },
        error: {
          value: null,
          default: () => null,
        },
        nextAction: {
          value: null,
          default: () => null,
        },
      },
    });

    // Define nodes
    graph.addNode('start', this.startNode.bind(this));
    graph.addNode('fetchRepository', this.fetchRepositoryNode.bind(this));
    graph.addNode('analyzeCommits', this.analyzeCommitsNode.bind(this));
    graph.addNode('analyzeCodeStructure', this.analyzeCodeStructureNode.bind(this));
    graph.addNode('checkHealth', this.checkHealthNode.bind(this));
    graph.addNode('generateTodos', this.generateTodosNode.bind(this));
    graph.addNode('prioritizeTodos', this.prioritizeTodosNode.bind(this));
    graph.addNode('saveTodos', this.saveTodosNode.bind(this));
    graph.addNode('complete', this.completeNode.bind(this));
    graph.addNode('handleError', this.errorNode.bind(this));

    // Define edges with conditional routing for errors
    graph.addConditionalEdges('start', (state: GraphState) => {
      return state.nextAction === 'handleError' ? 'handleError' : 'fetchRepository';
    });
    
    graph.addConditionalEdges('fetchRepository', (state: GraphState) => {
      return state.nextAction === 'handleError' ? 'handleError' : 'analyzeCommits';
    });
    
    graph.addConditionalEdges('analyzeCommits', (state: GraphState) => {
      return state.nextAction === 'handleError' ? 'handleError' : 'analyzeCodeStructure';
    });
    
    graph.addConditionalEdges('analyzeCodeStructure', (state: GraphState) => {
      return state.nextAction === 'handleError' ? 'handleError' : 'checkHealth';
    });
    
    graph.addConditionalEdges('checkHealth', (state: GraphState) => {
      return state.nextAction === 'handleError' ? 'handleError' : 'generateTodos';
    });
    
    graph.addConditionalEdges('generateTodos', (state: GraphState) => {
      return state.nextAction === 'handleError' ? 'handleError' : 'prioritizeTodos';
    });
    
    graph.addConditionalEdges('prioritizeTodos', (state: GraphState) => {
      return state.nextAction === 'handleError' ? 'handleError' : 'saveTodos';
    });
    
    graph.addConditionalEdges('saveTodos', (state: GraphState) => {
      return state.nextAction === 'handleError' ? 'handleError' : 'complete';
    });
    
    graph.addEdge('handleError', END);
    graph.addEdge('complete', END);

    // Set entry point
    graph.setEntryPoint('start');

    return graph;
  }

  private async startNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('🚀 Starting enhanced todo generation process...');
      
      const executionId = crypto.randomUUID();
      
      // Create agent execution record
      await db
        .from('agent_executions')
        .insert({
          id: executionId,
          user_id: state.userId,
          agent_type: 'todo_generator',
          status: 'running',
          input_data: {
            repository_id: state.repositoryId,
            timestamp: new Date().toISOString(),
          },
          graph_state: { current_step: 'start' }
        });

      return {
        executionId,
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'fetchRepository',
        context: {
          ...state.context,
          startTime: Date.now(),
          phase: 'initialization'
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async fetchRepositoryNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('📦 Fetching repository details and metadata...');
      
      // Get repository from database
      const { data: repository, error: repoError } = await db
        .from('repositories')
        .select('*')
        .eq('id', state.repositoryId)
        .single();

      if (repoError || !repository) {
        throw new Error(`Repository not found: ${state.repositoryId}`);
      }

      // Get GitHub repository data
      const [owner, repo] = repository.full_name.split('/');
      const { data: githubRepo } = await this.octokit.repos.get({
        owner,
        repo
      });

      // Get repository topics and languages
      const [{ data: languages }, { data: topics }] = await Promise.all([
        this.octokit.repos.listLanguages({ owner, repo }),
        this.octokit.repos.getAllTopics({ owner, repo })
      ]);

      const repositoryData = {
        ...repository,
        github_data: githubRepo,
        languages,
        topics: topics.names,
        analysis_timestamp: new Date().toISOString()
      };

      await this.recordStep(state.executionId, 'fetch_repository', {
        repository_name: repository.full_name,
        languages: Object.keys(languages),
        topics: topics.names,
        stars: githubRepo.stargazers_count,
        forks: githubRepo.forks_count
      });

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'analyzeCommits',
        context: {
          ...state.context,
          repository: repositoryData,
          phase: 'repository_analysis'
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async analyzeCommitsNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('📝 Analyzing recent commits and activity patterns...');
      
      const repository = state.context.repository;
      const [owner, repo] = repository.full_name.split('/');
      
      // Get commits from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: commits } = await this.octokit.repos.listCommits({
        owner,
        repo,
        since: thirtyDaysAgo.toISOString(),
        per_page: 100
      });

      // Get pull requests
      const { data: pullRequests } = await this.octokit.pulls.list({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 50
      });

      // Get issues
      const { data: issues } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 50
      });

      // Analyze commit patterns
      const commitAnalysis = await this.analyzeCommitPatterns(commits);
      const prAnalysis = await this.analyzePullRequests(pullRequests);
      const issueAnalysis = await this.analyzeIssues(issues.filter(issue => !issue.pull_request));

      await this.recordStep(state.executionId, 'analyze_commits', {
        commits_count: commits.length,
        open_prs: pullRequests.filter(pr => pr.state === 'open').length,
        open_issues: issues.filter(issue => issue.state === 'open' && !issue.pull_request).length,
        commit_frequency: commitAnalysis.frequency,
        main_contributors: commitAnalysis.contributors.slice(0, 5)
      });

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'analyzeCodeStructure',
        analysis: {
          ...state.analysis,
          commits: commitAnalysis,
          pullRequests: prAnalysis,
          issues: issueAnalysis,
          activity_score: this.calculateActivityScore(commitAnalysis, prAnalysis, issueAnalysis)
        },
        context: {
          ...state.context,
          phase: 'commit_analysis'
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async analyzeCodeStructureNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('🏗️ Analyzing code structure and architecture...');
      
      const repository = state.context.repository;
      const [owner, repo] = repository.full_name.split('/');

      // Get repository contents
      const { data: contents } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: ''
      });

      // Analyze file structure
      const fileAnalysis = await this.analyzeFileStructure(contents);
      
      // Check for specific files that indicate project health
      const healthFiles = await this.checkHealthFiles(owner, repo);
      
      // Analyze dependencies if package.json exists
      let dependencyAnalysis = null;
      if (healthFiles.packageJson) {
        dependencyAnalysis = await this.analyzeDependencies(healthFiles.packageJson);
      }

      await this.recordStep(state.executionId, 'analyze_code_structure', {
        file_count: fileAnalysis.totalFiles,
        directory_count: fileAnalysis.directories,
        main_language: repository.language,
        has_readme: healthFiles.hasReadme,
        has_tests: healthFiles.hasTests,
        has_ci: healthFiles.hasCi
      });

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'checkHealth',
        analysis: {
          ...state.analysis,
          structure: fileAnalysis,
          health_files: healthFiles,
          dependencies: dependencyAnalysis,
          architecture_score: this.calculateArchitectureScore(fileAnalysis, healthFiles)
        },
        context: {
          ...state.context,
          phase: 'structure_analysis'
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async checkHealthNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('🏥 Performing health checks and deployment status...');
      
      const repository = state.context.repository;
      const healthCheck = {
        deployment_status: 'unknown',
        live_url: null,
        last_deployment: null,
        build_status: 'unknown',
        test_status: 'unknown',
        security_alerts: [],
        performance_score: null
      };

      // Check GitHub Actions/CI status
      const [owner, repo] = repository.full_name.split('/');
      
      try {
        const { data: workflows } = await this.octokit.actions.listRepoWorkflows({
          owner,
          repo
        });

        if (workflows.total_count > 0) {
          const { data: runs } = await this.octokit.actions.listWorkflowRunsForRepo({
            owner,
            repo,
            per_page: 10
          });

          healthCheck.build_status = runs.workflow_runs.length > 0 
            ? runs.workflow_runs[0].conclusion || 'running'
            : 'no_ci';
        }
      } catch (error) {
        console.log('No CI/CD workflows found or access denied');
      }

      // Try to detect if project is deployed (common patterns)
      const deploymentHints = await this.detectDeployment(repository);
      if (deploymentHints.url) {
        healthCheck.deployment_status = 'deployed';
        healthCheck.live_url = deploymentHints.url;
      }

      await this.recordStep(state.executionId, 'health_check', {
        deployment_status: healthCheck.deployment_status,
        build_status: healthCheck.build_status,
        has_live_url: !!healthCheck.live_url
      });

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'generateTodos',
        analysis: {
          ...state.analysis,
          health: healthCheck,
          is_production_ready: this.assessProductionReadiness(state.analysis, healthCheck)
        },
        context: {
          ...state.context,
          phase: 'health_check'
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async generateTodosNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('🤖 Generating intelligent todo recommendations...');
      console.log(`🔍 Starting generateTodos with state.todos.length: ${state.todos?.length || 0}`);
      
      const systemPrompt = new SystemMessage(`You are an expert software project manager and developer. Based on the comprehensive repository analysis provided, generate specific, actionable todo items that will improve the project's quality, maintainability, and production readiness.

Consider:
- Code quality and architecture improvements
- Missing documentation or tests
- Security vulnerabilities
- Performance optimizations  
- CI/CD and deployment improvements
- Technical debt reduction
- Feature development opportunities
- Project maintenance tasks

For each todo, provide:
- Clear, actionable title
- Detailed description with specific steps
- Priority level (low, medium, high, urgent)
- Estimated effort in hours
- Category (maintenance, feature, bug, security, performance, documentation)
- Rationale based on the analysis

Repository Analysis Summary:
${JSON.stringify(state.analysis, null, 2)}

Generate 5-15 highly relevant, specific todo items based on this analysis.`);

      const prompt = new HumanMessage(`Based on the repository analysis, generate a comprehensive list of todo items for this project. Focus on actionable improvements that address the specific issues and opportunities identified in the analysis.

Repository: ${state.context.repository.full_name}
Activity Score: ${state.analysis.activity_score}
Architecture Score: ${state.analysis.architecture_score}
Production Ready: ${state.analysis.is_production_ready}

Return the response as a JSON array of todo objects with the following structure:
{
  "title": "string",
  "description": "string", 
  "priority": "low|medium|high|urgent",
  "category": "string",
  "estimated_hours": number,
  "rationale": "string"
}

Focus on practical, actionable items that will have the most impact on project quality and maintainability.`);

      const response = await this.llm.invoke([systemPrompt, prompt]);
      let todos = this.parseTodoResponse(response.content);

      // Ensure we always generate at least one todo - use last commit message as inspiration
      if (todos.length === 0) {
        console.log('⚠️ No todos generated by AI, creating fallback todos based on repository activity');
        console.log('🔍 Debug state.context.repository:', !!state.context.repository);
        console.log('🔍 Debug state.analysis:', Object.keys(state.analysis || {}));
        todos = this.generateFallbackTodos(state.context.repository, state.analysis);
        console.log(`✅ Generated ${todos.length} fallback todos`);
      } else {
        console.log(`✅ AI generated ${todos.length} todos successfully`);
      }

      // Force fallback if we still have no todos
      if (todos.length === 0) {
        console.log('🔄 Still no todos after parsing, forcing fallback generation');
        todos = [{
          title: 'Code review and quality improvements',
          description: 'Conduct a comprehensive review of the codebase for potential improvements, refactoring opportunities, and best practice implementation.',
          priority: 'medium',
          category: 'maintenance',
          estimated_hours: 4,
          rationale: 'Fallback todo to ensure at least one task is always generated.',
          source: 'fallback-forced'
        }];
      }

      await this.recordStep(state.executionId, 'generate_todos', {
        todos_generated: todos.length,
        high_priority_count: todos.filter(t => t.priority === 'high').length,
        categories: [...new Set(todos.map(t => t.category))],
        used_fallback: todos.some(t => t.source === 'fallback')
      });

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'prioritizeTodos',
        todos,
        context: {
          ...state.context,
          phase: 'todo_generation'
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async prioritizeTodosNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('⚡ Prioritizing and optimizing todo recommendations...');
      
      const prioritizedTodos = state.todos.map((todo: any, index: number) => ({
        ...todo,
        order: index + 1,
        impact_score: this.calculateImpactScore(todo, state.analysis),
        urgency_score: this.calculateUrgencyScore(todo, state.analysis)
      })).sort((a: any, b: any) => {
        // Sort by priority, then by impact score
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return b.impact_score - a.impact_score;
      });

      await this.recordStep(state.executionId, 'prioritize_todos', {
        final_todo_count: prioritizedTodos.length,
        urgent_count: prioritizedTodos.filter((t: any) => t.priority === 'urgent').length,
        high_impact_count: prioritizedTodos.filter((t: any) => t.impact_score > 7).length
      });

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'saveTodos',
        todos: prioritizedTodos,
        context: {
          ...state.context,
          phase: 'prioritization'
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async saveTodosNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('💾 Saving generated todos to database...');
      
      const repository = state.context.repository;
      
      // Create todo list
      const { data: todoList, error: listError } = await db
        .from('todo_lists')
        .insert({
          user_id: state.userId,
          repository_id: state.repositoryId,
          title: `AI Analysis - ${repository.name}`,
          description: `Comprehensive analysis-based improvements for ${repository.name}. Generated ${new Date().toLocaleDateString()}`,
          category: 'ai_analysis',
          priority: 'high',
          status: 'active',
          auto_generated: true
        })
        .select()
        .single();

      if (listError) {
        throw new Error(`Failed to create todo list: ${listError.message}`);
      }

      // Create todo items
      const todoItems = state.todos.map((todo: any) => ({
        todo_list_id: todoList.id,
        title: todo.title,
        description: `${todo.description}\n\n**Rationale:** ${todo.rationale}`,
        priority: todo.priority,
        completed: false,
        labels: [todo.category, 'ai-generated'],
        estimated_hours: todo.estimated_hours
      }));

      const { error: itemsError } = await db
        .from('todo_items')
        .insert(todoItems);

      if (itemsError) {
        throw new Error(`Failed to create todo items: ${itemsError.message}`);
      }

      await this.recordStep(state.executionId, 'save_todos', {
        todo_list_id: todoList.id,
        items_created: todoItems.length,
        total_estimated_hours: todoItems.reduce((sum: number, item: any) => sum + (item.estimated_hours || 0), 0)
      });

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'complete',
        context: {
          ...state.context,
          todo_list_id: todoList.id,
          phase: 'completion'
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async completeNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      const executionTime = Date.now() - state.context.startTime;
      
      // Update agent execution record
      await db
        .from('agent_executions')
        .update({
          status: 'completed',
          output_data: {
            todo_list_id: state.context.todo_list_id,
            todos_generated: state.todos.length,
            analysis: state.analysis,
            execution_summary: {
              total_steps: state.stepCount,
              execution_time_ms: executionTime,
              high_priority_todos: state.todos.filter((t: any) => t.priority === 'high').length
            }
          },
          execution_time: executionTime,
          step_count: state.stepCount
        })
        .eq('id', state.executionId);

      console.log(`✅ Todo generation completed successfully in ${executionTime}ms`);
      console.log(`📋 Generated ${state.todos.length} todos with ${state.stepCount} analysis steps`);
      console.log(`🔍 Complete node returning todos:`, state.todos.length, 'analysis keys:', Object.keys(state.analysis));

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'END',
        todos: state.todos,
        analysis: state.analysis,
        context: {
          ...state.context,
          phase: 'completed',
          todo_list_id: state.context.todo_list_id
        }
      };
    } catch (error: any) {
      return handleAgentError(state, error);
    }
  }

  private async errorNode(state: GraphState): Promise<Partial<GraphState>> {
    const executionTime = state.context.startTime ? Date.now() - state.context.startTime : 0;
    
    // Update agent execution record
    if (state.executionId) {
      await db
        .from('agent_executions')
        .update({
          status: 'failed',
          error_message: state.error?.message || 'Unknown error',
          execution_time: executionTime,
          step_count: state.stepCount
        })
        .eq('id', state.executionId);
    }

    console.error(`❌ Todo generation failed:`, state.error);
    return { nextAction: 'END' };
  }

  // Generate fallback todos based on repository analysis and recent commits
  private generateFallbackTodos(repository: any, analysis: any): any[] {
    console.log('🔧 generateFallbackTodos called with:', {
      hasRepository: !!repository,
      hasAnalysis: !!analysis,
      analysisKeys: Object.keys(analysis || {}),
      recentCommitsLength: analysis?.commits?.recent_activity?.length || 0
    });
    
    const todos = [];
    
    // Get the most recent commit for inspiration
    const recentCommits = analysis?.commits?.recent_activity || [];
    const lastCommit = recentCommits[0];
    
    console.log('🔧 Last commit:', lastCommit ? { message: lastCommit.message?.slice(0, 50), author: lastCommit.author } : 'none');
    
    // Base todo inspired by last commit
    if (lastCommit) {
      const commitMessage = lastCommit.message;
      const commitAuthor = lastCommit.author || 'team';
      
      // Analyze commit type and generate relevant follow-up
      let todoTitle = '';
      let todoDescription = '';
      let category = 'maintenance';
      let priority = 'medium';
      
      if (commitMessage.toLowerCase().includes('fix') || commitMessage.toLowerCase().includes('bug')) {
        todoTitle = 'Review and test recent bug fixes';
        todoDescription = `Following the recent fix "${commitMessage.slice(0, 80)}", ensure comprehensive testing and consider adding regression tests to prevent similar issues.`;
        category = 'testing';
        priority = 'high';
      } else if (commitMessage.toLowerCase().includes('feat') || commitMessage.toLowerCase().includes('add')) {
        todoTitle = 'Document and optimize new feature';
        todoDescription = `The recent addition "${commitMessage.slice(0, 80)}" may need documentation updates and performance optimization review.`;
        category = 'documentation';
        priority = 'medium';
      } else if (commitMessage.toLowerCase().includes('update') || commitMessage.toLowerCase().includes('upgrade')) {
        todoTitle = 'Validate recent updates';
        todoDescription = `Following the update "${commitMessage.slice(0, 80)}", verify compatibility and test all affected functionality.`;
        category = 'testing';
        priority = 'medium';
      } else {
        todoTitle = 'Follow up on recent changes';
        todoDescription = `Recent commit by ${commitAuthor}: "${commitMessage.slice(0, 100)}". Consider adding tests, documentation, or optimization opportunities.`;
        category = 'maintenance';
        priority = 'medium';
      }
      
      todos.push({
        title: todoTitle,
        description: todoDescription,
        priority,
        category,
        estimated_hours: 2,
        rationale: `Generated based on recent commit activity to ensure code quality and maintainability.`,
        source: 'fallback',
        labels: ['Git Commits', 'AI Fallback', 'Code Quality']
      });
    }
    
    // Add repository-specific todos based on analysis
    const activityScore = analysis.activity_score || 0;
    const architectureScore = analysis.architecture_score || 0;
    
    // Low activity repo needs engagement
    if (activityScore < 30) {
      todos.push({
        title: 'Plan development roadmap',
        description: `Repository shows low activity (score: ${activityScore}/100). Consider creating a development roadmap, updating documentation, or planning feature improvements.`,
        priority: 'medium',
        category: 'planning',
        estimated_hours: 4,
        rationale: 'Low repository activity indicates need for strategic planning and development focus.',
        source: 'fallback',
        labels: ['Repository Analysis', 'AI Metrics', 'Project Planning']
      });
    }
    
    // Architecture improvements needed
    if (architectureScore < 60) {
      todos.push({
        title: 'Improve project structure and documentation',
        description: `Architecture score is ${architectureScore}/100. Consider adding missing documentation, tests, CI/CD setup, or improving code organization.`,
        priority: 'medium',
        category: 'architecture',
        estimated_hours: 6,
        rationale: 'Lower architecture score indicates opportunities for structural improvements.',
        source: 'fallback',
        labels: ['Code Analysis', 'AI Architecture', 'Documentation']
      });
    }
    
    // Always include at least one general improvement task
    if (todos.length === 0) {
      todos.push({
        title: 'Code review and quality improvements',
        description: `Conduct a comprehensive review of ${repository.name} for potential improvements, refactoring opportunities, and best practice implementation.`,
        priority: 'medium',
        category: 'maintenance',
        estimated_hours: 4,
        rationale: 'Regular code reviews ensure maintainability and code quality over time.',
        source: 'fallback',
        labels: ['AI General', 'Code Review', 'Best Practices']
      });
    }
    
    console.log(`✅ Generated ${todos.length} fallback todos for ${repository?.name || 'unknown repo'}`);
    console.log('🔧 Final fallback todos:', todos.map(t => ({ title: t.title, source: t.source })));
    return todos;
  }

  // Helper methods for analysis
  private async analyzeCommitPatterns(commits: any[]) {
    const commitsByAuthor = commits.reduce((acc, commit) => {
      const author = commit.author?.login || 'Unknown';
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {});

    const commitsByDay = commits.reduce((acc, commit) => {
      const day = new Date(commit.commit.author.date).toDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return {
      total: commits.length,
      contributors: Object.entries(commitsByAuthor).map(([author, count]) => ({ author, count }))
        .sort((a: any, b: any) => b.count - a.count),
      frequency: commits.length > 0 ? commits.length / 30 : 0, // commits per day
      patterns: commitsByDay,
      recent_activity: commits.slice(0, 5).map(commit => ({
        message: commit.commit.message,
        author: commit.author?.login,
        date: commit.commit.author.date
      }))
    };
  }

  private async analyzePullRequests(prs: any[]) {
    const openPrs = prs.filter(pr => pr.state === 'open');
    const mergedPrs = prs.filter(pr => pr.merged_at);
    
    return {
      total: prs.length,
      open: openPrs.length,
      merged: mergedPrs.length,
      merge_rate: prs.length > 0 ? mergedPrs.length / prs.length : 0,
      avg_days_open: this.calculateAvgDaysOpen(openPrs),
      recent_prs: prs.slice(0, 5).map(pr => ({
        title: pr.title,
        state: pr.state,
        author: pr.user.login,
        created: pr.created_at
      }))
    };
  }

  private async analyzeIssues(issues: any[]) {
    const openIssues = issues.filter(issue => issue.state === 'open');
    const closedIssues = issues.filter(issue => issue.state === 'closed');
    
    return {
      total: issues.length,
      open: openIssues.length,
      closed: closedIssues.length,
      close_rate: issues.length > 0 ? closedIssues.length / issues.length : 0,
      labeled_issues: issues.filter(issue => issue.labels.length > 0).length,
      bug_issues: issues.filter(issue => 
        issue.labels.some((label: any) => label.name.toLowerCase().includes('bug'))
      ).length
    };
  }

  private async analyzeFileStructure(contents: any[]) {
    const files = contents.filter(item => item.type === 'file');
    const directories = contents.filter(item => item.type === 'dir');
    
    const fileTypes = files.reduce((acc: any, file: any) => {
      const ext = file.name.split('.').pop() || 'no-ext';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {});

    return {
      totalFiles: files.length,
      directories: directories.length,
      fileTypes,
      importantFiles: files.filter((file: any) => 
        ['readme', 'package.json', 'dockerfile', 'makefile'].some(important => 
          file.name.toLowerCase().includes(important)
        )
      ).map((file: any) => file.name)
    };
  }

  private async checkHealthFiles(owner: string, repo: string) {
    const healthFiles = {
      hasReadme: false,
      hasTests: false,
      hasCi: false,
      hasDockerfile: false,
      packageJson: null as any
    };

    try {
      // Check for README
      try {
        await this.octokit.repos.getReadme({ owner, repo });
        healthFiles.hasReadme = true;
      } catch {}

      // Check for package.json
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: 'package.json'
        });
        
        if ('content' in data) {
          healthFiles.packageJson = JSON.parse(Buffer.from(data.content, 'base64').toString());
        }
      } catch {}

      // Check for test directories/files
      try {
        const { data: contents } = await this.octokit.repos.getContent({ owner, repo, path: '' });
        healthFiles.hasTests = Array.isArray(contents) && contents.some(item => 
          item.name.includes('test') || item.name.includes('spec') || item.name === '__tests__'
        );
      } catch {}

      // Check for CI files
      try {
        const { data } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: '.github/workflows'
        });
        healthFiles.hasCi = Array.isArray(data) && data.length > 0;
      } catch {}

      // Check for Dockerfile
      try {
        await this.octokit.repos.getContent({
          owner,
          repo,
          path: 'Dockerfile'
        });
        healthFiles.hasDockerfile = true;
      } catch {}

    } catch (error) {
      console.log('Error checking health files:', error);
    }

    return healthFiles;
  }

  private async analyzeDependencies(packageJson: any) {
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    return {
      total: Object.keys(dependencies).length + Object.keys(devDependencies).length,
      production: Object.keys(dependencies).length,
      development: Object.keys(devDependencies).length,
      scripts: Object.keys(packageJson.scripts || {}).length,
      outdated_risk: this.assessOutdatedRisk(dependencies, devDependencies)
    };
  }

  private calculateActivityScore(commits: any, prs: any, issues: any): number {
    const commitScore = Math.min(commits.frequency * 10, 40);
    const prScore = Math.min(prs.merge_rate * 20, 20);
    const issueScore = Math.min(issues.close_rate * 20, 20);
    const recentActivityScore = commits.recent_activity.length > 0 ? 20 : 0;
    
    return Math.round(commitScore + prScore + issueScore + recentActivityScore);
  }

  private calculateArchitectureScore(structure: any, health: any): number {
    let score = 0;
    
    if (health.hasReadme) score += 20;
    if (health.hasTests) score += 25;
    if (health.hasCi) score += 20;
    if (health.hasDockerfile) score += 15;
    if (health.packageJson?.scripts) score += 10;
    if (structure.directories > 2) score += 10; // Good organization
    
    return Math.min(score, 100);
  }

  private async detectDeployment(repository: any) {
    const deploymentHints = { url: null, platform: null };
    
    // Check for Vercel deployment (common pattern)
    const vercelPatterns = [
      `${repository.name}.vercel.app`,
      `${repository.name.replace('-', '')}.vercel.app`,
      `${repository.owner?.login}-${repository.name}.vercel.app`
    ];
    
    // TODO: Add actual URL checking logic
    // For now, return null as we'll implement Vercel API integration separately
    
    return deploymentHints;
  }

  private assessProductionReadiness(analysis: any, health: any): boolean {
    const score = (analysis.activity_score || 0) + (analysis.architecture_score || 0);
    return score > 120 && health.build_status === 'success' && health.deployment_status !== 'unknown';
  }

  private assessOutdatedRisk(deps: any, devDeps: any): string {
    const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;
    if (totalDeps > 50) return 'high';
    if (totalDeps > 20) return 'medium';
    return 'low';
  }

  private calculateAvgDaysOpen(prs: any[]): number {
    if (prs.length === 0) return 0;
    
    const totalDays = prs.reduce((sum, pr) => {
      const created = new Date(pr.created_at);
      const now = new Date();
      return sum + (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    
    return Math.round(totalDays / prs.length);
  }

  private calculateImpactScore(todo: any, analysis: any): number {
    let score = 5; // base score
    
    if (todo.priority === 'urgent') score += 4;
    else if (todo.priority === 'high') score += 3;
    else if (todo.priority === 'medium') score += 2;
    else score += 1;
    
    if (todo.category === 'security') score += 3;
    else if (todo.category === 'performance') score += 2;
    else if (todo.category === 'maintenance') score += 1;
    
    return Math.min(score, 10);
  }

  private calculateUrgencyScore(todo: any, analysis: any): number {
    let score = 3; // base score
    
    if (analysis.is_production_ready && todo.category === 'security') score += 4;
    if (analysis.activity_score < 50 && todo.category === 'maintenance') score += 2;
    if (analysis.architecture_score < 60) score += 1;
    
    return Math.min(score, 10);
  }

  private parseTodoResponse(content: string): any[] {
    try {
      console.log('🔍 Parsing LLM response for todos:', content.slice(0, 200));
      
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`✅ Successfully parsed ${parsed.length} todos from LLM response`);
        return parsed;
      }
      
      // Fallback: try to parse the entire content
      const parsed = JSON.parse(content);
      console.log(`✅ Successfully parsed ${parsed.length} todos from full content`);
      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse todo response, returning empty array to trigger fallback:', error);
      // Return empty array to trigger main fallback logic
      return [];
    }
  }

  private async saveTodosNode(state: GraphState): Promise<Partial<GraphState>> {
    try {
      console.log('💾 Saving generated todos to database...');
      
      if (!state.todos || state.todos.length === 0) {
        console.log('⚠️ No todos to save');
        return {
          stepCount: incrementStepCount(state.stepCount),
          nextAction: 'complete',
          context: {
            ...state.context,
            phase: 'saving-completed',
            todos_saved: 0
          }
        };
      }

      // Create todo list
      const { data: todoList, error: listError } = await db
        .from('todo_lists')
        .insert({
          user_id: state.userId,
          repository_id: state.repositoryId,
          title: `AI Generated Tasks - ${new Date().toLocaleDateString()}`,
          description: `Automatically generated tasks based on comprehensive analysis`,
          status: 'active',
          priority: 'medium'
        })
        .select()
        .single();

      if (listError || !todoList) {
        throw new Error(`Failed to create todo list: ${listError?.message}`);
      }

      console.log('✅ Created todo list:', todoList.id);

      // Save individual todo items with source labels
      const todoItems = state.todos.map((todo, index) => ({
        todo_list_id: todoList.id,
        title: todo.title,
        description: todo.description || '',
        priority: todo.priority || 'medium',
        status: 'pending',
        estimated_hours: todo.estimated_hours || null,
        labels: todo.labels || ['AI Generated', 'LangGraph', 'OpenAI GPT-4']
      }));

      const { data: savedItems, error: itemsError } = await db
        .from('todo_items')
        .insert(todoItems)
        .select();

      if (itemsError) {
        console.error('❌ Failed to save todo items:', itemsError);
        throw new Error(`Failed to save todo items: ${itemsError.message}`);
      }

      console.log(`✅ Saved ${savedItems?.length || 0} todo items`);

      return {
        stepCount: incrementStepCount(state.stepCount),
        nextAction: 'complete',
        context: {
          ...state.context,
          phase: 'saving-completed',
          todo_list_id: todoList.id,
          todos_saved: savedItems?.length || 0
        }
      };
    } catch (error: any) {
      console.error('❌ Error saving todos:', error);
      return handleAgentError(state, error);
    }
  }

  private async recordStep(executionId: string | null, stepName: string, data: any) {
    if (!executionId) return;
    
    try {
      await db
        .from('agent_steps')
        .insert({
          execution_id: executionId,
          step_name: stepName,
          step_type: 'analysis',
          output_data: data,
          status: 'completed',
          duration: 1000 // placeholder
        });
    } catch (error) {
      console.error(`Failed to record step ${stepName}:`, error);
    }
  }

  // Public execution method
  public async execute(input: {
    repositoryId: string;
    userId: string;
    context?: any;
  }): Promise<{
    success: boolean;
    todo_list_id?: string;
    todos_generated?: number;
    analysis?: any;
    execution_time?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      const compiledGraph = this.graph.compile();
      const result = await compiledGraph.invoke({
        repositoryId: input.repositoryId,
        userId: input.userId,
        context: input.context || {},
        messages: [],
        todos: [],
        analysis: {},
        stepCount: 0,
        executionId: null,
        error: null,
        nextAction: 'start'
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'Todo generation failed'
        };
      }

      console.log(`🔍 Final graph result state:`, {
        todosLength: result.todos?.length || 0,
        analysisKeys: Object.keys(result.analysis || {}),
        contextKeys: Object.keys(result.context || {}),
        hasContext: !!result.context,
        contextTodoListId: result.context?.todo_list_id
      });

      return {
        success: true,
        todo_list_id: result.context?.todo_list_id,
        todos_generated: result.todos?.length || 0,
        analysis: result.analysis || {},
        execution_time: Date.now() - startTime
      };
    } catch (error: any) {
      console.error('TodoGeneratorGraph execution error:', error);
      return {
        success: false,
        error: error.message || 'Todo generation failed'
      };
    }
  }
}

// Export singleton instance
export const todoGeneratorGraph = new TodoGeneratorGraph();
