import { NextRequest } from 'next/server';
import { withApiAuth, createApiResponse, createApiError } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o',
  temperature: 0.3,
});

/**
 * GET /api/v1/todos - List todo lists
 */
export const GET = withApiAuth(async (request: NextRequest, context: any, auth: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const include_items = searchParams.get('include_items') === 'true';

    let query = supabase
      .from('todo_lists')
      .select(include_items ? `
        *,
        repository:repositories(name, full_name),
        todo_items(*)
      ` : `
        *,
        repository:repositories(name, full_name)
      `)
      .eq('user_id', auth.user_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (project_id) {
      query = query.eq('repository_id', project_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: todoLists, error } = await query;

    if (error) {
      return createApiError('Failed to fetch todo lists', 500, 'FETCH_ERROR');
    }

    return createApiResponse({
      todo_lists: todoLists,
      total: todoLists?.length || 0
    });
  } catch (error) {
    console.error('GET /api/v1/todos error:', error);
    return createApiError('Internal server error', 500);
  }
});

/**
 * POST /api/v1/todos - Create a new todo list
 */
export const POST = withApiAuth(async (request: NextRequest, context: any, auth: any) => {
  try {
    const { 
      title, 
      description, 
      project_id, 
      items = [], 
      ai_generate = false,
      context_prompt 
    } = await request.json();

    if (!title) {
      return createApiError('title is required', 400, 'MISSING_TITLE');
    }

    // AI Generation Mode
    if (ai_generate) {
      if (!project_id) {
        return createApiError('project_id is required for AI generation', 400, 'MISSING_PROJECT');
      }

      // Fetch repository context
      const { data: repository, error: repoError } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', project_id)
        .eq('user_id', auth.user_id)
        .single();

      if (repoError || !repository) {
        return createApiError('Project not found', 404, 'PROJECT_NOT_FOUND');
      }

      // Generate AI todos
      const aiPrompt = `
You are an AI assistant specializing in project management and software development. 
Generate a comprehensive todo list for the following project:

Project: ${repository.name}
Description: ${repository.description || 'No description available'}
Tech Stack: ${JSON.stringify(repository.tech_stack)}
Context: ${context_prompt || 'General development tasks'}

Create 5-8 specific, actionable todo items that would help improve or advance this project.
Consider: code quality, documentation, testing, features, performance, security.

Return only a JSON array of objects with this structure:
[
  {
    "description": "Task description",
    "priority": "high|medium|low",
    "estimated_hours": number,
    "category": "development|testing|documentation|deployment|maintenance"
  }
]
`;

      const aiResponse = await llm.invoke([new HumanMessage(aiPrompt)]);
      let aiTodos;
      
      try {
        aiTodos = JSON.parse(aiResponse.content as string);
        if (!Array.isArray(aiTodos)) {
          throw new Error('AI response is not an array');
        }
      } catch (parseError) {
        console.error('Failed to parse AI todos:', parseError);
        return createApiError('Failed to generate AI todos', 500, 'AI_GENERATION_FAILED');
      }

      // Create todo list with AI items
      const { data: todoList, error: todoError } = await supabase
        .from('todo_lists')
        .insert({
          user_id: auth.user_id,
          repository_id: project_id,
          title: title || `AI Generated Tasks for ${repository.name}`,
          description: description || `AI-generated todo list based on project analysis`,
          status: 'active'
        })
        .select()
        .single();

      if (todoError) {
        return createApiError('Failed to create todo list', 500, 'CREATE_ERROR');
      }

      // Add AI-generated items
      const todoItems = aiTodos.map((item: any) => ({
        todo_list_id: todoList.id,
        description: item.description,
        priority: item.priority || 'medium',
        status: 'pending',
        estimated_hours: item.estimated_hours || null,
        category: item.category || 'development'
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('todo_items')
        .insert(todoItems)
        .select();

      if (itemsError) {
        console.error('Failed to create todo items:', itemsError);
      }

      return createApiResponse({
        todo_list: {
          ...todoList,
          todo_items: createdItems || []
        },
        message: 'AI-generated todo list created successfully',
        ai_generated: true
      }, 201);
    }

    // Manual Creation Mode
    const { data: todoList, error: todoError } = await supabase
      .from('todo_lists')
      .insert({
        user_id: auth.user_id,
        repository_id: project_id,
        title,
        description,
        status: 'active'
      })
      .select()
      .single();

    if (todoError) {
      return createApiError('Failed to create todo list', 500, 'CREATE_ERROR');
    }

    // Add manual items if provided
    let createdItems = [];
    if (items.length > 0) {
      const todoItems = items.map((item: any) => ({
        todo_list_id: todoList.id,
        description: item.description,
        priority: item.priority || 'medium',
        status: item.status || 'pending',
        estimated_hours: item.estimated_hours || null,
        category: item.category || 'development'
      }));

      const { data: itemsData, error: itemsError } = await supabase
        .from('todo_items')
        .insert(todoItems)
        .select();

      if (itemsError) {
        console.error('Failed to create todo items:', itemsError);
      } else {
        createdItems = itemsData || [];
      }
    }

    return createApiResponse({
      todo_list: {
        ...todoList,
        todo_items: createdItems
      },
      message: 'Todo list created successfully'
    }, 201);
  } catch (error) {
    console.error('POST /api/v1/todos error:', error);
    return createApiError('Internal server error', 500);
  }
});
