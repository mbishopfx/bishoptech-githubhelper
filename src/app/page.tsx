'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Github, 
  MessageCircle, 
  ListTodo, 
  BarChart3, 
  Settings, 
  Plus,
  Sparkles,
  Terminal,
  FileText,
  ArrowRight,
  Zap
} from 'lucide-react';

export default function Home() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Redirect to dashboard since the system is set up
    window.location.href = '/dashboard';
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading GitHub Agent Dashboard...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Github,
      title: "Repository Analysis",
      description: "Deep dive into your GitHub repos with AI-powered analysis",
      color: "from-blue-500 to-cyan-500",
      stats: "Analyze tech stack, code quality, and architecture",
    },
    {
      icon: MessageCircle,
      title: "Intelligent Chat",
      description: "Chat with your repositories using advanced AI agents",
      color: "from-purple-500 to-pink-500",
      stats: "Get instant answers about your codebase",
    },
    {
      icon: ListTodo,
      title: "Smart Todo Lists",
      description: "Generate actionable todo lists from repository analysis",
      color: "from-green-500 to-emerald-500",
      stats: "Prioritized tasks based on code insights",
    },
    {
      icon: BarChart3,
      title: "Project Recaps",
      description: "Automated summaries perfect for meetings and updates",
      color: "from-orange-500 to-red-500",
      stats: "Meeting-ready reports in seconds",
    },
  ];

  const stats = [
    { label: "Repositories Analyzed", value: "0", suffix: "" },
    { label: "AI Conversations", value: "0", suffix: "" },
    { label: "Todo Items Created", value: "0", suffix: "" },
    { label: "Hours Saved", value: "0", suffix: "+" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 animate-gradient" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
            animate={{
              y: [-20, -100, -20],
              x: [-20, 20, -20],
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-6 py-12">
        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Terminal className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">GitHub Agent Dashboard</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI-Powered
            <br />
            <span className="relative">
              Repository
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400/20 rounded-full blur-xl"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </span>
            <br />
            Intelligence
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Keep up with all your GitHub projects effortlessly. Get instant insights, 
            generate todo lists, create meeting summaries, and chat with your repositories 
            using advanced LangGraph AI agents.
          </p>
        </motion.header>

        {/* Stats */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 max-w-4xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="glass-card p-6 text-center interactive"
              whileHover={{ scale: 1.05 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
            >
              <div className="text-3xl font-bold text-white mb-2">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* Features Grid */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-6xl mx-auto mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Powerful AI Agents</h2>
            <p className="text-gray-400 text-lg">
              Multi-agent workflows powered by LangGraph and GPT-4o
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`glass-card p-8 interactive cursor-pointer relative overflow-hidden ${
                  activeCard === index ? 'ring-2 ring-blue-500/50' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                onHoverStart={() => setActiveCard(index)}
                onHoverEnd={() => setActiveCard(null)}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                {/* Background gradient */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300`}
                  style={{
                    opacity: activeCard === index ? 0.1 : 0,
                  }}
                />
                
                <div className="relative z-10">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4 text-white">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="text-sm text-gray-400 mb-6">
                    {feature.stats}
                  </div>
                  
                  <motion.div
                    className="flex items-center text-blue-400 font-medium"
                    initial={{ x: 0 }}
                    animate={{ x: activeCard === index ? 10 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="glass-strong p-12 rounded-3xl">
            <motion.div
              className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6"
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(59, 130, 246, 0.3)',
                  '0 0 40px rgba(59, 130, 246, 0.5)',
                  '0 0 20px rgba(59, 130, 246, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Ready to get started?</span>
            </motion.div>
            
            <h2 className="text-4xl font-bold mb-6">
              Connect Your GitHub & Start Analyzing
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Transform how you manage your repositories with AI-powered insights, 
              automated summaries, and intelligent project management.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="glass-card px-8 py-4 rounded-xl font-semibold text-white interactive glow flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="w-5 h-5" />
                Connect GitHub
              </motion.button>
              
              <motion.button
                className="glass-subtle px-8 py-4 rounded-xl font-semibold text-gray-300 interactive flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="w-5 h-5" />
                View Documentation
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Settings Fab */}
        <motion.button
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center text-white interactive glow z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: [
              '0 8px 32px rgba(59, 130, 246, 0.4)',
              '0 8px 32px rgba(147, 51, 234, 0.4)',
              '0 8px 32px rgba(59, 130, 246, 0.4)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Settings className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}