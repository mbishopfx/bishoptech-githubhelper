import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { createClient } from '@supabase/supabase-js';
import { AGENT_CONFIGS } from '@/lib/agents/config';
import { githubFetchTool, techStackDetectorTool, fileAnalyzerTool, codeQualityAssessorTool } from '@/lib/agents/tools';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase environment variables are not set.');
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, repositoryId, conversationId, userId } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and User ID are required' },
        { status: 400 }
      );
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Load repository context
          let repository = null;
          if (repositoryId) {
            const { data: repo, error: repoError } = await supabase
              .from('repositories')
              .select('*')
              .eq('id', repositoryId)
              .single();
            
            if (!repoError) {
              repository = repo;
            }
          }

          // Fetch real repository data using GitHub API tools
          let githubData = null;
          let fileAnalysis = null;
          let techStack = null;
          let codeQuality = null;

          if (repository && repository.html_url) {
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'status', data: 'Analyzing repository...' }) + '\n'));
            
            // Extract owner and repo from URL
            const urlParts = repository.html_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (urlParts && process.env.GITHUB_TOKEN) {
              const [, owner, repoName] = urlParts;
              const cleanRepoName = repoName.replace('.git', '');

              try {
                // Fetch repository data including files, commits, issues
                const githubResult = await githubFetchTool.func(JSON.stringify({
                  owner,
                  repo: cleanRepoName,
                  details: ['files', 'commits', 'issues', 'pulls', 'languages']
                }));
                githubData = JSON.parse(githubResult);

                if (githubData && !githubData.error) {
                  // Analyze files and tech stack
                  if (githubData.files && githubData.fileContents) {
                    const techStackResult = await techStackDetectorTool.func(JSON.stringify({
                      files: githubData.files,
                      fileContents: githubData.fileContents
                    }));
                    techStack = JSON.parse(techStackResult);

                    const fileAnalysisResult = await fileAnalyzerTool.func(JSON.stringify({
                      files: githubData.files,
                      fileContents: githubData.fileContents
                    }));
                    fileAnalysis = JSON.parse(fileAnalysisResult);

                    // Assess code quality
                    const qualityResult = await codeQualityAssessorTool.func(JSON.stringify({
                      repository: githubData.repository || repository,
                      files: githubData.files,
                      fileContents: githubData.fileContents,
                      commits: githubData.commits || [],
                      issues: githubData.issues || [],
                      pullRequests: githubData.pullRequests || []
                    }));
                    codeQuality = JSON.parse(qualityResult);
                  }
                }
              } catch (error) {
                console.warn('GitHub data fetch error:', error);
              }
            }
          }

          // Create enhanced prompt for the AI
          let enhancedPrompt = `${AGENT_CONFIGS.chat_assistant.systemPrompt}

USER QUESTION: ${message}

REPOSITORY CONTEXT:`;

          if (repository) {
            enhancedPrompt += `
Repository: ${repository.full_name}
Description: ${repository.description || 'No description available'}
Primary Language: ${repository.language || 'Not specified'}
Stars: ${repository.stars || 0} | Forks: ${repository.forks || 0} | Issues: ${repository.open_issues || 0}
Last Updated: ${repository.updated_at ? new Date(repository.updated_at).toLocaleDateString() : 'Unknown'}`;

            // Add real GitHub data if available
            if (githubData && !githubData.error) {
              if (githubData.commits && githubData.commits.length > 0) {
                enhancedPrompt += `

RECENT COMMITS (Last 10):`;
                githubData.commits.slice(0, 10).forEach((commit: any, index: number) => {
                  const date = new Date(commit.commit.author.date).toLocaleDateString();
                  enhancedPrompt += `
${index + 1}. ${commit.commit.message.split('\n')[0]} (${commit.commit.author.name}, ${date})`;
                });
              }

              if (githubData.fileContents) {
                enhancedPrompt += `

REPOSITORY FILES ANALYZED:`;
                Object.keys(githubData.fileContents).forEach((filename) => {
                  const content = githubData.fileContents[filename];
                  if (filename === 'README.md' && content) {
                    enhancedPrompt += `
README.md Content (first 500 chars): ${content.substring(0, 500)}...`;
                  } else if (filename === 'package.json' && content) {
                    enhancedPrompt += `
package.json Content: ${content}`;
                  }
                });
              }

              if (githubData.issues && githubData.issues.length > 0) {
                const openIssues = githubData.issues.filter((issue: any) => issue.state === 'open').slice(0, 5);
                if (openIssues.length > 0) {
                  enhancedPrompt += `

RECENT OPEN ISSUES:`;
                  openIssues.forEach((issue: any, index: number) => {
                    enhancedPrompt += `
${index + 1}. #${issue.number}: ${issue.title}`;
                  });
                }
              }
            }

            // Add analyzed tech stack
            if (techStack && !techStack.error) {
              enhancedPrompt += `

DETECTED TECH STACK:`;
              if (techStack.frameworks?.length > 0) {
                enhancedPrompt += `
Frameworks: ${techStack.frameworks.join(', ')}`;
              }
              if (techStack.languages?.length > 0) {
                enhancedPrompt += `
Languages: ${techStack.languages.join(', ')}`;
              }
              if (techStack.tools?.length > 0) {
                enhancedPrompt += `
Tools: ${techStack.tools.join(', ')}`;
              }
              if (techStack.databases?.length > 0) {
                enhancedPrompt += `
Databases: ${techStack.databases.join(', ')}`;
              }
            }

            // Add file analysis
            if (fileAnalysis && !fileAnalysis.error) {
              enhancedPrompt += `

REPOSITORY STRUCTURE ANALYSIS:
- Total Files: ${fileAnalysis.structure?.total_files || 'Unknown'}
- Architecture: ${fileAnalysis.patterns?.architectural_pattern || 'Unknown'}
- Folder Structure: ${fileAnalysis.patterns?.folder_structure || 'Unknown'}`;
              
              if (fileAnalysis.important_files?.length > 0) {
                enhancedPrompt += `
Important Files:`;
                fileAnalysis.important_files.slice(0, 5).forEach((file: any, index: number) => {
                  enhancedPrompt += `
${index + 1}. ${file.path} (${file.reason})`;
                });
              }
            }

            // Add code quality assessment
            if (codeQuality && !codeQuality.error) {
              enhancedPrompt += `

CODE QUALITY ASSESSMENT:
- Overall Score: ${codeQuality.overall_score}/100
- Documentation Score: ${codeQuality.documentation_score}/100
- Activity Score: ${codeQuality.activity_score}/100
- Maintenance Score: ${codeQuality.maintenance_score}/100`;
              
              if (codeQuality.recommendations?.length > 0) {
                enhancedPrompt += `
Recommendations:`;
                codeQuality.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
                  enhancedPrompt += `
${index + 1}. ${rec}`;
                });
              }
            }

            if (repository.analysis_summary) {
              enhancedPrompt += `

Previous Analysis: ${repository.analysis_summary}`;
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

          // Create streaming OpenAI client
          const llm = new ChatOpenAI({
            model: 'gpt-4o',
            temperature: 0.3,
            maxTokens: 2000,
            apiKey: process.env.OPENAI_API_KEY!,
            streaming: true,
          });

          // Send initial status
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'status', data: 'Generating response...' }) + '\n'));

          let fullResponse = '';
          
          // Stream the AI response
          const stream = await llm.stream([new HumanMessage(enhancedPrompt)]);
          
          for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'chunk', data: content }) + '\n'));
            }
          }

          // Save conversation after completion
          try {
            let finalConversationId = conversationId;

            // Create conversation if needed
            if (!conversationId && repositoryId) {
              const { data: newConversation, error: convError } = await supabase
                .from('conversations')
                .insert({
                  user_id: userId,
                  repository_id: repositoryId,
                  title: `Chat about ${repository?.name || 'Repository'}`,
                  summary: message.substring(0, 100),
                  context: {
                    focus_areas: ['general'],
                    current_task: 'chat',
                    relevant_files: [],
                    key_concepts: [],
                  },
                })
                .select()
                .single();

              if (!convError && newConversation) {
                finalConversationId = newConversation.id;
              }
            }

            // Save messages
            if (finalConversationId) {
              await Promise.all([
                supabase.from('messages').insert({
                  conversation_id: finalConversationId,
                  role: 'user',
                  content: message,
                  metadata: {
                    agent_type: 'chat_assistant',
                    sources: repositoryId ? [repositoryId] : [],
                  },
                  token_count: Math.ceil(message.length / 4),
                }),
                supabase.from('messages').insert({
                  conversation_id: finalConversationId,
                  role: 'assistant',
                  content: fullResponse,
                  metadata: {
                    agent_type: 'chat_assistant',
                    sources: repositoryId ? [repositoryId] : [],
                    streaming: true,
                  },
                  token_count: Math.ceil(fullResponse.length / 4),
                })
              ]);

              // Send conversation ID
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'conversation_id', data: finalConversationId }) + '\n'));
            }

            // Send completion signal
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'complete', data: 'Response complete' }) + '\n'));
          } catch (saveError) {
            console.error('Error saving conversation:', saveError);
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', data: 'Failed to save conversation' }) + '\n'));
          }

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(JSON.stringify({ 
            type: 'error', 
            data: 'I apologize, but I encountered an error generating the response.' 
          }) + '\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat stream API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
