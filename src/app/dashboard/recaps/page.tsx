'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Plus,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Download,
  Share2,
  Edit3,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  FileText,
  Github,
  Zap,
  Copy,
  CheckCircle2,
  AlertCircle,
  Target,
  ArrowRight
} from 'lucide-react';
import { AdvancedLoadingAnimation, RECAP_GENERATION_STEPS } from '@/components/ui/loading-animations';

interface Recap {
  id: string;
  title: string;
  description: string;
  repository_id?: string;
  repository_name?: string;
  date_range: {
    start: string;
    end: string;
  };
  participants?: string[];
  summary: string;
  key_updates: string[];
  action_items: string[];
  metrics?: {
    commits: number;
    issues_closed: number;
    prs_merged: number;
    lines_changed: number;
  };
  generated_by: 'ai' | 'manual';
  created_at: string;
  updated_at: string;
}

export default function RecapsPage() {
  const [mounted, setMounted] = useState(false);
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [selectedRecap, setSelectedRecap] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, ai, manual
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [showNewRecapModal, setShowNewRecapModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadRecaps();
    loadRepositories();
  }, []);

  const loadRecaps = async () => {
    try {
      const response = await fetch('/api/recaps?userId=550e8400-e29b-41d4-a716-446655440000');
      const data = await response.json();
      
      if (data.success) {
        setRecaps(data.recaps || []);
        if (data.recaps && data.recaps.length > 0) {
          setSelectedRecap(data.recaps[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading recaps:', error);
    }
  };

  const loadRepositories = async () => {
    try {
      const response = await fetch('/api/repositories?userId=550e8400-e29b-41d4-a716-446655440000');
      const data = await response.json();
      if (data.success) {
        setRepositories(data.repositories || []);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
    }
  };

  const generateAIRecap = async (repositoryId: string, timeRange: 'week' | 'month' | 'quarter') => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress during the analysis
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev < 85) return prev + Math.random() * 12;
        return prev;
      });
    }, 1000);

    try {
      const response = await fetch('/api/recaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryId,
          timeRange,
          userId: '550e8400-e29b-41d4-a716-446655440000'
        }),
      });

      const data = await response.json();
      
      // Complete progress
      setGenerationProgress(100);
      
      if (data.success) {
        console.log('✅ AI recap generated successfully:', data.message);
        console.log('📊 Recap includes deployment info:', !!data.recap?.metrics?.deployment);
        
        // Refresh recaps to show the new one
        setTimeout(() => {
          loadRecaps();
        }, 1000);
      } else {
        console.error('Failed to generate AI recap:', data.error);
      }
    } catch (error) {
      console.error('Error generating AI recap:', error);
    } finally {
      clearInterval(progressInterval);
      // Keep loading animation visible for a moment to show completion
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 1500);
    }
  };

  const deleteRecap = (recapId: string) => {
    setRecaps(prev => prev.filter(recap => recap.id !== recapId));
    if (selectedRecap === recapId) {
      setSelectedRecap(recaps.length > 1 ? recaps.find(r => r.id !== recapId)?.id || null : null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const exportRecap = (recap: Recap, format: 'md' | 'txt' | 'pdf') => {
    // TODO: Implement export functionality
    console.log('Exporting recap:', recap.id, 'format:', format);
  };

  const getSelectedRecap = () => {
    return recaps.find(recap => recap.id === selectedRecap);
  };

  const getFilteredRecaps = () => {
    let filtered = recaps;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(recap =>
        recap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recap.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recap.repository_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(recap => recap.generated_by === filterType);
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!mounted) return null;

  const selectedRecapData = getSelectedRecap();
  const filteredRecaps = getFilteredRecaps();

  return (
    <>
      {/* Advanced Loading Animation */}
      <AdvancedLoadingAnimation
        isVisible={isGenerating}
        title="Generating Project Recap"
        subtitle="Analyzing repository activity and deployment status to create comprehensive summary"
        steps={RECAP_GENERATION_STEPS}
        progress={generationProgress}
      />
      
      <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Meeting Recaps</h1>
          <p className="text-gray-400">
            AI-generated and manual project summaries
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewRecapModal(true)}
            className="glass-subtle px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Recap
          </button>
          
          <div className="relative">
            <select
              onChange={(e) => {
                const [repoId, timeRange] = e.target.value.split(':');
                if (repoId && timeRange) {
                  generateAIRecap(repoId, timeRange as 'week' | 'month' | 'quarter');
                }
              }}
              className="glass-card px-4 py-2 rounded-lg font-medium text-white bg-transparent border-0 appearance-none pr-10"
              disabled={isGenerating}
            >
              <option value="">
                {isGenerating ? 'Generating...' : '🤖 Generate AI Recap'}
              </option>
              {repositories.map(repo => (
                <optgroup key={repo.id} label={repo.name} className="bg-gray-800">
                  <option value={`${repo.id}:week`} className="bg-gray-800">Weekly Update</option>
                  <option value={`${repo.id}:month`} className="bg-gray-800">Monthly Summary</option>
                  <option value={`${repo.id}:quarter`} className="bg-gray-800">Quarterly Review</option>
                </optgroup>
              ))}
            </select>
            <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Recaps',
            value: recaps.length.toString(),
            icon: FileText,
            color: 'from-blue-500 to-cyan-500'
          },
          {
            label: 'AI Generated',
            value: recaps.filter(r => r.generated_by === 'ai').length.toString(),
            icon: Sparkles,
            color: 'from-purple-500 to-pink-500'
          },
          {
            label: 'This Month',
            value: recaps.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length.toString(),
            icon: Calendar,
            color: 'from-green-500 to-emerald-500'
          },
          {
            label: 'Action Items',
            value: recaps.reduce((sum, recap) => sum + recap.action_items.length, 0).toString(),
            icon: Target,
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recaps Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Recaps</h3>
            </div>

            {/* Search and Filter */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recaps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 glass-subtle rounded-lg text-white placeholder-gray-400 text-sm"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full glass-subtle rounded-lg px-3 py-2 text-white bg-transparent text-sm"
              >
                <option value="all" className="bg-gray-800">All Types</option>
                <option value="ai" className="bg-gray-800">AI Generated</option>
                <option value="manual" className="bg-gray-800">Manual</option>
              </select>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredRecaps.map(recap => (
                <motion.button
                  key={recap.id}
                  onClick={() => setSelectedRecap(recap.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedRecap === recap.id
                      ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                      : 'hover:bg-white/5 text-gray-300 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{recap.title}</h4>
                    {recap.generated_by === 'ai' ? (
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <Users className="w-3 h-3 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                    {recap.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {formatDate(recap.created_at)}
                    </span>
                    {recap.repository_name && (
                      <span className="text-blue-400 text-xs">
                        {recap.repository_name}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
              
              {filteredRecaps.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm mb-3">No recaps found</p>
                  <button
                    onClick={() => setShowNewRecapModal(true)}
                    className="glass-card px-3 py-2 rounded-lg text-white text-sm hover:scale-105 transition-transform"
                  >
                    Create First Recap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recap Content */}
        <div className="lg:col-span-2">
          {selectedRecapData ? (
            <motion.div
              key={selectedRecapData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Recap Header */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedRecapData.title}
                    </h2>
                    <p className="text-gray-400 mb-4">{selectedRecapData.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedRecapData.date_range.start)} - {formatDate(selectedRecapData.date_range.end)}
                      </div>
                      
                      {selectedRecapData.participants && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {selectedRecapData.participants.length} participants
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        {selectedRecapData.generated_by === 'ai' ? (
                          <>
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-400">AI Generated</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400">Manual</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => copyToClipboard(selectedRecapData.summary)}
                      className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                      title="Copy summary"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button
                      onClick={() => exportRecap(selectedRecapData, 'md')}
                      className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                      title="Export recap"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors">
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button
                      onClick={() => deleteRecap(selectedRecapData.id)}
                      className="p-2 glass-subtle rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                
                {selectedRecapData.repository_name && (
                  <div className="flex items-center gap-2 mb-4">
                    <Github className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm">
                      {selectedRecapData.repository_name}
                    </span>
                  </div>
                )}

                {/* Metrics */}
                {selectedRecapData.metrics && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 p-4 glass-subtle rounded-xl">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {selectedRecapData.metrics.commits}
                        </div>
                        <div className="text-xs text-gray-400">Commits</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {selectedRecapData.metrics.issues_closed}
                        </div>
                        <div className="text-xs text-gray-400">Issues Closed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {selectedRecapData.metrics.prs_merged}
                        </div>
                        <div className="text-xs text-gray-400">PRs Merged</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {selectedRecapData.metrics.lines_changed.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">Lines Changed</div>
                      </div>
                    </div>

                    {/* Deployment Information */}
                    {selectedRecapData.metrics.deployment && (
                      <div className="p-4 glass-subtle rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-white">Deployment Status</h4>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedRecapData.metrics.deployment.isDeployed 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedRecapData.metrics.deployment.isDeployed ? 'Live' : 'Not Deployed'}
                          </div>
                        </div>
                        
                        {selectedRecapData.metrics.deployment.isDeployed && (
                          <div className="space-y-2">
                            {selectedRecapData.metrics.deployment.productionUrl && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Production:</span>
                                <a 
                                  href={selectedRecapData.metrics.deployment.productionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                                >
                                  {selectedRecapData.metrics.deployment.productionUrl}
                                  <ArrowRight className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            
                            {selectedRecapData.metrics.deployment.deploymentPlatform && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Platform:</span>
                                <span className="text-xs text-white">
                                  {selectedRecapData.metrics.deployment.deploymentPlatform}
                                </span>
                              </div>
                            )}

                            {selectedRecapData.metrics.deployment.lastDeployment && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Last Deploy:</span>
                                <span className="text-xs text-white">
                                  {new Date(selectedRecapData.metrics.deployment.lastDeployment.date).toLocaleDateString()}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  selectedRecapData.metrics.deployment.lastDeployment.status === 'READY'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-orange-500/20 text-orange-400'
                                }`}>
                                  {selectedRecapData.metrics.deployment.lastDeployment.status}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Summary
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {selectedRecapData.summary}
                </p>
              </div>

              {/* Key Updates */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Key Updates
                </h3>
                <div className="space-y-3">
                  {selectedRecapData.key_updates.map((update, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 glass-subtle rounded-lg"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300">{update}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Action Items
                </h3>
                <div className="space-y-3">
                  {selectedRecapData.action_items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 glass-subtle rounded-lg"
                    >
                      <ArrowRight className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300">{item}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Participants */}
              {selectedRecapData.participants && (
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participants
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecapData.participants.map((participant, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 glass-subtle rounded-full text-sm text-gray-300"
                      >
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="glass-card p-8 rounded-2xl text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a recap</h3>
              <p className="text-gray-400">
                Choose a recap from the sidebar to view its content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
