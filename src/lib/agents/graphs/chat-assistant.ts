import { StateGraph, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { createLLM, AGENT_CONFIGS, incrementStepCount, setNextAction, handleAgentError } from '../config';
import { allTools } from '../tools';
import { GraphState } from '@/types/database';
import { db } from '@/lib/supabase';

// Utility function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Chat Assistant Graph for repository conversations
export class ChatAssistantGraph {
  private graph: StateGraph<GraphState>;
  private llm: any;

  constructor() {
    this.llm = createLLM(AGENT_CONFIGS.chat_assistant.temperature);
    // Remove tool binding for now to fix response generation
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
    graph.addNode('load_context', this.loadContextNode.bind(this));
    graph.addNode('process_query', this.processQueryNode.bind(this));
    graph.addNode('generate_response', this.generateResponseNode.bind(this));
    graph.addNode('save_conversation', this.saveConversationNode.bind(this));

    // Define edges
    graph.setEntryPoint('start');
    graph.addEdge('start', 'load_context');
    graph.addEdge('load_context', 'process_query');
    graph.addEdge('process_query', 'generate_response');
    graph.addEdge('generate_response', 'save_conversation');
    graph.addEdge('save_conversation', END);

    return graph;
  }

  private async startNode(state: GraphState): Promise<GraphState> {
    try {
      const inputData = state.context?.input_data;
      const userMessage = inputData?.message;
      const repositoryId = inputData?.repositoryId;
      const conversationId = inputData?.conversationId;

      if (!userMessage) {
        throw new Error('User message is required');
      }

      const systemMessage = new SystemMessage(AGENT_CONFIGS.chat_assistant.systemPrompt);
      const humanMessage = new HumanMessage(userMessage);

      return {
        ...incrementStepCount(state),
        messages: [systemMessage, humanMessage],
        next_action: 'load_context',
        current_task: 'Processing user query about repository',
        context: {
          ...state.context,
          repository_id: repositoryId,
          conversation_id: conversationId,
          user_message: userMessage,
        },
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async loadContextNode(state: GraphState): Promise<GraphState> {
    try {
      const repositoryId = state.context?.repository_id;
      const conversationId = state.context?.conversation_id;
      let repository = null;
      let conversationHistory = [];
      let repositoryAnalysis = null;

      // Load repository data if provided
      if (repositoryId) {
        const { data: repo, error: repoError } = await db.getRepository(repositoryId);
        if (repoError) {
          console.warn('Could not load repository:', repoError);
        } else {
          repository = repo;
        }

        // Get cached analysis if available
        const cached = await db.getFromCache(repositoryId, 'full_analysis', 'latest');
        if (cached.data) {
          repositoryAnalysis = cached.data;
        }
      }

      // Load conversation history if provided
      if (conversationId && isValidUUID(conversationId)) {
        const { data: messages, error: msgError } = await db.getMessages(conversationId);
        if (msgError) {
          console.warn('Could not load conversation history:', msgError);
        } else {
          conversationHistory = messages?.slice(-10) || []; // Last 10 messages for context
        }
      } else if (conversationId && !isValidUUID(conversationId)) {
        console.warn(`Invalid conversation ID format: ${conversationId}. Proceeding without history.`);
      }

      return {
        ...incrementStepCount(state),
        repository: repository,
        analysis_results: {
          repository_analysis: repositoryAnalysis,
          conversation_history: conversationHistory,
        },
        next_action: 'process_query',
        current_task: 'Context loaded, processing query',
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async processQueryNode(state: GraphState): Promise<GraphState> {
    try {
      const userMessage = state.context?.user_message;
      const repository = state.repository;
      const repositoryAnalysis = state.analysis_results?.repository_analysis;
      const conversationHistory = state.analysis_results?.conversation_history || [];

      // Build context for the AI
      let contextPrompt = `
User Question: ${userMessage}

Repository Context:`;

      if (repository) {
        contextPrompt += `
Repository: ${repository.full_name}
Description: ${repository.description || 'No description'}
Language: ${repository.language || 'Not specified'}
Tech Stack: ${JSON.stringify(repository.tech_stack, null, 2)}`;

        if (repository.analysis_summary) {
          contextPrompt += `
Analysis Summary: ${repository.analysis_summary}`;
        }
      }

      if (repositoryAnalysis) {
        contextPrompt += `
Detailed Analysis Available: Yes
- Structure Analysis: ${JSON.stringify(repositoryAnalysis.structure_analysis?.insights || [], null, 2)}
- Quality Assessment: ${JSON.stringify(repositoryAnalysis.quality_assessment?.recommendations || [], null, 2)}`;
      }

      // Add conversation history for context
      if (conversationHistory.length > 0) {
        contextPrompt += `
Recent Conversation History:`;
        conversationHistory.slice(-5).forEach((msg: any, index: number) => {
          contextPrompt += `
${msg.role}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`;
        });
      }

      contextPrompt += `

Please provide a helpful, accurate response based on the repository context and analysis available. If you need more specific information about the codebase, suggest specific questions or analyses that would be helpful.`;

      // For now, skip complex GitHub API calls and focus on repository context
      let toolResults = null;

      return {
        ...incrementStepCount(state),
        analysis_results: {
          ...state.analysis_results,
          context_prompt: contextPrompt,
          tool_results: toolResults,
        },
        next_action: 'generate_response',
        current_task: 'Query processed, generating response',
      };
    } catch (error) {
      return handleAgentError(state, error as Error);
    }
  }

  private async generateResponseNode(state: GraphState): Promise<GraphState> {
    try {
      const contextPrompt = state.analysis_results?.context_prompt;
      const toolResults = state.analysis_results?.tool_results;
      const repository = state.repository;
      const userMessage = state.context?.user_message;

      // Create a comprehensive prompt for the AI
      let enhancedPrompt = `${AGENT_CONFIGS.chat_assistant.systemPrompt}

USER QUESTION: ${userMessage}

REPOSITORY CONTEXT:`;

      if (repository) {
        enhancedPrompt += `
Repository: ${repository.full_name}
Description: ${repository.description || 'No description available'}
Primary Language: ${repository.language || 'Not specified'}
Stars: ${repository.stars || 0} | Forks: ${repository.forks || 0} | Issues: ${repository.open_issues || 0}
Last Updated: ${repository.updated_at ? new Date(repository.updated_at).toLocaleDateString() : 'Unknown'}`;

        if (repository.tech_stack) {
          enhancedPrompt += `
Tech Stack: ${JSON.stringify(repository.tech_stack, null, 2)}`;
        }

        if (repository.analysis_summary) {
          enhancedPrompt += `
Previous Analysis: ${repository.analysis_summary}`;
        }
      }

      // Add tool results if available
      if (toolResults) {
        enhancedPrompt += `

RECENT GITHUB ACTIVITY:`;
        
        if (toolResults.commits && toolResults.commits.length > 0) {
          enhancedPrompt += `
Recent Commits (last 5):`;
          toolResults.commits.slice(0, 5).forEach((commit: any) => {
            enhancedPrompt += `
- ${commit.commit.message.split('\n')[0]} (by ${commit.commit.author?.name || 'Unknown'})`;
          });
        }

        if (toolResults.issues && toolResults.issues.length > 0) {
          const openIssues = toolResults.issues.filter((i: any) => i.state === 'open').slice(0, 3);
          if (openIssues.length > 0) {
            enhancedPrompt += `
Open Issues:`;
            openIssues.forEach((issue: any) => {
              enhancedPrompt += `
- #${issue.number}: ${issue.title}`;
            });
          }
        }
      }

      enhancedPrompt += `

INSTRUCTIONS:
- Provide a helpful, informative response about the repository
- Use proper Markdown formatting for better readability
- Structure your response with clear headers (##), bullet points, and code blocks
- Use **bold** for important terms and concepts
- Create organized sections for different topics
- Use bullet points and numbered lists for clarity
- If you don't have enough information, suggest ways to get more details
- Be conversational and engaging while maintaining professional formatting
- Focus on practical, actionable information

FORMAT YOUR RESPONSE WITH:
- ## Headers for main sections
- ### Subheaders for subsections  
- **Bold text** for important concepts
- Code snippets in backticks
- Bullet points for lists  
- Clear paragraph breaks for readability

Please provide a comprehensive, well-formatted response to the user's question.`;

      console.log('Chat AI Prompt:', enhancedPrompt.substring(0, 500) + '...');

      // Generate AI response with better error handling
      try {
        const response = await this.llm.invoke([
          new HumanMessage(enhancedPrompt)
        ]);

        const aiResponse = response.content || 'I apologize, but I encountered an issue generating a response.';
        console.log('AI Response received:', typeof aiResponse, aiResponse.substring(0, 200) + '...');

        const aiMessage = new AIMessage(aiResponse);

        return {
          ...incrementStepCount(state),
          messages: [...state.messages, aiMessage],
          analysis_results: {
            ...state.analysis_results,
            ai_response: aiResponse,
          },
          next_action: 'save_conversation',
          current_task: 'Response generated successfully',
        };
      } catch (llmError) {
        console.error('LLM Error:', llmError);
        
        // Fallback response with repository info
        let fallbackResponse = `I can help you with information about the **${repository?.name || 'repository'}**.`;
        
        if (repository) {
          fallbackResponse += `

This is a **${repository.language || 'multi-language'}** repository with ${repository.stars || 0} stars and ${repository.forks || 0} forks.`;
          
          if (repository.description) {
            fallbackResponse += ` ${repository.description}`;
          }
          
          fallbackResponse += `

Some things I can help you with:
- Explain the codebase structure and architecture  
- Analyze the technology stack and dependencies
- Suggest improvements and optimizations
- Help with specific technical questions
- Generate development tasks and priorities

What would you like to know more about?`;
        }

        return {
          ...incrementStepCount(state),
          messages: [...state.messages, new AIMessage(fallbackResponse)],
          analysis_results: {
            ...state.analysis_results,
            ai_response: fallbackResponse,
          },
          next_action: 'save_conversation',
          current_task: 'Fallback response generated',
        };
      }
    } catch (error) {
      console.error('Generate response error:', error);
      return handleAgentError(state, error as Error);
    }
  }

  private async saveConversationNode(state: GraphState): Promise<GraphState> {
    try {
      const conversationId = state.context?.conversation_id;
      const repositoryId = state.context?.repository_id;
      const userMessage = state.context?.user_message;
      const aiResponse = state.analysis_results?.ai_response;
      const userId = state.context?.input_data?.userId;

      if (!userId) {
        console.warn('No userId provided, skipping conversation save');
        return {
          ...incrementStepCount(state),
          next_action: 'end',
          current_task: 'Response complete (not saved)',
        };
      }

      let finalConversationId = conversationId;

      // Create conversation if it doesn't exist or if the provided ID is invalid
      if ((!conversationId || !isValidUUID(conversationId)) && repositoryId) {
        const { data: newConversation, error: convError } = await db.createConversation({
          user_id: userId,
          repository_id: repositoryId,
          title: `Chat about ${state.repository?.name || 'Repository'}`,
          summary: userMessage.substring(0, 100),
          context: {
            focus_areas: ['general'],
            current_task: 'chat',
            relevant_files: [],
            key_concepts: [],
          },
        });

        if (convError) {
          console.error('Error creating conversation:', convError);
        } else {
          finalConversationId = newConversation?.id;
        }
      }

      // Save messages
      if (finalConversationId) {
        // Save user message
        await db.addMessage({
          conversation_id: finalConversationId,
          role: 'user',
          content: userMessage,
          metadata: {
            agent_type: 'chat_assistant',
            sources: repositoryId ? [repositoryId] : [],
          },
          token_count: Math.ceil(userMessage.length / 4),
        });

        // Save AI response
        await db.addMessage({
          conversation_id: finalConversationId,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            agent_type: 'chat_assistant',
            sources: repositoryId ? [repositoryId] : [],
            tool_calls: state.analysis_results?.tool_results ? ['github_fetch'] : [],
          },
          token_count: Math.ceil(aiResponse.length / 4),
        });
      }

      return {
        ...incrementStepCount(state),
        next_action: 'end',
        current_task: 'Conversation saved',
        context: {
          ...state.context,
          conversation_id: finalConversationId,
        },
      };
    } catch (error) {
      console.error('Save conversation error:', error);
      // Don't fail the whole chat if saving fails
      return {
        ...incrementStepCount(state),
        next_action: 'end',
        current_task: 'Response complete (save error)',
      };
    }
  }

  // Public method to execute the graph
  async execute(input: Record<string, any>): Promise<any> {
    try {
      const initialState: GraphState = {
        messages: [],
        current_task: 'Starting chat conversation',
        analysis_results: {},
        next_action: 'start',
        context: {
          agent_type: 'chat_assistant',
          input_data: input,
          step_count: 0,
          start_time: Date.now(),
          max_steps: AGENT_CONFIGS.chat_assistant.maxSteps,
        },
      };

      const compiledGraph = this.graph.compile();
      const result = await compiledGraph.invoke(initialState);
      
      console.log('Chat execution result:', {
        next_action: result.next_action,
        current_task: result.current_task,
        has_ai_response: !!result.analysis_results?.ai_response,
        message_count: result.messages?.length || 0,
        step_count: result.context?.step_count || 0
      });
      
      const aiResponse = result.analysis_results?.ai_response || 'I apologize, but I encountered an issue generating a response.';
      
      return {
        success: true,
        response: aiResponse,
        conversation_id: result.context?.conversation_id,
        execution_time: Date.now() - (result.context?.start_time || Date.now()),
        steps: result.context?.step_count || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        response: 'I apologize, but I encountered an error processing your request.',
        execution_time: 0,
        steps: 0,
      };
    }
  }
}

// Export singleton instance
export const chatAssistantGraph = new ChatAssistantGraph();
