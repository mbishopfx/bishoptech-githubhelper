'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Github, 
  MessageCircle, 
  Send,
  Bot,
  User,
  Loader2,
  Search,
  Star,
  GitFork,
  AlertCircle,
  Code,
  Sparkles,
  Plus,
  Filter,
  Clock,
  FileText,
  Zap
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  full_name: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  open_issues: number;
  updated_at: string;
  tech_stack?: any;
  analysis_summary?: string;
  last_analyzed?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

interface Conversation {
  id: string;
  repository_id: string;
  title: string;
  messages: ChatMessage[];
}

export default function ChatPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [mounted, setMounted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadRepositories = async () => {
    try {
      const response = await fetch('/api/repositories?userId=550e8400-e29b-41d4-a716-446655440000');
      const data = await response.json();
      
      if (data.success) {
        setRepositories(data.repositories || []);
        // If there's a repo parameter in the URL, select it
        const params = new URLSearchParams(window.location.search);
        const repoId = params.get('repo');
        if (repoId) {
          const foundRepo = data.repositories.find((r: Repository) => r.id === repoId);
          if (foundRepo) {
            setSelectedRepo(foundRepo);
          }
        }
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadRepositories();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedRepo]);

  if (!mounted) return null;

  const currentConversation = selectedRepo ? conversations[selectedRepo.id] : null;
  const currentMessages = currentConversation?.messages || [];

  const filteredRepositories = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         '';
    const matchesLanguage = filterLanguage === 'all' || repo.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });

  const languages = Array.from(new Set(repositories.map(r => r.language).filter(Boolean)));

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedRepo || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const streamingMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    // Update conversation with user message and streaming placeholder
    const conversationKey = selectedRepo.id;
    const existingMessages = conversations[conversationKey]?.messages || [];
    
    setConversations(prev => ({
      ...prev,
      [conversationKey]: {
        id: conversations[conversationKey]?.id || null, // Let backend generate UUID
        repository_id: selectedRepo.id,
        title: `Chat about ${selectedRepo.name}`,
        messages: [...existingMessages, userMessage, streamingMessage],
      },
    }));

    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          repositoryId: selectedRepo.id,
          conversationId: conversations[conversationKey]?.id,
          userId: '550e8400-e29b-41d4-a716-446655440000', // Demo user UUID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to chat stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response reader available');
      }

      let conversationId = conversations[conversationKey]?.id;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            
            switch (parsed.type) {
              case 'status':
                // Update loading message with status
                setConversations(prev => ({
                  ...prev,
                  [conversationKey]: {
                    ...prev[conversationKey],
                    messages: prev[conversationKey].messages.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: parsed.data }
                        : msg
                    ),
                  },
                }));
                break;

              case 'chunk':
                // Append chunk to the assistant message
                setConversations(prev => ({
                  ...prev,
                  [conversationKey]: {
                    ...prev[conversationKey],
                    messages: prev[conversationKey].messages.map(msg =>
                      msg.id === assistantMessageId
                        ? { 
                            ...msg, 
                            content: msg.content === 'Generating response...' ? parsed.data : msg.content + parsed.data,
                            loading: false 
                          }
                        : msg
                    ),
                  },
                }));
                break;

              case 'conversation_id':
                conversationId = parsed.data;
                setConversations(prev => ({
                  ...prev,
                  [conversationKey]: {
                    ...prev[conversationKey],
                    id: parsed.data,
                  },
                }));
                break;

              case 'complete':
                // Mark message as complete
                setConversations(prev => ({
                  ...prev,
                  [conversationKey]: {
                    ...prev[conversationKey],
                    messages: prev[conversationKey].messages.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, loading: false }
                        : msg
                    ),
                  },
                }));
                break;

              case 'error':
                setConversations(prev => ({
                  ...prev,
                  [conversationKey]: {
                    ...prev[conversationKey],
                    messages: prev[conversationKey].messages.map(msg =>
                      msg.id === assistantMessageId
                        ? { 
                            ...msg, 
                            content: parsed.data || 'I apologize, but I encountered an error.',
                            loading: false 
                          }
                        : msg
                    ),
                  },
                }));
                break;
            }
          } catch (parseError) {
            console.warn('Failed to parse streaming chunk:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Chat stream error:', error);
      
      setConversations(prev => ({
        ...prev,
        [conversationKey]: {
          ...prev[conversationKey],
          messages: prev[conversationKey].messages.map(msg =>
            msg.id === assistantMessageId
              ? { 
                  ...msg, 
                  content: 'I apologize, but I encountered an error. Please try again.',
                  loading: false 
                }
              : msg
          ),
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex rounded-2xl overflow-hidden">
      {/* Sidebar - Repository List */}
      <div className="w-1/3 glass-card backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Repositories</h2>
            <motion.button
              className="glass-subtle p-2 rounded-lg interactive"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 text-blue-400" />
            </motion.button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-subtle rounded-lg text-white placeholder-gray-400"
              />
            </div>
            
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="w-full glass-subtle rounded-lg text-white"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Repository List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {filteredRepositories.map((repo) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`glass-subtle p-4 rounded-xl cursor-pointer interactive transition-all duration-200 ${
                  selectedRepo?.id === repo.id ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''
                }`}
                onClick={() => setSelectedRepo(repo)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white truncate">{repo.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Star className="w-3 h-3" />
                    {repo.stars}
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                  {repo.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      {repo.forks}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {repo.open_issues}
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    <motion.button
                      className="p-1 glass-subtle rounded text-purple-400 hover:text-purple-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Start analysis
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Content - Chat Interface */}
      <div className="flex-1 flex flex-col glass-card">
        {selectedRepo ? (
          <>
            {/* Chat Header */}
            <div className="glass-subtle backdrop-blur-xl border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 glass-subtle rounded-xl">
                    <Github className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedRepo.name}</h2>
                    <p className="text-gray-400 text-sm">{selectedRepo.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    className="glass-subtle px-4 py-2 rounded-lg text-sm font-medium text-white interactive"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze
                  </motion.button>
                </div>
              </div>

              {/* Tech Stack Pills */}
              {selectedRepo.tech_stack && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    ...(selectedRepo.tech_stack.frameworks || []),
                    ...(selectedRepo.tech_stack.languages || []),
                    ...(selectedRepo.tech_stack.tools || []).slice(0, 3)
                  ].map((tech, index) => (
                    <span
                      key={`${tech}-${index}`}
                      className="px-2 py-1 glass-subtle rounded-full text-xs text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {currentMessages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="glass-subtle inline-flex p-6 rounded-2xl mb-4">
                      <Bot className="w-12 h-12 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Chat with {selectedRepo.name}
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Ask questions about the codebase, architecture, recent changes, or anything else you'd like to know.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 justify-center mt-6">
                      {[
                        "What's the tech stack?",
                        "Show me recent commits",
                        "Are there any open issues?",
                        "How's the code quality?",
                      ].map((suggestion) => (
                        <motion.button
                          key={suggestion}
                          className="glass-subtle px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white interactive"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentMessage(suggestion)}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  currentMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-3 max-w-2xl ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 glass-subtle rounded-lg">
                          {message.role === 'user' ? (
                            <User className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Bot className="w-5 h-5 text-purple-400" />
                          )}
                        </div>
                        
                        <div className={`glass-subtle p-4 rounded-2xl ${
                          message.role === 'user' 
                            ? 'bg-blue-500/20 border-blue-500/30' 
                            : 'bg-white/5'
                        }`}>
                          {message.loading ? (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {message.content || 'Thinking...'}
                            </div>
                          ) : (
                            <div className="text-white prose prose-invert prose-sm max-w-none
                              prose-headings:text-white prose-headings:font-bold
                              prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                              prose-p:text-white prose-p:leading-relaxed
                              prose-strong:text-blue-300 prose-strong:font-semibold
                              prose-em:text-purple-300
                              prose-code:bg-gray-800 prose-code:text-green-300 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                              prose-pre:bg-gray-900 prose-pre:text-green-300
                              prose-ul:text-white prose-ol:text-white prose-li:text-white
                              prose-blockquote:border-blue-500 prose-blockquote:text-blue-100
                              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({children}) => <h1 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-2">{children}</h1>,
                                  h2: ({children}) => <h2 className="text-lg font-bold text-white mb-2 border-b border-gray-700/50 pb-1">{children}</h2>,
                                  h3: ({children}) => <h3 className="text-base font-semibold text-white mb-2">{children}</h3>,
                                  p: ({children}) => <p className="text-white mb-3 leading-relaxed">{children}</p>,
                                  strong: ({children}) => <strong className="text-blue-300 font-semibold">{children}</strong>,
                                  em: ({children}) => <em className="text-purple-300">{children}</em>,
                                  code: ({children, className}) => {
                                    const isInline = !className;
                                    return isInline ? (
                                      <code className="bg-gray-800 text-green-300 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                                    ) : (
                                      <code className={className}>{children}</code>
                                    );
                                  },
                                  pre: ({children}) => <pre className="bg-gray-900 text-green-300 p-3 rounded-lg overflow-x-auto mb-3 font-mono text-sm">{children}</pre>,
                                  ul: ({children}) => <ul className="text-white mb-3 pl-4 space-y-1">{children}</ul>,
                                  ol: ({children}) => <ol className="text-white mb-3 pl-4 space-y-1">{children}</ol>,
                                  li: ({children}) => <li className="text-white">{children}</li>,
                                  blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 text-blue-100 italic mb-3">{children}</blockquote>,
                                  a: ({children, href}) => <a href={href} className="text-blue-400 hover:text-blue-300 underline">{children}</a>,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-400 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="glass-subtle backdrop-blur-xl border-t border-white/10 p-6">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask ${selectedRepo.name} anything...`}
                    className="w-full glass-subtle rounded-xl resize-none min-h-[44px] max-h-32"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                
                <motion.button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  className="glass-subtle p-3 rounded-xl interactive disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-blue-400" />
                  )}
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          // No Repository Selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="glass-subtle inline-flex p-8 rounded-3xl mb-6">
                <MessageCircle className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                Select a Repository
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Choose a repository from the sidebar to start chatting with your codebase using AI agents.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
