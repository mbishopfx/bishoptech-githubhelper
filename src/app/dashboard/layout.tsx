'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Github,
  MessageCircle,
  ListTodo,
  BarChart3,
  Settings,
  Home,
  Plus,
  Search,
  User,
  Menu,
  X,
  Sparkles,
  Slack,
  Zap,
  FileText,
  Clock,
  TrendingUp,
  Database,
  Webhook,
  Bot,
  ChevronDown,
  LogOut,
  Globe,
  Key
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  submenu?: NavigationItem[];
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['repositories']);
  const pathname = usePathname();

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  const navigation: NavigationItem[] = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Repositories',
      href: '/dashboard/repositories',
      icon: Github,
      submenu: [
        {
          name: 'All Repositories',
          href: '/dashboard/repositories',
          icon: Database,
        },
        {
          name: 'Import Repos',
          href: '/dashboard/repositories/import',
          icon: Plus,
        },
        {
          name: 'Analysis',
          href: '/dashboard/repositories/analysis',
          icon: Sparkles,
        }
      ]
    },
    {
      name: 'Chat',
      href: '/dashboard/chat',
      icon: MessageCircle,
    },
    {
      name: 'Todo Lists',
      href: '/dashboard/todos',
      icon: ListTodo,
      submenu: [
        {
          name: 'All Lists',
          href: '/dashboard/todos',
          icon: ListTodo,
        },
        {
          name: 'Generate Todos',
          href: '/dashboard/todos/generate',
          icon: Zap,
        }
      ]
    },
    {
      name: 'Recaps',
      href: '/dashboard/recaps',
      icon: BarChart3,
      submenu: [
        {
          name: 'All Recaps',
          href: '/dashboard/recaps',
          icon: FileText,
        },
        {
          name: 'Generate Recap',
          href: '/dashboard/recaps/generate',
          icon: TrendingUp,
        }
      ]
    },
    {
      name: 'Integrations',
      href: '/dashboard/integrations',
      icon: Slack,
      submenu: [
        {
          name: 'Slack Bot',
          href: '/dashboard/integrations/slack',
          icon: Slack,
        },
        {
          name: 'Webhooks',
          href: '/dashboard/integrations/webhooks',
          icon: Webhook,
        },
            {
              name: 'API Keys',
              href: '/dashboard/api-keys',
              icon: Key,
            }
      ]
    },
        {
          name: 'API Docs',
          href: '/dashboard/api-docs',
          icon: Globe,
        },
        {
          name: 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
        },
  ];

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-2 glass-card rounded-lg">
            <Github className="w-6 h-6 text-blue-400" />
          </div>
          <div className={`transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            <h1 className="text-lg font-bold text-white">GitHub Helper</h1>
            <p className="text-xs text-gray-400">AI Assistant</p>
          </div>
        </Link>
        
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 glass-subtle rounded-lg hover:bg-white/10 transition-colors lg:flex hidden"
        >
          <Menu className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Search */}
      <div className={`px-4 py-3 border-b border-white/10 ${!sidebarOpen && 'hidden'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search repositories..."
            className="w-full pl-10 pr-4 py-2 glass-subtle rounded-lg text-white placeholder-gray-400 text-sm"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            <div className="flex items-center">
              <Link
                href={item.href}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive(item.href)
                    ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400 shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 transition-colors ${
                    isActive(item.href) ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
                  }`} />
                  
                  <span className={`font-medium transition-all duration-200 ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}>
                    {item.name}
                  </span>
                </div>

                <div className={`flex items-center gap-2 ${!sidebarOpen && 'hidden'}`}>
                  {item.submenu && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSubmenu(item.name);
                      }}
                      className="p-0.5 hover:bg-white/10 rounded"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        expandedMenus.includes(item.name) ? 'rotate-180' : ''
                      }`} />
                    </button>
                  )}
                </div>
              </Link>
            </div>

            {/* Submenu */}
            <AnimatePresence>
              {item.submenu && expandedMenus.includes(item.name) && sidebarOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden ml-8 mt-1 space-y-1"
                >
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive(subItem.href)
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <subItem.icon className="w-4 h-4" />
                      {subItem.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`px-4 py-4 border-t border-white/10 ${!sidebarOpen && 'hidden'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Demo User</p>
              <p className="text-xs text-gray-400">demo@example.com</p>
            </div>
          </div>
          
          <button className="p-1.5 glass-subtle rounded-lg hover:bg-white/10 transition-colors">
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <motion.div
          animate={{ width: sidebarOpen ? 280 : 80 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden lg:block glass-subtle backdrop-blur-xl border-r border-white/10 h-screen sticky top-0 z-30"
        >
          <SidebarContent />
        </motion.div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 w-80 h-screen glass-strong backdrop-blur-2xl border-r border-white/20 z-50 lg:hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="p-2 glass-card rounded-lg">
                    <Github className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">GitHub Helper</h1>
                    <p className="text-xs text-gray-400">AI Assistant</p>
                  </div>
                </Link>
                
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="h-[calc(100%-80px)]">
                <SidebarContent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Top Bar */}
          <div className="glass-subtle backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors lg:hidden"
                  >
                    <Menu className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {pathname === '/dashboard' ? 'Overview' :
                       pathname.includes('repositories') ? 'Repositories' :
                       pathname.includes('chat') ? 'Chat' :
                       pathname.includes('todos') ? 'Todo Lists' :
                       pathname.includes('recaps') ? 'Recaps' :
                       pathname.includes('integrations') ? 'Integrations' :
                       pathname.includes('settings') ? 'Settings' : 'Dashboard'}
                    </h1>
                    <p className="text-gray-400">
                      {pathname === '/dashboard' ? 'Welcome to your GitHub Helper' :
                       pathname.includes('repositories') ? 'Manage and analyze your GitHub repositories' :
                       pathname.includes('chat') ? 'Chat with your repositories using AI' :
                       pathname.includes('todos') ? 'Manage your project tasks and todos' :
                       pathname.includes('recaps') ? 'Generate meeting recaps and summaries' :
                       pathname.includes('integrations') ? 'Configure Slack and other integrations' :
                       pathname.includes('settings') ? 'Configure your dashboard settings' : 'AI-powered repository management'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-6">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
