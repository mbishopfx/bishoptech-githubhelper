'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Slack,
  Github,
  Webhook,
  Key,
  Zap,
  Settings,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  TrendingUp,
  Activity,
  Bell,
  Globe,
  Shield,
  Bot,
  Database,
  MessageSquare,
  Calendar,
  Mail,
  FileText,
  X,
  Link as LinkIcon,
  Server,
  Cloud
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  type: 'slack' | 'github' | 'email' | 'api';
  status: 'active' | 'inactive' | 'error' | 'pending';
  icon: any;
  color: string;
  configured_at?: string;
  last_activity?: string;
  settings_url?: string;
  features: string[];
  stats?: {
    requests_today: number;
    success_rate: number;
    total_events: number;
  };
}

export default function IntegrationsPage() {
  const [mounted, setMounted] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    type: '',
    name: '',
    description: '',
    userEmail: '',
    details: ''
  });

  useEffect(() => {
    setMounted(true);
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    // TODO: Implement actual API call
    // For now, using mock data
    const mockIntegrations: Integration[] = [
      {
        id: 'slack',
        name: 'Slack Bot',
        description: 'AI-powered Slack bot for repository insights and notifications',
        type: 'slack',
        status: 'active',
        icon: Slack,
        color: 'from-purple-500 to-pink-500',
        configured_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        settings_url: '/dashboard/settings#slack',
        features: ['Chat Commands', 'Repository Updates', 'Todo Notifications', 'Meeting Recaps'],
        stats: {
          requests_today: 47,
          success_rate: 98.5,
          total_events: 1234
        }
      },
      {
        id: 'github',
        name: 'GitHub API',
        description: 'Connect and analyze your GitHub repositories',
        type: 'github',
        status: 'active',
        icon: Github,
        color: 'from-gray-600 to-gray-800',
        configured_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        features: ['Repository Analysis', 'Commit Tracking', 'Issue Management', 'Pull Request Insights'],
        stats: {
          requests_today: 156,
          success_rate: 99.2,
          total_events: 3421
        }
      },
      {
        id: 'email-reports',
        name: 'Email Reports',
        description: 'Automated repository reports and notifications via email',
        type: 'email',
        status: 'active',
        icon: Mail,
        color: 'from-blue-500 to-cyan-500',
        settings_url: '/dashboard/settings#email',
        features: ['Repository Reports', 'Scheduled Emails', 'Custom Templates'],
        stats: {
          requests_today: 12,
          success_rate: 100,
          total_events: 89
        }
      },
      {
        id: 'api-keys',
        name: 'API Keys',
        description: 'Manage external API keys and authentication',
        type: 'api',
        status: 'pending',
        icon: Key,
        color: 'from-green-500 to-emerald-500',
        features: ['OpenAI Integration', 'Google APIs', 'Third-party Services'],
        stats: {
          requests_today: 89,
          success_rate: 95.1,
          total_events: 567
        }
      }
    ];
    setIntegrations(mockIntegrations);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 border-green-400';
      case 'inactive': return 'text-gray-400 border-gray-400';
      case 'error': return 'text-red-400 border-red-400';
      case 'pending': return 'text-orange-400 border-orange-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-orange-400" />;
      default: return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const categories = [
    { id: 'all', label: 'All Integrations', icon: Globe },
    { id: 'active', label: 'Active', icon: CheckCircle2 },
    { id: 'slack', label: 'Communication', icon: MessageSquare },
    { id: 'github', label: 'Development', icon: Github },
    { id: 'email', label: 'Email Reports', icon: Mail },
    { id: 'api', label: 'Authentication', icon: Key }
  ];

  const getFilteredIntegrations = () => {
    if (selectedCategory === 'all') return integrations;
    if (selectedCategory === 'active') return integrations.filter(i => i.status === 'active');
    return integrations.filter(i => i.type === selectedCategory);
  };

  const suggestedIntegrations = [
    {
      id: 'discord',
      name: 'Discord Bot',
      type: 'discord',
      description: 'Get repository updates and AI assistance in your Discord server',
      icon: MessageSquare,
      color: 'from-indigo-500 to-purple-500',
      fields: ['Bot Token', 'Channel ID'],
      popular: true
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      type: 'teams',
      description: 'Integration with Microsoft Teams for notifications and collaboration',
      icon: MessageSquare,
      color: 'from-blue-600 to-blue-800',
      fields: ['Webhook URL', 'Team ID'],
      popular: true
    },
    {
      id: 'linear',
      name: 'Linear',
      type: 'linear',
      description: 'Sync GitHub issues with Linear for better project management',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      fields: ['API Key', 'Team ID']
    },
    {
      id: 'notion',
      name: 'Notion',
      type: 'notion',
      description: 'Create automated documentation and project tracking in Notion',
      icon: Database,
      color: 'from-gray-600 to-gray-800',
      fields: ['Integration Token', 'Database ID']
    },
    {
      id: 'webhook',
      name: 'Custom Webhook',
      type: 'webhook',
      description: 'Send repository events to any custom endpoint',
      icon: Webhook,
      color: 'from-green-500 to-teal-500',
      fields: ['Webhook URL', 'Secret Token']
    },
    {
      id: 'jira',
      name: 'Jira',
      type: 'jira',
      description: 'Connect GitHub issues and pull requests with Jira tickets',
      icon: LinkIcon,
      color: 'from-blue-500 to-cyan-500',
      fields: ['API Token', 'Domain', 'Project Key']
    },
    {
      id: 'jenkins',
      name: 'Jenkins',
      type: 'jenkins',
      description: 'Trigger builds and get CI/CD pipeline notifications',
      icon: Server,
      color: 'from-orange-500 to-red-500',
      fields: ['Jenkins URL', 'API Token', 'Job Name']
    },
    {
      id: 'aws',
      name: 'AWS Services',
      type: 'aws',
      description: 'Integration with AWS services like Lambda, SNS, and CloudWatch',
      icon: Cloud,
      color: 'from-orange-600 to-yellow-600',
      fields: ['Access Key ID', 'Secret Access Key', 'Region']
    }
  ];

  const handleAddIntegration = async () => {
    if (!newIntegration.type || !newIntegration.name || !newIntegration.details) {
      alert('Please fill in the required fields (Integration Name and Details)');
      return;
    }

    try {
      // Send integration request via email
      const response = await fetch('/api/integration-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: newIntegration.type,
          name: newIntegration.name,
          description: newIntegration.description,
          userEmail: newIntegration.userEmail,
          details: newIntegration.details,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('Integration request sent successfully! We\'ll review your request and get back to you.');
        setShowAddModal(false);
        setNewIntegration({
          type: '',
          name: '',
          description: '',
          userEmail: '',
          details: ''
        });
      } else {
        alert('Failed to send integration request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending integration request:', error);
      alert('Failed to send integration request. Please try again.');
    }
  };

  const resetForm = () => {
    setNewIntegration({
      type: '',
      name: '',
      description: '',
      userEmail: '',
      details: ''
    });
    setShowAddModal(false);
  };

  if (!mounted) return null;

  const filteredIntegrations = getFilteredIntegrations();
  const activeIntegrations = integrations.filter(i => i.status === 'active').length;
  const totalRequests = integrations.reduce((sum, i) => sum + (i.stats?.requests_today || 0), 0);
  const avgSuccessRate = integrations.reduce((sum, i) => sum + (i.stats?.success_rate || 0), 0) / integrations.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
          <p className="text-gray-400">
            Manage connections to external services and APIs
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="glass-subtle px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="glass-card px-4 py-2 rounded-lg font-medium text-white hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Integration
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Active Integrations',
            value: activeIntegrations.toString(),
            icon: CheckCircle2,
            color: 'from-green-500 to-emerald-500'
          },
          {
            label: 'Total Integrations',
            value: integrations.length.toString(),
            icon: Globe,
            color: 'from-blue-500 to-cyan-500'
          },
          {
            label: 'Requests Today',
            value: totalRequests.toLocaleString(),
            icon: Activity,
            color: 'from-purple-500 to-pink-500'
          },
          {
            label: 'Success Rate',
            value: `${avgSuccessRate.toFixed(1)}%`,
            icon: TrendingUp,
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

      {/* Category Filter */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-wrap gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <category.icon className="w-4 h-4" />
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-6">
        {filteredIntegrations.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No integrations found</h3>
            <p className="text-gray-400 mb-6">
              {selectedCategory === 'all' 
                ? 'Request an integration to get started' 
                : `No ${selectedCategory} integrations configured`}
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="glass-card px-6 py-3 rounded-lg font-medium text-white hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Request Integration
            </button>
          </div>
        ) : (
          filteredIntegrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${integration.color}`}>
                    <integration.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {integration.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <span className={`text-sm px-2 py-1 rounded-full border ${getStatusColor(integration.status)}`}>
                          {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{integration.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {integration.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Configured</div>
                        <div className="text-white font-medium">
                          {formatDate(integration.configured_at)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-400">Last Activity</div>
                        <div className="text-white font-medium">
                          {formatRelativeTime(integration.last_activity)}
                        </div>
                      </div>
                      
                      {integration.stats && (
                        <>
                          <div>
                            <div className="text-gray-400">Requests Today</div>
                            <div className="text-white font-medium">
                              {integration.stats.requests_today.toLocaleString()}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-gray-400">Success Rate</div>
                            <div className="text-green-400 font-medium">
                              {integration.stats.success_rate.toFixed(1)}%
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {integration.settings_url && (
                    <Link
                      href={integration.settings_url}
                      className="p-2 glass-subtle rounded-lg hover:bg-blue-500/20 transition-colors group"
                      title="Configure Settings"
                    >
                      <Settings className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                    </Link>
                  )}
                  
                  {integration.type === 'email' && (
                    <button 
                      className="p-2 glass-subtle rounded-lg hover:bg-green-500/20 transition-colors group"
                      title="Generate Report"
                      onClick={() => {
                        // TODO: Implement report generation
                        alert('Report generation coming soon!');
                      }}
                    >
                      <FileText className="w-4 h-4 text-gray-400 group-hover:text-green-400" />
                    </button>
                  )}
                  
                  <button 
                    className="p-2 glass-subtle rounded-lg hover:bg-purple-500/20 transition-colors group"
                    title="View Activity"
                  >
                    <Activity className="w-4 h-4 text-gray-400 group-hover:text-purple-400" />
                  </button>
                  
                  <Link
                    href={integration.settings_url || '/dashboard/settings'}
                    className="p-2 glass-subtle rounded-lg hover:bg-orange-500/20 transition-colors group"
                    title="Edit Integration"
                  >
                    <Edit3 className="w-4 h-4 text-gray-400 group-hover:text-orange-400" />
                  </Link>
                  
                  {integration.status !== 'active' && (
                    <button 
                      className="p-2 glass-subtle rounded-lg hover:bg-red-500/20 transition-colors group"
                      title="Remove Integration"
                    >
                      <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Stats Bar */}
              {integration.stats && integration.stats.requests_today > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                    <span>Today's Activity</span>
                    <span>{integration.stats.total_events.toLocaleString()} total events</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((integration.stats.requests_today / 200) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Setup Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/settings#slack"
          className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-200 block"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Slack className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Setup Slack Bot</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Connect your Slack workspace to get repository updates and AI assistance.
          </p>
          <div className="flex items-center text-blue-400 font-medium">
            Configure Slack <ExternalLink className="w-4 h-4 ml-2" />
          </div>
        </Link>

        <Link
          href="/dashboard/settings#email"
          className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-200 block"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Email Reports</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Generate and send automated repository reports via email with custom schedules.
          </p>
          <div className="flex items-center text-blue-400 font-medium">
            Configure Email <ExternalLink className="w-4 h-4 ml-2" />
          </div>
        </Link>

        <Link
          href="/dashboard/settings#api"
          className="glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-200 block"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
              <Key className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">API Management</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Manage API keys and authentication for external services.
          </p>
          <div className="flex items-center text-blue-400 font-medium">
            Manage Keys <ExternalLink className="w-4 h-4 ml-2" />
          </div>
        </Link>
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Request New Integration</h2>
                <p className="text-gray-400 text-sm mt-1">Tell us what integration you'd like to see implemented</p>
              </div>
              <button
                onClick={resetForm}
                className="p-2 glass-subtle rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Popular Integrations */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">Popular Integrations</h3>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Recommended</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {suggestedIntegrations
                  .filter(suggestion => suggestion.popular)
                  .map(suggestion => (
                    <button
                      key={suggestion.id}
                      onClick={() => setNewIntegration(prev => ({
                        ...prev,
                        type: suggestion.id,
                        name: suggestion.name,
                        description: suggestion.description
                      }))}
                      className={`p-4 rounded-xl border transition-all text-left ${
                        newIntegration.type === suggestion.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 glass-subtle hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${suggestion.color}`}>
                          <suggestion.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{suggestion.name}</h4>
                          <p className="text-sm text-gray-400">{suggestion.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* All Integrations */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">All Available Integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedIntegrations.map(suggestion => (
                  <button
                    key={suggestion.id}
                    onClick={() => setNewIntegration(prev => ({
                      ...prev,
                      type: suggestion.id,
                      name: suggestion.name,
                      description: suggestion.description
                    }))}
                    className={`p-3 rounded-xl border transition-all text-left ${
                      newIntegration.type === suggestion.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 glass-subtle hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${suggestion.color}`}>
                        <suggestion.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{suggestion.name}</h4>
                        <p className="text-xs text-gray-400">{suggestion.description}</p>
                      </div>
                      {suggestion.popular && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Popular</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Request Form */}
            {newIntegration.type && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 mb-8"
              >
                <h3 className="text-lg font-semibold text-white">Integration Request Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Integration Name *
                  </label>
                  <input
                    type="text"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration(prev => ({...prev, name: e.target.value}))}
                    className="w-full p-3 glass-subtle rounded-lg border border-white/10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="What would you like to call this integration?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Email (optional)
                  </label>
                  <input
                    type="email"
                    value={newIntegration.userEmail}
                    onChange={(e) => setNewIntegration(prev => ({...prev, userEmail: e.target.value}))}
                    className="w-full p-3 glass-subtle rounded-lg border border-white/10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="your@email.com (for updates on this request)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    What would you like this integration to do? *
                  </label>
                  <textarea
                    value={newIntegration.details}
                    onChange={(e) => setNewIntegration(prev => ({...prev, details: e.target.value}))}
                    className="w-full p-3 glass-subtle rounded-lg border border-white/10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="Describe the functionality you'd like to see implemented. For example: 'Send daily repository summaries to our Discord channel' or 'Sync GitHub issues with our Linear workspace'."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Context (optional)
                  </label>
                  <textarea
                    value={newIntegration.description}
                    onChange={(e) => setNewIntegration(prev => ({...prev, description: e.target.value}))}
                    className="w-full p-3 glass-subtle rounded-lg border border-white/10 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="Any additional details, requirements, or context about your use case."
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={resetForm}
                className="px-4 py-2 glass-subtle rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIntegration}
                disabled={!newIntegration.type || !newIntegration.name || !newIntegration.details}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Request Integration
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
