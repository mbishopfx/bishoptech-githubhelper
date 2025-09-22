'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  Key, 
  Globe, 
  Zap,
  FileText,
  MessageCircle,
  ListTodo,
  BarChart3,
  Webhook,
  Activity,
  ChevronDown,
  ChevronRight,
  Play
} from 'lucide-react';

interface ApiEndpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  category: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  example_request?: string;
  example_response?: string;
}

const apiEndpoints: ApiEndpoint[] = [
  // Status & Health
  {
    method: 'GET',
    path: '/api/v1/status',
    title: 'API Health Check',
    description: 'Check API status and service health',
    category: 'System',
    example_response: `{
  "success": true,
  "data": {
    "api": {
      "status": "healthy",
      "version": "1.0",
      "uptime": 86400
    },
    "services": {
      "database": { "status": "healthy", "latency": 45 },
      "ai": { "status": "healthy", "provider": "openai" },
      "github": { "status": "healthy", "provider": "github_api" }
    }
  }
}`
  },
  
  // Projects
  {
    method: 'GET',
    path: '/api/v1/projects',
    title: 'List Projects',
    description: 'Get all projects/repositories for the authenticated user',
    category: 'Projects',
    parameters: [
      { name: 'limit', type: 'integer', required: false, description: 'Max number of projects to return (default: 50, max: 100)' },
      { name: 'offset', type: 'integer', required: false, description: 'Number of projects to skip for pagination' },
      { name: 'search', type: 'string', required: false, description: 'Search query to filter projects by name or description' },
      { name: 'language', type: 'string', required: false, description: 'Filter projects by programming language' }
    ],
    example_response: `{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj_123",
        "name": "my-awesome-app",
        "full_name": "user/my-awesome-app",
        "description": "An awesome web application",
        "language": "TypeScript",
        "stars": 42,
        "tech_stack": { "frameworks": ["Next.js", "React"] }
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "has_more": false
    }
  }
}`
  },
  
  {
    method: 'POST',
    path: '/api/v1/projects',
    title: 'Import Project',
    description: 'Import a new project from GitHub URL',
    category: 'Projects',
    parameters: [
      { name: 'github_url', type: 'string', required: true, description: 'GitHub repository URL to import' },
      { name: 'auto_analyze', type: 'boolean', required: false, description: 'Whether to automatically analyze the project after import (default: true)' }
    ],
    example_request: `{
  "github_url": "https://github.com/user/my-awesome-app",
  "auto_analyze": true
}`,
    example_response: `{
  "success": true,
  "data": {
    "project": {
      "id": "proj_123",
      "name": "my-awesome-app",
      "full_name": "user/my-awesome-app",
      "html_url": "https://github.com/user/my-awesome-app"
    },
    "message": "Project imported successfully",
    "analysis_queued": true
  }
}`
  },
  
  // Todos
  {
    method: 'GET',
    path: '/api/v1/todos',
    title: 'List Todo Lists',
    description: 'Get todo lists for the authenticated user',
    category: 'Todos',
    parameters: [
      { name: 'project_id', type: 'string', required: false, description: 'Filter todos by specific project ID' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status (active, completed, archived)' },
      { name: 'include_items', type: 'boolean', required: false, description: 'Include todo items in response' }
    ],
    example_response: `{
  "success": true,
  "data": {
    "todo_lists": [
      {
        "id": "todo_123",
        "title": "Sprint Planning Tasks",
        "status": "active",
        "todo_items": [
          {
            "id": "item_456",
            "description": "Implement user authentication",
            "priority": "high",
            "status": "pending"
          }
        ]
      }
    ]
  }
}`
  },
  
  {
    method: 'POST',
    path: '/api/v1/todos',
    title: 'Create Todo List',
    description: 'Create a new todo list, optionally with AI generation',
    category: 'Todos',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Title of the todo list' },
      { name: 'description', type: 'string', required: false, description: 'Optional description' },
      { name: 'project_id', type: 'string', required: false, description: 'Associated project ID' },
      { name: 'ai_generate', type: 'boolean', required: false, description: 'Use AI to generate tasks (requires project_id)' },
      { name: 'context_prompt', type: 'string', required: false, description: 'Additional context for AI generation' },
      { name: 'items', type: 'array', required: false, description: 'Manual todo items to add' }
    ],
    example_request: `{
  "title": "AI Generated Tasks",
  "project_id": "proj_123",
  "ai_generate": true,
  "context_prompt": "Focus on code quality and testing improvements"
}`,
    example_response: `{
  "success": true,
  "data": {
    "todo_list": {
      "id": "todo_123",
      "title": "AI Generated Tasks",
      "todo_items": [
        {
          "description": "Add unit tests for authentication module",
          "priority": "high",
          "category": "testing"
        }
      ]
    },
    "ai_generated": true
  }
}`
  },
  
  // Recaps
  {
    method: 'POST',
    path: '/api/v1/recaps',
    title: 'Generate Recap',
    description: 'Generate an AI-powered project recap',
    category: 'Recaps',
    parameters: [
      { name: 'project_id', type: 'string', required: true, description: 'Project ID to generate recap for' },
      { name: 'period', type: 'string', required: false, description: 'Time period (daily, weekly, monthly, quarterly)' },
      { name: 'custom_context', type: 'string', required: false, description: 'Additional context for the recap' },
      { name: 'include_commits', type: 'boolean', required: false, description: 'Include commit analysis (default: true)' },
      { name: 'include_issues', type: 'boolean', required: false, description: 'Include issues analysis (default: true)' },
      { name: 'include_prs', type: 'boolean', required: false, description: 'Include PR analysis (default: true)' }
    ],
    example_request: `{
  "project_id": "proj_123",
  "period": "weekly",
  "custom_context": "Focus on performance improvements made this week"
}`,
    example_response: `{
  "success": true,
  "data": {
    "recap": {
      "id": "recap_123",
      "title": "Weekly Update - my-awesome-app",
      "summary": "## Executive Summary\\n\\nThis week showed strong development activity...",
      "key_updates": [
        "15 commits made",
        "3 issues resolved",
        "2 pull requests merged"
      ],
      "action_items": [
        "Review and prioritize next sprint tasks"
      ]
    },
    "github_data": {
      "commits": 15,
      "issues_closed": 3,
      "prs_merged": 2
    }
  }
}`
  },
  
  // AI Chat
  {
    method: 'POST',
    path: '/api/v1/ai/chat',
    title: 'Chat with AI',
    description: 'Have a conversation with the AI assistant about your projects',
    category: 'AI Assistant',
    parameters: [
      { name: 'message', type: 'string', required: true, description: 'Your message to the AI' },
      { name: 'project_id', type: 'string', required: false, description: 'Optional project context' },
      { name: 'conversation_id', type: 'string', required: false, description: 'Continue existing conversation' },
      { name: 'context', type: 'object', required: false, description: 'Additional context for the AI' }
    ],
    example_request: `{
  "message": "What are the recent changes in this project?",
  "project_id": "proj_123"
}`,
    example_response: `{
  "success": true,
  "data": {
    "response": "## Recent Changes\\n\\nBased on the latest activity...",
    "conversation_id": "conv_456",
    "execution_time": 2500
  }
}`
  },
  
  // Webhooks
  {
    method: 'POST',
    path: '/api/v1/webhooks',
    title: 'Register Webhook',
    description: 'Register a webhook endpoint for real-time notifications',
    category: 'Webhooks',
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'Webhook endpoint URL' },
      { name: 'events', type: 'array', required: true, description: 'Array of events to subscribe to' },
      { name: 'secret', type: 'string', required: false, description: 'Secret for webhook signature verification' },
      { name: 'project_id', type: 'string', required: false, description: 'Filter events to specific project' }
    ],
    example_request: `{
  "url": "https://your-app.com/webhooks/github-agent",
  "events": ["project.created", "todo.completed", "recap.generated"],
  "secret": "your-webhook-secret",
  "project_id": "proj_123"
}`,
    example_response: `{
  "success": true,
  "data": {
    "webhook": {
      "id": "webhook_789",
      "url": "https://your-app.com/webhooks/github-agent",
      "events": ["project.created", "todo.completed"]
    },
    "message": "Webhook registered successfully"
  }
}`
  }
];

const categories = ['System', 'Projects', 'Todos', 'Recaps', 'AI Assistant', 'Webhooks'];

const categoryIcons = {
  'System': Activity,
  'Projects': Code,
  'Todos': ListTodo,
  'Recaps': BarChart3,
  'AI Assistant': MessageCircle,
  'Webhooks': Webhook
};

export default function ApiDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState('System');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredEndpoints = apiEndpoints.filter(endpoint => endpoint.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="glass-card p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 glass-subtle rounded-xl">
              <Globe className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">GitHub Agent API Documentation</h1>
              <p className="text-gray-300 mt-2">
                Comprehensive API for AI-powered project management and automation
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-subtle p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Authentication</h3>
              </div>
              <p className="text-sm text-gray-300">
                Use API keys in Authorization header or X-API-Key header
              </p>
              <div className="mt-2 font-mono text-xs bg-gray-800 text-green-300 p-2 rounded">
                Authorization: Bearer gha_your_api_key_here
              </div>
            </div>

            <div className="glass-subtle p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Base URL</h3>
              </div>
              <p className="text-sm text-gray-300">
                All API requests should be made to:
              </p>
              <div className="mt-2 font-mono text-xs bg-gray-800 text-green-300 p-2 rounded">
                https://your-domain.com
              </div>
            </div>

            <div className="glass-subtle p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Rate Limits</h3>
              </div>
              <p className="text-sm text-gray-300">
                1000 requests per day, 100 per hour
              </p>
              <div className="mt-2 text-xs text-green-400">
                Check X-RateLimit headers in responses
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-white mb-4">API Categories</h3>
              <nav className="space-y-2">
                {categories.map((category) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons];
                  const count = apiEndpoints.filter(e => e.category === category).length;
                  
                  return (
                    <motion.button
                      key={category}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                        selectedCategory === category 
                          ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' 
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{category}</span>
                      </div>
                      <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                        {count}
                      </span>
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {filteredEndpoints.map((endpoint, index) => (
                  <motion.div
                    key={`${endpoint.method}-${endpoint.path}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card overflow-hidden"
                  >
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedEndpoint(
                        expandedEndpoint === `${endpoint.method}-${endpoint.path}` 
                          ? null 
                          : `${endpoint.method}-${endpoint.path}`
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                            endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                            endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                            endpoint.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {endpoint.method}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{endpoint.title}</h3>
                            <p className="text-sm text-gray-300">{endpoint.description}</p>
                            <code className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded mt-1 inline-block">
                              {endpoint.path}
                            </code>
                          </div>
                        </div>
                        
                        {expandedEndpoint === `${endpoint.method}-${endpoint.path}` ? 
                          <ChevronDown className="w-5 h-5 text-gray-400" /> :
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        }
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedEndpoint === `${endpoint.method}-${endpoint.path}` && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-white/10"
                        >
                          <div className="p-6 space-y-6">
                            {/* Parameters */}
                            {endpoint.parameters && endpoint.parameters.length > 0 && (
                              <div>
                                <h4 className="text-md font-semibold text-white mb-3">Parameters</h4>
                                <div className="space-y-3">
                                  {endpoint.parameters.map((param) => (
                                    <div key={param.name} className="glass-subtle p-3 rounded-lg">
                                      <div className="flex items-center gap-2 mb-1">
                                        <code className="text-sm font-mono text-blue-300">{param.name}</code>
                                        <span className={`px-2 py-1 text-xs rounded ${
                                          param.required ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                          {param.required ? 'required' : 'optional'}
                                        </span>
                                        <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
                                          {param.type}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-300">{param.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Example Request */}
                            {endpoint.example_request && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-md font-semibold text-white">Example Request</h4>
                                  <button
                                    onClick={() => copyToClipboard(endpoint.example_request!, `req-${endpoint.method}-${endpoint.path}`)}
                                    className="flex items-center gap-2 px-3 py-1 text-xs glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                                  >
                                    {copiedCode === `req-${endpoint.method}-${endpoint.path}` ? (
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                    Copy
                                  </button>
                                </div>
                                <pre className="bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                                  {endpoint.example_request}
                                </pre>
                              </div>
                            )}

                            {/* Example Response */}
                            {endpoint.example_response && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-md font-semibold text-white">Example Response</h4>
                                  <button
                                    onClick={() => copyToClipboard(endpoint.example_response!, `res-${endpoint.method}-${endpoint.path}`)}
                                    className="flex items-center gap-2 px-3 py-1 text-xs glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                                  >
                                    {copiedCode === `res-${endpoint.method}-${endpoint.path}` ? (
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                    Copy
                                  </button>
                                </div>
                                <pre className="bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                                  {endpoint.example_response}
                                </pre>
                              </div>
                            )}

                            {/* Try It Button */}
                            <div className="pt-4 border-t border-white/10">
                              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                                <Play className="w-4 h-4" />
                                Try this endpoint
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
