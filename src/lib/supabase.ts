import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Server-side Supabase client for App Router
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });
};

// Service role client for admin operations (server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database service class for type-safe operations
export class DatabaseService {
  private client;

  constructor(client: any = supabase) {
    this.client = client;
  }

  // User operations
  async getUser(id: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  async updateUser(id: string, updates: Partial<any>) {
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }

  // Repository operations
  async getRepositories(userId: string, activeOnly = true) {
    let query = this.client
      .from('repositories')
      .select('*')
      .eq('user_id', userId);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });
    return { data, error };
  }

  async getRepository(id: string) {
    const { data, error } = await this.client
      .from('repositories')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  async createRepository(repository: Partial<any>) {
    const { data, error } = await this.client
      .from('repositories')
      .insert(repository)
      .select()
      .single();
    
    return { data, error };
  }

  async updateRepository(id: string, updates: Partial<any>) {
    const { data, error } = await this.client
      .from('repositories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }

  // Conversation operations
  async getConversations(userId: string, repositoryId?: string) {
    let query = this.client
      .from('conversations')
      .select(`
        *,
        messages!inner(id, role, content, created_at)
      `)
      .eq('user_id', userId);

    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });
    return { data, error };
  }

  async createConversation(conversation: Partial<any>) {
    const { data, error } = await this.client
      .from('conversations')
      .insert(conversation)
      .select()
      .single();
    
    return { data, error };
  }

  async getMessages(conversationId: string) {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    return { data, error };
  }

  async addMessage(message: Partial<any>) {
    const { data, error } = await this.client
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    return { data, error };
  }

  // Todo operations
  async getTodoLists(userId: string, repositoryId?: string) {
    let query = this.client
      .from('todo_lists')
      .select(`
        *,
        todo_items!inner(*)
      `)
      .eq('user_id', userId);

    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });
    return { data, error };
  }

  async createTodoList(todoList: Partial<any>) {
    const { data, error } = await this.client
      .from('todo_lists')
      .insert(todoList)
      .select()
      .single();
    
    return { data, error };
  }

  async createTodoItems(items: Partial<any>[]) {
    const { data, error } = await this.client
      .from('todo_items')
      .insert(items)
      .select();
    
    return { data, error };
  }

  async updateTodoItem(id: string, updates: Partial<any>) {
    const { data, error } = await this.client
      .from('todo_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }

  // Recap operations
  async getRecaps(userId: string, repositoryId?: string) {
    let query = this.client
      .from('recaps')
      .select('*')
      .eq('user_id', userId);

    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  async createRecap(recap: Partial<any>) {
    const { data, error } = await this.client
      .from('recaps')
      .insert(recap)
      .select()
      .single();
    
    return { data, error };
  }

  // Agent execution operations
  async createAgentExecution(execution: Partial<any>) {
    const { data, error } = await this.client
      .from('agent_executions')
      .insert(execution)
      .select()
      .single();
    
    return { data, error };
  }

  async updateAgentExecution(id: string, updates: Partial<any>) {
    const { data, error } = await this.client
      .from('agent_executions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }

  async addAgentStep(step: Partial<any>) {
    const { data, error } = await this.client
      .from('agent_steps')
      .insert(step)
      .select()
      .single();
    
    return { data, error };
  }

  // Cache operations
  async getFromCache(repositoryId: string, cacheType: string, cacheKey: string) {
    const { data, error } = await this.client
      .from('analysis_cache')
      .select('data')
      .eq('repository_id', repositoryId)
      .eq('cache_type', cacheType)
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    return data ? { data: data.data, error: null } : { data: null, error };
  }

  async setCache(repositoryId: string, cacheType: string, cacheKey: string, data: any, ttlMinutes = 60) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    const { error } = await this.client
      .from('analysis_cache')
      .upsert({
        repository_id: repositoryId,
        cache_type: cacheType,
        cache_key: cacheKey,
        data: data,
        expires_at: expiresAt.toISOString(),
      });
    
    return { error };
  }

  // Email Settings methods
  async getEmailSettings(userId: string) {
    const { data, error } = await this.client
      .from('email_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return { data, error };
  }

  async createEmailSettings(emailSettings: any) {
    const { data, error } = await this.client
      .from('email_settings')
      .insert(emailSettings)
      .select()
      .single();
    
    return { data, error };
  }

  async updateEmailSettings(userId: string, updates: any) {
    const { data, error } = await this.client
      .from('email_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    return { data, error };
  }

  // Email Templates methods
  async getEmailTemplates(userId: string, type?: string) {
    let query = this.client
      .from('email_templates')
      .select('*')
      .eq('user_id', userId);
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  async getEmailTemplate(id: string) {
    const { data, error } = await this.client
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  async createEmailTemplate(template: any) {
    const { data, error } = await this.client
      .from('email_templates')
      .insert(template)
      .select()
      .single();
    
    return { data, error };
  }

  // Repository Reports methods
  async getRepositoryReports(userId: string, repositoryId?: string) {
    let query = this.client
      .from('repository_reports')
      .select('*')
      .eq('user_id', userId);
    
    if (repositoryId) {
      query = query.eq('repository_id', repositoryId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  async getRepositoryReport(id: string) {
    const { data, error } = await this.client
      .from('repository_reports')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  async createRepositoryReport(report: any) {
    const { data, error } = await this.client
      .from('repository_reports')
      .insert(report)
      .select()
      .single();
    
    return { data, error };
  }

  async updateRepositoryReport(id: string, updates: any) {
    const { data, error } = await this.client
      .from('repository_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }

  async deleteRepositoryReport(id: string) {
    const { error } = await this.client
      .from('repository_reports')
      .delete()
      .eq('id', id);
    
    return { error };
  }

  // Email Queue methods
  async addToEmailQueue(queueItem: any) {
    const { data, error } = await this.client
      .from('email_queue')
      .insert(queueItem)
      .select()
      .single();
    
    return { data, error };
  }

  async getEmailQueue(userId: string, status?: string) {
    let query = this.client
      .from('email_queue')
      .select('*')
      .eq('user_id', userId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  }

  async updateEmailQueueStatus(id: string, status: string, errorMessage?: string) {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    const { error } = await this.client
      .from('email_queue')
      .update(updateData)
      .eq('id', id);
    
    return { error };
  }

  // Utility methods
  async clearExpiredCache() {
    const { error } = await this.client
      .from('analysis_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    return { error };
  }
}

export const db = new DatabaseService();
