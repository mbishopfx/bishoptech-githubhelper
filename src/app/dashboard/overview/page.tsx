'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Github,
  MessageCircle,
  ListTodo,
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  Star,
  GitFork,
  AlertCircle,
  Calendar,
  Zap,
  Users,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'analysis' | 'chat' | 'todo' | 'recap';
  title: string;
  description: string;
  timestamp: Date;
  repository?: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
}

export default function Overview() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    repositories: 0,
    conversations: 0,
    todos: 0,
    recaps: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    setMounted(true);
    loadStats();
    loadRecentActivity();
  }, []);

  const loadStats = async () => {
    try {
      // Load repositories count
      const reposResponse = await fetch('/api/repositories?userId=550e8400-e29b-41d4-a716-446655440000');
      const reposData = await reposResponse.json();
      
      // Load todos count
      const todosResponse = await fetch('/api/todos?userId=550e8400-e29b-41d4-a716-446655440000');
      const todosData = await todosResponse.json();
      
      // Load recaps count
      const recapsResponse = await fetch('/api/recaps?userId=550e8400-e29b-41d4-a716-446655440000');
      const recapsData = await recapsResponse.json();
      
      setStats({
        repositories: reposData.success ? reposData.repositories?.length || 0 : 0,
        conversations: 0, // TODO: Load from conversations API when implemented
        todos: todosData.success ? todosData.todoLists?.length || 0 : 0,
        recaps: recapsData.success ? recapsData.recaps?.length || 0 : 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await fetch('/api/activities?userId=550e8400-e29b-41d4-a716-446655440000&limit=6');
      const data = await response.json();
      
      if (data.success) {
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  if (!mounted) return null;

  const quickStats: QuickStat[] = [
    {
      label: 'Repositories Analyzed',
      value: stats.repositories.toString(),
      change: stats.repositories > 0 ? 'Recently imported' : 'Ready to import',
      trend: stats.repositories > 0 ? 'up' : 'neutral',
      icon: Github,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'AI Conversations',
      value: stats.conversations.toString(),
      change: 'Chat with your repos',
      trend: 'neutral',
      icon: MessageCircle,
      color: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Todo Items Created',
      value: stats.todos.toString(),
      change: 'AI-generated tasks',
      trend: 'neutral',
      icon: ListTodo,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Hours Saved',
      value: '0+',
      change: 'Meeting-ready recaps',
      trend: 'neutral',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500'
    }
  ];


  const quickActions: QuickAction[] = [
    {
      title: 'Import Repositories',
      description: 'Connect your GitHub repositories to get started',
      href: '/dashboard/repositories/import',
      icon: Github,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Popular'
    },
    {
      title: 'Analyze Repository',
      description: 'Get AI-powered insights about your codebase',
      href: '/dashboard/repositories/analysis',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Start Chat',
      description: 'Ask questions about your repositories',
      href: '/dashboard/chat',
      icon: MessageCircle,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Generate Todos',
      description: 'Create actionable task lists from code analysis',
      href: '/dashboard/todos/generate',
      icon: ListTodo,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'repository': return Github;
      case 'analysis': return Sparkles;
      case 'chat': return MessageCircle;
      case 'todo': return ListTodo;
      case 'recap': return BarChart3;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'repository': return 'text-blue-400';
      case 'analysis': return 'text-purple-400';
      case 'chat': return 'text-green-400';
      case 'todo': return 'text-orange-400';
      case 'recap': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 rounded-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-300 text-lg mb-6">
            Here's what's happening with your repositories today.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/repositories/import"
              className="glass-card px-4 py-2 rounded-lg font-medium text-white hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Import Repositories
            </Link>
            <Link
              href="/dashboard/chat"
              className="glass-subtle px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Start Chatting
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 rounded-2xl interactive hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs ${
                stat.trend === 'up' ? 'text-green-400' : 
                stat.trend === 'down' ? 'text-orange-400' : 'text-gray-400'
              }`}>
                <TrendingUp className={`w-3 h-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
                {stat.change}
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
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Actions
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Link
                    href={action.href}
                    className="glass-card p-6 rounded-2xl interactive hover:scale-105 block relative overflow-hidden"
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${action.color} mb-4`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {action.title}
                    </h4>
                    <p className="text-gray-400 text-sm mb-4">
                      {action.description}
                    </p>
                    
                    <div className="flex items-center text-blue-400 font-medium">
                      Get Started <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Recent Activity
            </h3>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="glass-card p-4 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 glass-subtle rounded-lg flex-shrink-0">
                        <Icon className={`w-4 h-4 ${getActivityColor(activity.type)}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white mb-1">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-gray-400 mb-2">
                          {activity.description}
                        </p>
                        {activity.repository && (
                          <p className="text-xs text-blue-400 mb-2">
                            {activity.repository}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              <Link
                href="/dashboard/activity"
                className="block text-center py-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All Activity
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Repository Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-6 rounded-2xl"
      >
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Github className="w-5 h-5 text-blue-400" />
          Repository Overview
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">{stats.repositories}</div>
            <div className="text-gray-400 text-sm">Total Repositories</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{stats.repositories}</div>
            <div className="text-gray-400 text-sm">Imported & Ready</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{stats.conversations}</div>
            <div className="text-gray-400 text-sm">Active Chats</div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard/repositories"
            className="glass-card px-6 py-3 rounded-lg font-medium text-white hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            View All Repositories
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
