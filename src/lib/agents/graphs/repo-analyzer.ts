import { StateGraph, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createLLM, AGENT_CONFIGS, incrementStepCount, setNextAction, handleAgentError, parseAgentResponse } from '../config';
import { allTools } from '../tools';
import { GraphState } from '@/types/database';
import { db } from '@/lib/supabase';

// Repository Analyzer Graph
export class RepositoryAnalyzerGraph {
  private graph: StateGraph<GraphState>;
  private llm: any;

  constructor() {
    this.llm = createLLM(AGENT_CONFIGS.repo_analyzer.temperature);
    this.llm = this.llm.bind({ tools: allTools });
    this.graph = this.buildGraph();
  }

  private buildGraph(): StateGraph<GraphState> {
    const graph = new StateGraph<GraphState>({
      channels: {
        messages: [],
        repository: null,
        current_task: '',
        analysis_results: {},
        next_action: 'start',
        context: {},
      }
    });

    // Add nodes
    graph.addNode('start', this.startNode.bind(this));
    graph.addNode('fetch_repository', this.fetchRepositoryNode.bind(this));
    graph.addNode('analyze_structure', this.analyzeStructureNode.bind(this));
    graph.addNode('analyze_tech_stack', this.analyzeTechStackNode.bind(this));
    graph.addNode('assess_quality', this.assessQualityNode.bind(this));
    graph.addNode('synthesize_results', this.synthesizeResultsNode.bind(this));
    graph.addNode('save_analysis', this.saveAnalysisNode.bind(this));

    // Define edges
    graph.setEntryPoint('start');
    graph.addEdge('start', 'fetch_repository');
    graph.addEdge('fetch_repository', 'analyze_structure');
    graph.addEdge('analyze_structure', 'analyze_tech_stack');
    graph.addEdge('analyze_tech_stack', 'assess_quality');
    graph.addEdge('assess_quality', 'synthesize_results');
    graph.addEdge('synthesize_results', 'save_analysis');
    graph.addEdge('save_analysis', END);

    return graph;
  }

  private async startNode(state: GraphState): Promise<GraphState> {
    try {
      const systemMessage = new SystemMessage(AGENT_CONFIGS.repo_analyzer.systemPrompt);
      const humanMessage = new HumanMessage(
        `Analyze the repository: ${JSON.stringify(state.context?.input_data)}`
      );

      return {
        ...incrementStepCount(state),
        messages: [systemMessage, humanMessage],
        next_action: 'fetch_repository',
        current_task: 'Starting repository analysis',
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async fetchRepositoryNode(state: GraphState): Promise<GraphState> {
    try {
      const inputData = state.context?.input_data;
      if (!inputData?.repositoryId && !inputData?.github_url) {
        throw new Error('Repository ID or GitHub URL required');
      }

      let repository = null;
      let githubData = null;

      // Fetch from database if we have repository ID
      if (inputData.repositoryId) {
        const { data, error } = await db.getRepository(inputData.repositoryId);
        if (error) throw new Error(`Database error: ${error.message}`);
        repository = data;
      }

      // Parse GitHub URL if provided
      if (inputData.github_url || repository?.html_url) {
        const url = inputData.github_url || repository?.html_url;
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
          const [, owner, repo] = match;
          
          // Use GitHub fetch tool
          const toolInput = JSON.stringify({
            owner,
            repo: repo.replace('.git', ''),
            details: ['all']
          });

          try {
            const result = await allTools[0].func(toolInput); // githubFetchTool
            githubData = JSON.parse(result);
          } catch (toolError) {
            console.error('GitHub fetch error:', toolError);
          }
        }
      }

      const analysisResults = {
        ...state.analysis_results,
        repository_data: repository,
        github_data: githubData,
      };

      return {
        ...incrementStepCount(state),
        repository: repository,
        analysis_results: analysisResults,
        next_action: 'analyze_structure',
        current_task: 'Repository data fetched',
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async analyzeStructureNode(state: GraphState): Promise<GraphState> {
    try {
      const githubData = state.analysis_results?.github_data;
      if (!githubData) {
        throw new Error('No GitHub data available for structure analysis');
      }

      // Use file analyzer tool
      const toolInput = JSON.stringify({
        files: githubData.files || [],
        fileContents: githubData.fileContents || {},
      });

      const result = await allTools[3].func(toolInput); // fileAnalyzerTool
      const structureAnalysis = JSON.parse(result);

      const analysisResults = {
        ...state.analysis_results,
        structure_analysis: structureAnalysis,
      };

      // Add AI analysis
      const analysisPrompt = `
Based on the repository structure analysis:
${JSON.stringify(structureAnalysis, null, 2)}

Provide insights about:
1. Overall project organization and structure
2. Code architecture patterns identified
3. Development maturity indicators
4. Areas for improvement

Respond with structured insights.
      `.trim();

      const aiResponse = await this.llm.invoke([
        new SystemMessage(AGENT_CONFIGS.repo_analyzer.systemPrompt),
        new HumanMessage(analysisPrompt)
      ]);

      return {
        ...incrementStepCount(state),
        analysis_results: {
          ...analysisResults,
          structure_insights: aiResponse.content,
        },
        messages: [...state.messages, new AIMessage(aiResponse.content)],
        next_action: 'analyze_tech_stack',
        current_task: 'Repository structure analyzed',
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async analyzeTechStackNode(state: GraphState): Promise<GraphState> {
    try {
      const githubData = state.analysis_results?.github_data;
      if (!githubData) {
        throw new Error('No GitHub data available for tech stack analysis');
      }

      // Use tech stack detector tool
      const toolInput = JSON.stringify({
        files: githubData.files || [],
        fileContents: githubData.fileContents || {},
      });

      const result = await allTools[1].func(toolInput); // techStackDetectorTool
      const techStackAnalysis = JSON.parse(result);

      // Add language data from GitHub
      if (githubData.languages) {
        techStackAnalysis.github_languages = githubData.languages;
      }

      const analysisResults = {
        ...state.analysis_results,
        tech_stack: techStackAnalysis,
      };

      // Add AI insights about tech stack
      const stackPrompt = `
Analyze this technology stack:
${JSON.stringify(techStackAnalysis, null, 2)}

Provide insights about:
1. Technology choices and their appropriateness
2. Potential compatibility issues or conflicts
3. Missing tools or technologies that could help
4. Modernization opportunities
5. Security considerations

Respond with detailed technical insights.
      `.trim();

      const aiResponse = await this.llm.invoke([
        new SystemMessage(AGENT_CONFIGS.repo_analyzer.systemPrompt),
        new HumanMessage(stackPrompt)
      ]);

      return {
        ...incrementStepCount(state),
        analysis_results: {
          ...analysisResults,
          tech_stack_insights: aiResponse.content,
        },
        messages: [...state.messages, new AIMessage(aiResponse.content)],
        next_action: 'assess_quality',
        current_task: 'Tech stack analyzed',
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async assessQualityNode(state: GraphState): Promise<GraphState> {
    try {
      const githubData = state.analysis_results?.github_data;
      if (!githubData) {
        throw new Error('No GitHub data available for quality assessment');
      }

      // Use code quality assessor tool
      const toolInput = JSON.stringify({
        repository: githubData.repository || {},
        files: githubData.files || [],
        fileContents: githubData.fileContents || {},
        commits: githubData.commits || [],
        issues: githubData.issues || [],
        pullRequests: githubData.pullRequests || [],
      });

      const result = await allTools[2].func(toolInput); // codeQualityAssessorTool
      const qualityAssessment = JSON.parse(result);

      const analysisResults = {
        ...state.analysis_results,
        quality_assessment: qualityAssessment,
      };

      // Add AI insights about quality and recommendations
      const qualityPrompt = `
Based on this quality assessment:
${JSON.stringify(qualityAssessment, null, 2)}

Provide detailed analysis including:
1. Overall project health evaluation
2. Priority areas for improvement
3. Specific actionable recommendations
4. Risk assessment for the project
5. Best practices the project is following well

Respond with comprehensive quality insights.
      `.trim();

      const aiResponse = await this.llm.invoke([
        new SystemMessage(AGENT_CONFIGS.repo_analyzer.systemPrompt),
        new HumanMessage(qualityPrompt)
      ]);

      return {
        ...incrementStepCount(state),
        analysis_results: {
          ...analysisResults,
          quality_insights: aiResponse.content,
        },
        messages: [...state.messages, new AIMessage(aiResponse.content)],
        next_action: 'synthesize_results',
        current_task: 'Quality assessment completed',
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async synthesizeResultsNode(state: GraphState): Promise<GraphState> {
    try {
      const analysisResults = state.analysis_results;
      
      const synthesisPrompt = `
Synthesize all analysis results into a comprehensive repository summary:

STRUCTURE ANALYSIS:
${JSON.stringify(analysisResults?.structure_analysis, null, 2)}

TECH STACK:
${JSON.stringify(analysisResults?.tech_stack, null, 2)}

QUALITY ASSESSMENT:
${JSON.stringify(analysisResults?.quality_assessment, null, 2)}

Create a comprehensive, executive-ready summary that includes:

1. **Project Overview**: Brief description of what this repository does
2. **Architecture & Structure**: Key architectural patterns and organization
3. **Technology Stack**: Main technologies and their suitability  
4. **Health Metrics**: Overall project health with key scores
5. **Key Strengths**: What the project does well
6. **Areas for Improvement**: Priority issues to address
7. **Recommendations**: Specific, actionable next steps
8. **Risk Assessment**: Technical and maintenance risks

Format as a clear, professional report suitable for meetings and decision-making.
      `.trim();

      const aiResponse = await this.llm.invoke([
        new SystemMessage(AGENT_CONFIGS.repo_analyzer.systemPrompt),
        new HumanMessage(synthesisPrompt)
      ]);

      return {
        ...incrementStepCount(state),
        analysis_results: {
          ...analysisResults,
          comprehensive_summary: aiResponse.content,
        },
        messages: [...state.messages, new AIMessage(aiResponse.content)],
        next_action: 'save_analysis',
        current_task: 'Analysis synthesized',
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async saveAnalysisNode(state: GraphState): Promise<GraphState> {
    try {
      const repository = state.repository;
      const analysisResults = state.analysis_results;

      if (repository) {
        // Update repository with analysis results
        const updates = {
          tech_stack: analysisResults?.tech_stack || {},
          analysis_summary: analysisResults?.comprehensive_summary || '',
          last_analyzed: new Date().toISOString(),
        };

        await db.updateRepository(repository.id, updates);

        // Cache the analysis results
        if (analysisResults) {
          await db.setCache(
            repository.id,
            'full_analysis',
            'latest',
            analysisResults,
            60 * 24 // 24 hour cache
          );
        }
      }

      return {
        ...incrementStepCount(state),
        next_action: 'end',
        current_task: 'Analysis complete and saved',
        analysis_results: {
          ...analysisResults,
          status: 'completed',
          completion_time: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Save analysis error:', error);
      // Don't fail the whole analysis if saving fails
      return {
        ...incrementStepCount(state),
        next_action: 'end',
        current_task: 'Analysis complete (save error)',
        analysis_results: {
          ...state.analysis_results,
          status: 'completed_with_save_error',
          save_error: (error as Error).message,
        },
      };
    }
  }

  // Public method to execute the graph
  async execute(input: Record<string, any>): Promise<any> {
    try {
      const initialState: GraphState = {
        messages: [],
        current_task: 'Starting repository analysis',
        analysis_results: {},
        next_action: 'start',
        context: {
          agent_type: 'repo_analyzer',
          input_data: input,
          step_count: 0,
          start_time: Date.now(),
          max_steps: AGENT_CONFIGS.repo_analyzer.maxSteps,
        },
      };

      const compiledGraph = this.graph.compile();
      const result = await compiledGraph.invoke(initialState);
      
      return {
        success: true,
        results: result.analysis_results,
        messages: result.messages,
        execution_time: Date.now() - (result.context?.start_time || Date.now()),
        steps: result.context?.step_count || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        execution_time: 0,
        steps: 0,
      };
    }
  }
}

// Export singleton instance
export const repoAnalyzerGraph = new RepositoryAnalyzerGraph();
