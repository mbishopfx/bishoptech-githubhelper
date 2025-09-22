'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Activity,
  Calendar,
  Shield
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used?: string;
  permissions: string[];
  requests_today: number;
  rate_limit: number;
  expires_at?: string;
}

// Demo API keys
const demoApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Development Key',
    key: 'gha_dev_12345678901234567890123456789012',
    created_at: '2024-01-15T10:00:00Z',
    last_used: '2024-01-20T14:30:00Z',
    permissions: ['read', 'write'],
    requests_today: 45,
    rate_limit: 1000
  },
  {
    id: '2', 
    name: 'Production API',
    key: 'gha_prod_abcdefghijklmnopqrstuvwxyz123456',
    created_at: '2024-01-10T09:15:00Z',
    last_used: '2024-01-20T16:45:00Z',
    permissions: ['read', 'write', 'admin'],
    requests_today: 234,
    rate_limit: 5000,
    expires_at: '2024-12-31T23:59:59Z'
  }
];

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(demoApiKeys);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyApiKey = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const createNewKey = () => {
    if (!newKeyName.trim()) return;

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `gha_${newKeyName.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 32)}`,
      created_at: new Date().toISOString(),
      permissions: ['read', 'write'],
      requests_today: 0,
      rate_limit: 1000
    };

    setApiKeys(prev => [newKey, ...prev]);
    setNewKeyName('');
    setShowCreateForm(false);
  };

  const deleteKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId));
  };

  const formatKey = (key: string, visible: boolean) => {
    if (visible) return key;
    const prefix = key.split('_')[0] + '_' + key.split('_')[1] + '_';
    return prefix + '•'.repeat(20);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="glass-card p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 glass-subtle rounded-xl">
                <Key className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">API Keys</h1>
                <p className="text-gray-300 mt-2">
                  Manage your API keys for GitHub Agent Dashboard integration
                </p>
              </div>
            </div>
            
            <motion.button
              className="glass-subtle px-6 py-3 rounded-xl text-white interactive flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-5 h-5" />
              New API Key
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-subtle p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Active Keys</h3>
              </div>
              <div className="text-2xl font-bold text-green-400">{apiKeys.length}</div>
            </div>

            <div className="glass-subtle p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Requests Today</h3>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {apiKeys.reduce((sum, key) => sum + key.requests_today, 0)}
              </div>
            </div>

            <div className="glass-subtle p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Rate Limit</h3>
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {Math.max(...apiKeys.map(k => k.rate_limit))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-6 mb-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Create New API Key</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Enter key name (e.g., 'My App Integration')"
                  className="flex-1 glass-subtle rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && createNewKey()}
                />
                <button
                  onClick={createNewKey}
                  className="glass-subtle px-6 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="glass-subtle px-6 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API Keys List */}
        <div className="space-y-4">
          {apiKeys.map((apiKey, index) => (
            <motion.div
              key={apiKey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span>Created {new Date(apiKey.created_at).toLocaleDateString()}</span>
                    {apiKey.last_used && (
                      <span>Last used {new Date(apiKey.last_used).toLocaleDateString()}</span>
                    )}
                    {apiKey.expires_at && (
                      <span className="text-yellow-400">
                        Expires {new Date(apiKey.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteKey(apiKey.id)}
                  className="p-2 glass-subtle rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* API Key Display */}
              <div className="glass-subtle p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm text-white flex-1 mr-4">
                    {formatKey(apiKey.key, visibleKeys[apiKey.id])}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {visibleKeys[apiKey.id] ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => copyApiKey(apiKey.key, apiKey.id)}
                      className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {copiedKey === apiKey.id ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions & Usage */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Permissions</h4>
                  <div className="flex flex-wrap gap-2">
                    {apiKey.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="px-2 py-1 text-xs glass-subtle rounded-full text-blue-300"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Usage Today</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((apiKey.requests_today / apiKey.rate_limit) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">
                      {apiKey.requests_today}/{apiKey.rate_limit}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Usage Instructions */}
        <motion.div 
          className="glass-card p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Using Your API Keys</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">Authentication Headers</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-subtle p-3 rounded-lg">
                  <div className="text-sm text-gray-300 mb-1">Authorization Header</div>
                  <code className="text-xs font-mono text-green-300">
                    Authorization: Bearer gha_your_api_key_here
                  </code>
                </div>
                <div className="glass-subtle p-3 rounded-lg">
                  <div className="text-sm text-gray-300 mb-1">Custom Header</div>
                  <code className="text-xs font-mono text-green-300">
                    X-API-Key: gha_your_api_key_here
                  </code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-blue-400 mb-2">Example Usage</h3>
              <pre className="bg-gray-900 text-green-300 p-4 rounded-lg overflow-x-auto text-sm font-mono">
{`curl -X GET "https://your-domain.com/api/v1/projects" \\
  -H "Authorization: Bearer gha_your_api_key_here" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>

            <div className="flex items-start gap-2 p-4 glass-subtle rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <strong className="text-yellow-400">Security Note:</strong> Keep your API keys secure and never commit them to version control. 
                Store them in environment variables and use HTTPS for all requests.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
