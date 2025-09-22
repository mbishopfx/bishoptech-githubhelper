'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Github,
  Star,
  GitFork,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Calendar,
  Code,
  Eye,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Globe,
  Lock,
  MessageCircle,
  ListTodo,
  BarChart3,
  X,
  Loader2
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  private: boolean;
  html_url: string;
  updated_at: string;
  tech_stack?: any;
}

export default function RepositoriesPage() {
  const [mounted, setMounted] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // all, public, private
  const [sortBy, setSortBy] = useState('updated'); // updated, stars, name
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    loadRepositories();
  }, []);

  useEffect(() => {
    filterRepositories();
  }, [repositories, searchTerm, selectedLanguage, selectedType, sortBy]);

  const loadRepositories = async () => {
    try {
      const response = await fetch('/api/repositories?userId=550e8400-e29b-41d4-a716-446655440000');
      const data = await response.json();
      
      if (data.success) {
        setRepositories(data.repositories || []);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAIOptions = (repository: Repository) => {
    setSelectedRepo(repository);
    setShowAIModal(true);
  };

  const handleAIAction = async (action: string) => {
    if (!selectedRepo) return;
    
    setAiActionLoading(action);
    
    try {
      switch (action) {
        case 'chat':
          // Navigate to chat with pre-selected repo
          window.location.href = `/dashboard/chat?repo=${selectedRepo.id}`;
          break;
          
        case 'todo':
          // Generate AI todo list
          const todoResponse = await fetch('/api/todos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'generate-ai',
              repositoryId: selectedRepo.id,
              userId: '550e8400-e29b-41d4-a716-446655440000'
            }),
          });

          const todoData = await todoResponse.json();
          if (todoData.success) {
            // Navigate to todos page
            window.location.href = '/dashboard/todos';
          } else {
            console.error('Todo generation failed:', todoData.error);
          }
          break;
          
        case 'recap':
          // Generate AI recap
          const recapResponse = await fetch('/api/recaps', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              repositoryId: selectedRepo.id,
              timeRange: 'month',
              userId: '550e8400-e29b-41d4-a716-446655440000'
            }),
          });

          const recapData = await recapResponse.json();
          if (recapData.success) {
            // Navigate to recaps page
            window.location.href = '/dashboard/recaps';
          } else {
            console.error('Recap generation failed:', recapData.error);
          }
          break;
          
        case 'analyze':
          // Trigger full analysis
          const analysisResponse = await fetch('/api/repositories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              repositoryId: selectedRepo.id,
              analysisType: 'full',
              userId: '550e8400-e29b-41d4-a716-446655440000'
            }),
          });

          const analysisData = await analysisResponse.json();
          if (analysisData.success) {
            // Refresh repositories to show updated analysis
            loadRepositories();
            console.log('Analysis completed:', analysisData.message);
          } else {
            console.error('Analysis failed:', analysisData.error);
          }
          break;
      }
    } catch (error) {
      console.error('Error performing AI action:', error);
    } finally {
      setAiActionLoading(null);
      setShowAIModal(false);
      setSelectedRepo(null);
    }
  };

  const filterRepositories = () => {
    let filtered = [...repositories];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by language
    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(repo => repo.language === selectedLanguage);
    }

    // Filter by type
    if (selectedType === 'public') {
      filtered = filtered.filter(repo => !repo.private);
    } else if (selectedType === 'private') {
      filtered = filtered.filter(repo => repo.private);
    }

    // Sort repositories
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return b.stars - a.stars;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    setFilteredRepos(filtered);
  };

  const getLanguages = () => {
    const languages = repositories
      .map(repo => repo.language)
      .filter(lang => lang)
      .reduce((acc: any, lang) => {
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {});
    
    return Object.entries(languages)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Repositories</h1>
          <p className="text-gray-400">
            Manage and analyze your imported GitHub repositories
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/repositories/import"
            className="glass-card px-4 py-2 rounded-lg font-medium text-white hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Import Repos
          </Link>
          
          <button className="glass-subtle px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Analyze All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Repositories',
            value: repositories.length.toString(),
            icon: Github,
            color: 'from-blue-500 to-cyan-500'
          },
          {
            label: 'Public Repos',
            value: repositories.filter(r => !r.private).length.toString(),
            icon: Globe,
            color: 'from-green-500 to-emerald-500'
          },
          {
            label: 'Private Repos',
            value: repositories.filter(r => r.private).length.toString(),
            icon: Lock,
            color: 'from-purple-500 to-pink-500'
          },
          {
            label: 'Total Stars',
            value: repositories.reduce((sum, repo) => sum + repo.stars, 0).toString(),
            icon: Star,
            color: 'from-orange-500 to-red-500'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div>
              <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-subtle rounded-lg text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="glass-subtle rounded-lg px-4 py-2 text-white bg-transparent border-0"
          >
            <option value="all">All Languages</option>
            {getLanguages().map(([lang, count]: any) => (
              <option key={lang} value={lang} className="bg-gray-800">
                {lang} ({count})
              </option>
            ))}
          </select>
          
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="glass-subtle rounded-lg px-4 py-2 text-white bg-transparent border-0"
          >
            <option value="all" className="bg-gray-800">All Repos</option>
            <option value="public" className="bg-gray-800">Public</option>
            <option value="private" className="bg-gray-800">Private</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-subtle rounded-lg px-4 py-2 text-white bg-transparent border-0"
          >
            <option value="updated" className="bg-gray-800">Recently Updated</option>
            <option value="stars" className="bg-gray-800">Most Stars</option>
            <option value="name" className="bg-gray-800">Name</option>
          </select>
        </div>
      </div>

      {/* Repository List */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading repositories...</p>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <Github className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No repositories found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your filters or import some repositories</p>
            <Link
              href="/dashboard/repositories/import"
              className="glass-card px-6 py-3 rounded-lg font-medium text-white hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Import Repositories
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRepos.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Globe className="w-4 h-4 text-green-400" />
                        )}
                        <h3 className="text-xl font-semibold text-white">{repo.name}</h3>
                      </div>
                      
                      {repo.language && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          {repo.language}
                        </span>
                      )}
                    </div>
                    
                    {repo.description && (
                      <p className="text-gray-300 mb-4 line-clamp-2">{repo.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {repo.stars}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="w-4 h-4" />
                        {repo.forks}
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {repo.open_issues}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(repo.updated_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </a>
                    
                    <button 
                      onClick={() => showAIOptions(repo)}
                      className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                      title="AI Actions"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </button>
                    
                    <Link
                      href={`/dashboard/chat?repo=${repo.id}`}
                      className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* AI Actions Modal */}
      <AnimatePresence>
        {showAIModal && selectedRepo && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowAIModal(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="glass-strong backdrop-blur-2xl rounded-2xl border border-white/20 w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">AI Actions</h2>
                    <p className="text-gray-400 text-sm">{selectedRepo.name}</p>
                  </div>
                  <button
                    onClick={() => setShowAIModal(false)}
                    className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleAIAction('chat')}
                    disabled={aiActionLoading !== null}
                    className="w-full p-4 glass-card rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center gap-4 text-left"
                  >
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">Chat with Repository</h3>
                      <p className="text-gray-400 text-sm">Ask questions about the codebase</p>
                    </div>
                    {aiActionLoading === 'chat' && (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                  </button>

                  <button
                    onClick={() => handleAIAction('todo')}
                    disabled={aiActionLoading !== null}
                    className="w-full p-4 glass-card rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center gap-4 text-left"
                  >
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      <ListTodo className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">Generate To-Do List</h3>
                      <p className="text-gray-400 text-sm">AI-powered task suggestions</p>
                    </div>
                    {aiActionLoading === 'todo' && (
                      <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                    )}
                  </button>

                  <button
                    onClick={() => handleAIAction('recap')}
                    disabled={aiActionLoading !== null}
                    className="w-full p-4 glass-card rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center gap-4 text-left"
                  >
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">Generate Recap</h3>
                      <p className="text-gray-400 text-sm">Monthly summary and insights</p>
                    </div>
                    {aiActionLoading === 'recap' && (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                  </button>

                  <button
                    onClick={() => handleAIAction('analyze')}
                    disabled={aiActionLoading !== null}
                    className="w-full p-4 glass-card rounded-xl hover:scale-[1.02] transition-all duration-200 flex items-center gap-4 text-left"
                  >
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">Full AI Analysis</h3>
                      <p className="text-gray-400 text-sm">Deep codebase analysis</p>
                    </div>
                    {aiActionLoading === 'analyze' && (
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
