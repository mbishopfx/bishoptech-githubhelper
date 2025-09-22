'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
  GitFork,
  Lock,
  Globe,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Filter,
  Search
} from 'lucide-react';
import Link from 'next/link';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  private: boolean;
  html_url: string;
  updated_at: string;
  selected?: boolean;
}

interface ImportStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
  summary?: {
    total_found: number;
    imported: number;
    skipped: number;
    errors: number;
  };
  imported_repos?: any[];
  skipped_repos?: string[];
  errors?: any[];
}

export default function ImportRepositoriesPage() {
  const [mounted, setMounted] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // all, public, private
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    loading: false,
    error: null,
    success: false
  });
  const [loadingRepos, setLoadingRepos] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setLoadingRepos(true);
    try {
      // First, try to get repositories from the import API
      const response = await fetch('/api/repositories/import');
      const data = await response.json();
      
      if (data.success && data.summary?.total_found > 0) {
        // If we have repository data, use it
        const repoData = data.repositories || data.imported || [];
        setRepositories(repoData.map((repo: any) => ({
          id: repo.github_id || repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          language: repo.language,
          stars: repo.stars || repo.stargazers_count || 0,
          forks: repo.forks || repo.forks_count || 0,
          private: repo.private,
          html_url: repo.html_url,
          updated_at: repo.updated_at,
          selected: false
        })));
      } else {
        // If no data, show empty state
        setRepositories([]);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setRepositories([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  const importAllRepositories = async () => {
    setImportStatus({ loading: true, error: null, success: false });
    
    try {
      const response = await fetch('/api/repositories/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: '550e8400-e29b-41d4-a716-446655440000' // Demo user ID
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setImportStatus({
          loading: false,
          error: null,
          success: true,
          summary: data.summary,
          imported_repos: data.imported,
          skipped_repos: data.skipped,
          errors: data.errors
        });
        
        // Refresh the repositories list after import
        fetchRepositories();
      } else {
        setImportStatus({
          loading: false,
          error: data.error || 'Failed to import repositories',
          success: false
        });
      }
    } catch (error: any) {
      setImportStatus({
        loading: false,
        error: error.message || 'Network error occurred',
        success: false
      });
    }
  };

  const toggleRepository = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const selectAll = () => {
    const filteredRepos = getFilteredRepositories();
    const allIds = new Set(filteredRepos.map(repo => repo.id));
    setSelectedRepos(allIds);
  };

  const selectNone = () => {
    setSelectedRepos(new Set());
  };

  const getFilteredRepositories = () => {
    let filtered = repositories;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by language
    if (languageFilter !== 'all') {
      filtered = filtered.filter(repo => repo.language === languageFilter);
    }

    // Filter by type
    if (typeFilter === 'public') {
      filtered = filtered.filter(repo => !repo.private);
    } else if (typeFilter === 'private') {
      filtered = filtered.filter(repo => repo.private);
    }

    return filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  };

  const getUniqueLanguages = () => {
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

  const filteredRepositories = getFilteredRepositories();
  const languages = getUniqueLanguages();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/repositories"
            className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Import Repositories</h1>
            <p className="text-gray-400">
              Connect and import your GitHub repositories for AI analysis
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRepositories}
            disabled={loadingRepos}
            className="glass-subtle px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRepos ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={importAllRepositories}
            disabled={importStatus.loading}
            className="glass-card px-6 py-3 rounded-lg font-medium text-white hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${importStatus.loading ? 'animate-bounce' : ''}`} />
            {importStatus.loading ? 'Importing...' : 'Import All'}
          </button>
        </div>
      </div>

      {/* Import Status */}
      <AnimatePresence>
        {(importStatus.loading || importStatus.error || importStatus.success) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 rounded-2xl"
          >
            {importStatus.loading && (
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Importing Repositories</h3>
                  <p className="text-gray-400">Fetching and analyzing your GitHub repositories...</p>
                </div>
              </div>
            )}
            
            {importStatus.error && (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-1">Import Failed</h3>
                  <p className="text-gray-400">{importStatus.error}</p>
                </div>
              </div>
            )}
            
            {importStatus.success && importStatus.summary && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">Import Completed!</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 glass-subtle rounded-lg">
                      <div className="text-2xl font-bold text-white">{importStatus.summary.total_found}</div>
                      <div className="text-xs text-gray-400">Found</div>
                    </div>
                    <div className="text-center p-3 glass-subtle rounded-lg">
                      <div className="text-2xl font-bold text-green-400">{importStatus.summary.imported}</div>
                      <div className="text-xs text-gray-400">Imported</div>
                    </div>
                    <div className="text-center p-3 glass-subtle rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">{importStatus.summary.skipped}</div>
                      <div className="text-xs text-gray-400">Skipped</div>
                    </div>
                    <div className="text-center p-3 glass-subtle rounded-lg">
                      <div className="text-2xl font-bold text-red-400">{importStatus.summary.errors}</div>
                      <div className="text-xs text-gray-400">Errors</div>
                    </div>
                  </div>
                  
                  <Link
                    href="/dashboard/repositories"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
                  >
                    View Imported Repositories
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
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

      {/* Filters and Selection */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
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
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="glass-subtle rounded-lg px-4 py-2 text-white bg-transparent border-0"
          >
            <option value="all">All Languages</option>
            {languages.map(([lang, count]: any) => (
              <option key={lang} value={lang} className="bg-gray-800">
                {lang} ({count})
              </option>
            ))}
          </select>
          
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="glass-subtle rounded-lg px-4 py-2 text-white bg-transparent border-0"
          >
            <option value="all" className="bg-gray-800">All Types</option>
            <option value="public" className="bg-gray-800">Public Only</option>
            <option value="private" className="bg-gray-800">Private Only</option>
          </select>
        </div>
        
        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={selectAll}
              className="text-blue-400 hover:text-blue-300 font-medium text-sm"
            >
              Select All ({filteredRepositories.length})
            </button>
            <button
              onClick={selectNone}
              className="text-gray-400 hover:text-gray-300 font-medium text-sm"
            >
              Select None
            </button>
          </div>
          
          <div className="text-gray-400 text-sm">
            {selectedRepos.size} of {filteredRepositories.length} selected
          </div>
        </div>
      </div>

      {/* Repository List */}
      <div className="space-y-4">
        {loadingRepos ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading repositories...</p>
          </div>
        ) : filteredRepositories.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <Github className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No repositories found</h3>
            <p className="text-gray-400 mb-6">
              {repositories.length === 0 
                ? 'Connect your GitHub account to import repositories' 
                : 'Try adjusting your search filters'
              }
            </p>
            <button
              onClick={importAllRepositories}
              className="glass-card px-6 py-3 rounded-lg font-medium text-white hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {repositories.length === 0 ? 'Import Repositories' : 'Refresh Repositories'}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRepositories.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card p-6 rounded-2xl transition-all cursor-pointer ${
                  selectedRepos.has(repo.id) ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : 'hover:scale-[1.02]'
                }`}
                onClick={() => toggleRepository(repo.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-5 h-5 mt-1">
                      {selectedRepos.has(repo.id) ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {repo.private ? (
                            <Lock className="w-4 h-4 text-orange-400" />
                          ) : (
                            <Globe className="w-4 h-4 text-green-400" />
                          )}
                          <h3 className="text-lg font-semibold text-white">{repo.name}</h3>
                        </div>
                        
                        {repo.language && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-300 mb-4 line-clamp-2">
                        {repo.description || 'No description available'}
                      </p>
                      
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
                          <Clock className="w-4 h-4" />
                          {formatDate(repo.updated_at)}
                        </div>
                        {repo.private && (
                          <div className="flex items-center gap-1 text-orange-400">
                            <Lock className="w-4 h-4" />
                            Private
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar */}
      {selectedRepos.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 glass-card p-4 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">
              {selectedRepos.size} repositories selected
            </span>
            <button className="glass-card px-4 py-2 rounded-lg font-medium text-white hover:scale-105 transition-transform flex items-center gap-2">
              <Download className="w-4 h-4" />
              Import Selected
            </button>
            <button className="glass-card px-4 py-2 rounded-lg font-medium text-white hover:scale-105 transition-transform flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Analyze Selected
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
