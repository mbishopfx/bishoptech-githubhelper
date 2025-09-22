'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  Slack,
  Github,
  Key,
  Webhook,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink,
  Zap,
  Shield,
  Globe,
  Code,
  Save,
  RefreshCw,
  FileText,
  Bot,
  Mail,
  Send,
  TestTube,
  Clock,
  Calendar,
  Sparkles,
  Database,
  Lock
} from 'lucide-react';

interface SlackConfig {
  botName: string;
  appName: string;
  description: string;
  webhookUrl?: string;
  botToken?: string;
  signingSecret?: string;
  clientId?: string;
  clientSecret?: string;
  verificationToken?: string;
  features: {
    chatCommands: boolean;
    repoUpdates: boolean;
    todoNotifications: boolean;
    meetingRecaps: boolean;
    directMessages: boolean;
  };
  scopes: string[];
}

interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sender: {
    name: string;
    email: string;
  };
  templates: {
    repositoryReport: {
      enabled: boolean;
      schedule: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
    };
    alerts: {
      enabled: boolean;
      types: string[];
    };
  };
  branding: {
    logoUrl: string;
    companyName: string;
    primaryColor: string;
  };
}

interface ManifestData {
  display_information: {
    name: string;
    description: string;
    background_color: string;
  };
  features: {
    bot_user: {
      display_name: string;
      always_online: boolean;
    };
    slash_commands?: Array<{
      command: string;
      description: string;
      usage_hint: string;
    }>;
  };
  oauth_config: {
    scopes: {
      bot: string[];
    };
  };
  settings: {
    event_subscriptions: {
      request_url: string;
      bot_events: string[];
    };
    interactivity: {
      is_enabled: boolean;
      request_url: string;
    };
    org_deploy_enabled: boolean;
    socket_mode_enabled: boolean;
    token_rotation_enabled: boolean;
  };
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('slack');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string>('');
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [manifestData, setManifestData] = useState<ManifestData | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailSaveResult, setEmailSaveResult] = useState<{success: boolean, message: string} | null>(null);

  const [slackConfig, setSlackConfig] = useState<SlackConfig>({
    botName: 'GitHub Helper Bot',
    appName: 'GitHub Helper',
    description: 'AI-powered GitHub repository assistant for Slack',
    features: {
      chatCommands: true,
      repoUpdates: true,
      todoNotifications: true,
      meetingRecaps: true,
      directMessages: true,
    },
    scopes: [
      'channels:read',
      'chat:write',
      'commands',
      'im:write',
      'users:read',
      'app_mentions:read'
    ],
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'bishop@truerankdigital.com',
        pass: 'mhxy xjoa jrlx uacr'
      }
    },
    sender: {
      name: 'GitHub Helper',
      email: 'bishop@truerankdigital.com'
    },
    templates: {
      repositoryReport: {
        enabled: true,
        schedule: 'weekly',
        recipients: ['bishop@truerankdigital.com']
      },
      alerts: {
        enabled: true,
        types: ['critical-issues', 'deploy-failures', 'security-alerts']
      }
    },
    branding: {
      logoUrl: '/whitelogo.png',
      companyName: 'GitHub Helper',
      primaryColor: '#3b82f6'
    }
  });

  const [webhookUrl, setWebhookUrl] = useState<string>('https://your-domain.vercel.app/api/slack/events');

  useEffect(() => {
    setMounted(true);
    
    // Set webhook URL after component mounts (client-side only)
    if (typeof window !== 'undefined') {
      const url = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api/slack/events'
        : `${window.location.origin}/api/slack/events`;
      setWebhookUrl(url);
    }
    
    // TODO: Load existing settings from API
  }, []);

  if (!mounted) return null;

  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateManifest = () => {
    setIsGeneratingManifest(true);
    
    const manifest: ManifestData = {
      display_information: {
        name: slackConfig.appName,
        description: slackConfig.description,
        background_color: "#1e293b"
      },
      features: {
        bot_user: {
          display_name: slackConfig.botName,
          always_online: true
        }
      },
      oauth_config: {
        scopes: {
          bot: slackConfig.scopes
        }
      },
      settings: {
        event_subscriptions: {
          request_url: webhookUrl,
          bot_events: [
            "app_mention",
            "message.im",
            "message.channels"
          ]
        },
        interactivity: {
          is_enabled: true,
          request_url: webhookUrl
        },
        org_deploy_enabled: false,
        socket_mode_enabled: false,
        token_rotation_enabled: true
      }
    };

    // Add slash commands if enabled
    if (slackConfig.features.chatCommands) {
      manifest.features.slash_commands = [
        {
          command: "/repo-analyze",
          description: "Analyze a GitHub repository",
          usage_hint: "[repository-url]"
        },
        {
          command: "/repo-todo",
          description: "Generate todo list for a repository",
          usage_hint: "[repository-name]"
        },
        {
          command: "/repo-recap",
          description: "Generate meeting recap for a repository",
          usage_hint: "[repository-name] [date-range]"
        },
        {
          command: "/repo-chat",
          description: "Start chat about a repository",
          usage_hint: "[repository-name] [question]"
        }
      ];
    }

    setManifestData(manifest);
    setIsGeneratingManifest(false);
  };

  const downloadManifest = () => {
    if (!manifestData) return;
    
    const dataStr = JSON.stringify(manifestData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'slack-app-manifest.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const saveSettings = async () => {
    // TODO: Save settings to API
    console.log('Saving settings:', slackConfig);
  };

  const testEmailConnection = async () => {
    try {
      setIsTestingEmail(true);
      // TODO: Implement email testing API call
      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig.smtp)
      });
      
      if (response.ok) {
        setEmailTestResult({ success: true, message: 'Email connection successful!' });
      } else {
        setEmailTestResult({ success: false, message: 'Email connection failed' });
      }
    } catch (error) {
      setEmailTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setIsTestingEmail(false);
      setTimeout(() => setEmailTestResult(null), 5000);
    }
  };

  const saveEmailSettings = async () => {
    try {
      setIsSavingEmail(true);
      // TODO: Implement email settings save API
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig)
      });
      
      if (response.ok) {
        setEmailSaveResult({ success: true, message: 'Email settings saved successfully!' });
      } else {
        setEmailSaveResult({ success: false, message: 'Failed to save email settings' });
      }
    } catch (error) {
      setEmailSaveResult({ success: false, message: 'Save operation failed' });
    } finally {
      setIsSavingEmail(false);
      setTimeout(() => setEmailSaveResult(null), 5000);
    }
  };

  const tabs = [
    { id: 'slack', name: 'Slack Bot', icon: Slack },
    { id: 'github', name: 'GitHub', icon: Github },
    { id: 'email', name: 'Email Reports', icon: Mail },
    { id: 'api', name: 'API Keys', icon: Key },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-pink-900/10" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 glass-card rounded-lg">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-gray-400">Configure your GitHub Helper and Slack integration</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 glass-subtle rounded-xl p-1 mb-8 w-fit">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400 shadow-lg'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'slack' && (
              <div className="space-y-6">
                {/* Slack Bot Configuration */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-400" />
                    Bot Configuration
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bot Name
                      </label>
                      <input
                        type="text"
                        value={slackConfig.botName}
                        onChange={(e) => setSlackConfig(prev => ({ ...prev, botName: e.target.value }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="GitHub Helper Bot"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        App Name
                      </label>
                      <input
                        type="text"
                        value={slackConfig.appName}
                        onChange={(e) => setSlackConfig(prev => ({ ...prev, appName: e.target.value }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="GitHub Helper"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={slackConfig.description}
                        onChange={(e) => setSlackConfig(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white min-h-[80px]"
                        placeholder="AI-powered GitHub repository assistant for Slack"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Features
                  </h2>
                  
                  <div className="space-y-4">
                    {Object.entries({
                      chatCommands: 'Slash Commands (/repo-analyze, /repo-todo, etc.)',
                      repoUpdates: 'Repository Update Notifications',
                      todoNotifications: 'Todo Item Notifications',
                      meetingRecaps: 'Automated Meeting Recaps',
                      directMessages: 'Direct Message Support'
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slackConfig.features[key as keyof typeof slackConfig.features]}
                          onChange={(e) => setSlackConfig(prev => ({
                            ...prev,
                            features: { ...prev.features, [key]: e.target.checked }
                          }))}
                          className="w-4 h-4 text-blue-500 bg-transparent border-gray-400 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Manifest Generation */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Slack App Manifest
                  </h2>
                  
                  <p className="text-gray-400 mb-4">
                    Generate a manifest file to create your Slack app automatically. This includes all the necessary permissions and configurations.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <motion.button
                      onClick={generateManifest}
                      disabled={isGeneratingManifest}
                      className="glass-card px-4 py-2 rounded-lg font-medium text-white interactive flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isGeneratingManifest ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Code className="w-4 h-4" />
                      )}
                      Generate Manifest
                    </motion.button>
                    
                    {manifestData && (
                      <motion.button
                        onClick={downloadManifest}
                        className="glass-subtle px-4 py-2 rounded-lg font-medium text-gray-300 interactive flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Download className="w-4 h-4" />
                        Download Manifest
                      </motion.button>
                    )}
                    
                    <motion.a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-subtle px-4 py-2 rounded-lg font-medium text-gray-300 interactive flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Create Slack App
                    </motion.a>
                  </div>
                  
                  {manifestData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 glass-subtle rounded-lg p-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Generated Manifest</span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(manifestData, null, 2), 'manifest')}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {copied === 'manifest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === 'manifest' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="text-xs text-gray-400 overflow-x-auto max-h-40">
                        {JSON.stringify(manifestData, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </div>

                {/* Credentials */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-red-400" />
                    Slack Credentials
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="glass-subtle p-4 rounded-lg border-l-4 border-yellow-500/50">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-yellow-400 font-medium">Security Note</p>
                          <p className="text-xs text-gray-400 mt-1">
                            These credentials will be encrypted and stored securely. Only enter them after creating your Slack app.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { key: 'botToken', label: 'Bot User OAuth Token', placeholder: 'xoxb-...' },
                        { key: 'signingSecret', label: 'Signing Secret', placeholder: '...' },
                        { key: 'clientId', label: 'Client ID', placeholder: '...' },
                        { key: 'clientSecret', label: 'Client Secret', placeholder: '...' },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {label}
                          </label>
                          <div className="relative">
                            <input
                              type={showSecrets[key] ? 'text' : 'password'}
                              value={slackConfig[key as keyof SlackConfig] as string || ''}
                              onChange={(e) => setSlackConfig(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-full glass-subtle rounded-lg px-4 py-3 pr-10 text-white"
                              placeholder={placeholder}
                            />
                            <button
                              type="button"
                              onClick={() => toggleSecret(key)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            >
                              {showSecrets[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    Webhook Configuration
                  </h2>
                  
                  <p className="text-gray-400 mb-4">
                    Use this URL for both Event Subscriptions and Interactivity & Shortcuts in your Slack app configuration.
                  </p>
                  
                  <div className="glass-subtle rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">Webhook URL</span>
                      <button
                        onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copied === 'webhook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'webhook' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <code className="text-sm text-white bg-black/20 px-2 py-1 rounded mt-2 block">
                      {webhookUrl}
                    </code>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <motion.button
                    onClick={saveSettings}
                    className="glass-card px-6 py-3 rounded-lg font-semibold text-white interactive flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Save className="w-4 h-4" />
                    Save Settings
                  </motion.button>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                {/* SMTP Configuration */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    SMTP Configuration
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={emailConfig.smtp.host}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, host: e.target.value }
                        }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Port
                      </label>
                      <input
                        type="number"
                        value={emailConfig.smtp.port}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          smtp: { ...prev.smtp, port: parseInt(e.target.value) }
                        }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="587"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={emailConfig.smtp.auth.user}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          smtp: { 
                            ...prev.smtp, 
                            auth: { ...prev.smtp.auth, user: e.target.value }
                          }
                        }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        App Password
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.emailPassword ? 'text' : 'password'}
                          value={emailConfig.smtp.auth.pass}
                          onChange={(e) => setEmailConfig(prev => ({
                            ...prev,
                            smtp: { 
                              ...prev.smtp, 
                              auth: { ...prev.smtp.auth, pass: e.target.value }
                            }
                          }))}
                          className="w-full glass-subtle rounded-lg px-4 py-3 pr-10 text-white"
                          placeholder="App Password"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecret('emailPassword')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showSecrets.emailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailConfig.smtp.secure}
                          onChange={(e) => setEmailConfig(prev => ({
                            ...prev,
                            smtp: { ...prev.smtp, secure: e.target.checked }
                          }))}
                          className="w-4 h-4 text-blue-500 bg-transparent border-gray-400 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-300">Use SSL/TLS (recommended for port 465)</span>
                      </label>
                    </div>
                  </div>

                  {/* Test Connection */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white mb-1">Test Connection</h3>
                        <p className="text-xs text-gray-400">Verify your SMTP settings are correct</p>
                      </div>
                      <motion.button
                        onClick={testEmailConnection}
                        disabled={isTestingEmail}
                        className="glass-card px-4 py-2 rounded-lg font-medium text-white interactive flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isTestingEmail ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                        {isTestingEmail ? 'Testing...' : 'Test Connection'}
                      </motion.button>
                    </div>
                    
                    {emailTestResult && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-3 p-3 rounded-lg ${
                          emailTestResult.success 
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {emailTestResult.success ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{emailTestResult.message}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Sender Information */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5 text-green-400" />
                    Sender Information
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sender Name
                      </label>
                      <input
                        type="text"
                        value={emailConfig.sender.name}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          sender: { ...prev.sender, name: e.target.value }
                        }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="GitHub Helper"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sender Email
                      </label>
                      <input
                        type="email"
                        value={emailConfig.sender.email}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          sender: { ...prev.sender, email: e.target.value }
                        }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Report Templates */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Email Templates
                  </h2>
                  
                  {/* Repository Reports */}
                  <div className="space-y-4">
                    <div className="glass-subtle p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-white">Repository Reports</h3>
                          <p className="text-sm text-gray-400">Automated reports about repository activity</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailConfig.templates.repositoryReport.enabled}
                            onChange={(e) => setEmailConfig(prev => ({
                              ...prev,
                              templates: {
                                ...prev.templates,
                                repositoryReport: { 
                                  ...prev.templates.repositoryReport, 
                                  enabled: e.target.checked 
                                }
                              }
                            }))}
                            className="w-4 h-4 text-blue-500 bg-transparent border-gray-400 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-300">Enabled</span>
                        </label>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Schedule
                          </label>
                          <select
                            value={emailConfig.templates.repositoryReport.schedule}
                            onChange={(e) => setEmailConfig(prev => ({
                              ...prev,
                              templates: {
                                ...prev.templates,
                                repositoryReport: { 
                                  ...prev.templates.repositoryReport, 
                                  schedule: e.target.value as 'daily' | 'weekly' | 'monthly'
                                }
                              }
                            }))}
                            className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Recipients
                          </label>
                          <input
                            type="email"
                            value={emailConfig.templates.repositoryReport.recipients.join(', ')}
                            onChange={(e) => setEmailConfig(prev => ({
                              ...prev,
                              templates: {
                                ...prev.templates,
                                repositoryReport: { 
                                  ...prev.templates.repositoryReport, 
                                  recipients: e.target.value.split(',').map(email => email.trim())
                                }
                              }
                            }))}
                            className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                            placeholder="email1@domain.com, email2@domain.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Alert Templates */}
                    <div className="glass-subtle p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-white">Alert Notifications</h3>
                          <p className="text-sm text-gray-400">Real-time alerts for important events</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={emailConfig.templates.alerts.enabled}
                            onChange={(e) => setEmailConfig(prev => ({
                              ...prev,
                              templates: {
                                ...prev.templates,
                                alerts: { 
                                  ...prev.templates.alerts, 
                                  enabled: e.target.checked 
                                }
                              }
                            }))}
                            className="w-4 h-4 text-blue-500 bg-transparent border-gray-400 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-300">Enabled</span>
                        </label>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Alert Types
                        </label>
                        {[
                          { key: 'critical-issues', label: 'Critical Issues' },
                          { key: 'deploy-failures', label: 'Deployment Failures' },
                          { key: 'security-alerts', label: 'Security Alerts' },
                          { key: 'performance-degradation', label: 'Performance Issues' }
                        ].map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={emailConfig.templates.alerts.types.includes(key)}
                              onChange={(e) => {
                                const types = e.target.checked
                                  ? [...emailConfig.templates.alerts.types, key]
                                  : emailConfig.templates.alerts.types.filter(t => t !== key);
                                setEmailConfig(prev => ({
                                  ...prev,
                                  templates: {
                                    ...prev.templates,
                                    alerts: { ...prev.templates.alerts, types }
                                  }
                                }));
                              }}
                              className="w-4 h-4 text-blue-500 bg-transparent border-gray-400 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-300">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Branding */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Email Branding
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={emailConfig.branding.companyName}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          branding: { ...prev.branding, companyName: e.target.value }
                        }))}
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="Your Company Name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={emailConfig.branding.primaryColor}
                        onChange={(e) => setEmailConfig(prev => ({
                          ...prev,
                          branding: { ...prev.branding, primaryColor: e.target.value }
                        }))}
                        className="w-full h-12 glass-subtle rounded-lg border-0 cursor-pointer"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Logo URL
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={emailConfig.branding.logoUrl}
                          onChange={(e) => setEmailConfig(prev => ({
                            ...prev,
                            branding: { ...prev.branding, logoUrl: e.target.value }
                          }))}
                          className="flex-1 glass-subtle rounded-lg px-4 py-3 text-white"
                          placeholder="/logo.png or https://..."
                        />
                        {emailConfig.branding.logoUrl && (
                          <div className="w-12 h-12 glass-subtle rounded-lg flex items-center justify-center">
                            <img 
                              src={emailConfig.branding.logoUrl} 
                              alt="Logo preview" 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-between items-center">
                  {emailSaveResult && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg ${
                        emailSaveResult.success 
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {emailSaveResult.success ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span className="text-sm">{emailSaveResult.message}</span>
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.button
                    onClick={saveEmailSettings}
                    disabled={isSavingEmail}
                    className="glass-card px-6 py-3 rounded-lg font-semibold text-white interactive flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSavingEmail ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSavingEmail ? 'Saving...' : 'Save Email Settings'}
                  </motion.button>
                </div>
              </div>
            )}

            {activeTab === 'github' && (
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-semibold text-white mb-4">GitHub Integration</h2>
                <p className="text-gray-400">GitHub settings and API configuration options will go here.</p>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                {/* OpenAI API Keys */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-blue-400" />
                    OpenAI API Configuration
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        OpenAI API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.openaiKey ? 'text' : 'password'}
                          className="w-full glass-subtle rounded-lg px-4 py-3 pr-10 text-white"
                          placeholder="sk-..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecret('openaiKey')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showSecrets.openaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Organization ID (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="org-..."
                      />
                    </div>
                  </div>
                </div>

                {/* GitHub API Keys */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Github className="w-5 h-5 text-gray-400" />
                    GitHub API Configuration
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Personal Access Token
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.githubToken ? 'text' : 'password'}
                          className="w-full glass-subtle rounded-lg px-4 py-3 pr-10 text-white"
                          placeholder="ghp_..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecret('githubToken')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showSecrets.githubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        GitHub Username
                      </label>
                      <input
                        type="text"
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="your-username"
                      />
                    </div>
                  </div>
                </div>

                {/* Database Configuration */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-400" />
                    Database Configuration
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Supabase URL
                      </label>
                      <input
                        type="url"
                        className="w-full glass-subtle rounded-lg px-4 py-3 text-white"
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Service Role Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets.supabaseKey ? 'text' : 'password'}
                          className="w-full glass-subtle rounded-lg px-4 py-3 pr-10 text-white"
                          placeholder="eyJ..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecret('supabaseKey')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showSecrets.supabaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <motion.button
                    className="glass-card px-6 py-3 rounded-lg font-semibold text-white interactive flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Save className="w-4 h-4" />
                    Save API Keys
                  </motion.button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-400" />
                  Security Settings
                </h2>
                <p className="text-gray-400">Security and authentication settings will go here.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
