'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Code, 
  Search, 
  GitCommit, 
  CheckCircle, 
  Zap, 
  Brain,
  FileSearch,
  GitBranch,
  Shield,
  Gauge,
  Target,
  Sparkles
} from 'lucide-react';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'active' | 'completed';
  estimatedDuration?: number;
}

interface AdvancedLoadingAnimationProps {
  isVisible: boolean;
  title: string;
  subtitle?: string;
  steps?: AnalysisStep[];
  currentStep?: string;
  progress?: number;
  className?: string;
}

export function AdvancedLoadingAnimation({ 
  isVisible, 
  title, 
  subtitle,
  steps = [],
  currentStep,
  progress = 0,
  className = "" 
}: AdvancedLoadingAnimationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isVisible || steps.length === 0) return;

    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const next = (prev + 1) % steps.length;
        if (prev < steps.length - 1) {
          setCompletedSteps(current => new Set([...current, steps[prev].id]));
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, steps]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="glass-card p-8 rounded-3xl max-w-md w-full mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              {subtitle && (
                <p className="text-gray-400 text-sm">{subtitle}</p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>

            {/* Analysis Steps */}
            {steps.length > 0 && (
              <div className="space-y-3">
                {steps.map((step, index) => {
                  const isCompleted = completedSteps.has(step.id);
                  const isActive = currentStepIndex === index;
                  const isPending = !isCompleted && !isActive;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isCompleted 
                          ? 'bg-green-500/10 border border-green-500/20'
                          : isActive 
                            ? 'bg-blue-500/10 border border-blue-500/20'
                            : 'bg-gray-500/5 border border-gray-500/10'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-600 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : isActive ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <step.icon className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <step.icon className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          isCompleted ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>

                      {isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 bg-blue-400 rounded-full"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pulsing dots animation */}
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      delay: index * 0.2 
                    }}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Predefined analysis steps for todo generation
export const TODO_GENERATION_STEPS: AnalysisStep[] = [
  {
    id: 'fetch-repository',
    title: 'Fetching Repository',
    description: 'Loading repository metadata and structure',
    icon: GitBranch,
    status: 'pending'
  },
  {
    id: 'analyze-commits',
    title: 'Analyzing Commits',
    description: 'Examining recent commits and activity patterns',
    icon: GitCommit,
    status: 'pending'
  },
  {
    id: 'scan-code-structure',
    title: 'Scanning Code Structure',
    description: 'Analyzing file structure and architecture',
    icon: FileSearch,
    status: 'pending'
  },
  {
    id: 'health-check',
    title: 'Health Assessment',
    description: 'Checking deployment status and project health',
    icon: Shield,
    status: 'pending'
  },
  {
    id: 'generate-todos',
    title: 'Generating Todos',
    description: 'AI analyzing insights to create actionable tasks',
    icon: Brain,
    status: 'pending'
  },
  {
    id: 'prioritize-tasks',
    title: 'Prioritizing Tasks',
    description: 'Ranking todos by impact and urgency',
    icon: Target,
    status: 'pending'
  }
];

// Predefined analysis steps for recap generation
export const RECAP_GENERATION_STEPS: AnalysisStep[] = [
  {
    id: 'fetch-activity',
    title: 'Fetching Activity',
    description: 'Gathering commits, issues, and pull requests',
    icon: GitCommit,
    status: 'pending'
  },
  {
    id: 'analyze-changes',
    title: 'Analyzing Changes',
    description: 'Processing code changes and contributions',
    icon: Code,
    status: 'pending'
  },
  {
    id: 'check-deployment',
    title: 'Checking Deployment',
    description: 'Verifying live deployment status and URLs',
    icon: Gauge,
    status: 'pending'
  },
  {
    id: 'generate-summary',
    title: 'Generating Summary',
    description: 'Creating comprehensive project recap',
    icon: Sparkles,
    status: 'pending'
  }
];

// Simplified loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} ${className}`}
    >
      <Loader2 className="w-full h-full text-blue-400" />
    </motion.div>
  );
}

// Pulse loading component for cards
export function PulseLoading({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-600 rounded w-3/4"></div>
        <div className="h-4 bg-gray-600 rounded w-1/2"></div>
        <div className="h-4 bg-gray-600 rounded w-5/6"></div>
      </div>
    </div>
  );
}

// Shimmer effect for loading states
export function ShimmerEffect({ className = "" }: { className?: string }) {
  return (
    <div className={`shimmer ${className}`}>
      <div className="shimmer-content bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer h-full w-full rounded" />
    </div>
  );
}
