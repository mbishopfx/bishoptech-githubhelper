'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListTodo,
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  Flag,
  Sparkles,
  Zap,
  Archive,
  Filter,
  Search,
  Github,
  User,
  AlertCircle
} from 'lucide-react';

interface TodoItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  repository_id?: string;
  repository_name?: string;
  created_at: string;
  updated_at: string;
}

interface TodoList {
  id: string;
  title: string;
  description: string;
  repository_id?: string;
  repository_name?: string;
  items: TodoItem[];
  created_at: string;
  updated_at: string;
}

export default function TodosPage() {
  const [mounted, setMounted] = useState(false);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending
  const [isGenerating, setIsGenerating] = useState(false);
  const [repositories, setRepositories] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    loadTodoLists();
    loadRepositories();
  }, []);

  const loadTodoLists = async () => {
    try {
      const response = await fetch('/api/todos?userId=550e8400-e29b-41d4-a716-446655440000');
      const data = await response.json();
      
      if (data.success) {
        setTodoLists(data.todoLists || []);
        if (data.todoLists && data.todoLists.length > 0) {
          setSelectedList(data.todoLists[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading todo lists:', error);
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

  const generateAITodos = async (repositoryId: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'generate-ai',
          repositoryId,
          userId: '550e8400-e29b-41d4-a716-446655440000'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh todo lists to show the new one
        loadTodoLists();
        console.log('AI todos generated:', data.message);
      } else {
        console.error('Failed to generate AI todos:', data.error);
      }
    } catch (error) {
      console.error('Error generating AI todos:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTodoItem = async (listId: string, itemId: string) => {
    // Optimistically update UI
    const currentList = todoLists.find(list => list.id === listId);
    const currentItem = currentList?.items.find(item => item.id === itemId);
    if (!currentItem) return;

    const newStatus = currentItem.completed ? 'pending' : 'completed';
    
    setTodoLists(prev => prev.map(list => 
      list.id === listId 
        ? {
            ...list,
            items: list.items.map(item =>
              item.id === itemId
                ? { ...item, completed: !item.completed, status: newStatus, updated_at: new Date().toISOString() }
                : item
            )
          }
        : list
    ));

    try {
      const response = await fetch(`/api/todos/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          completed: !currentItem.completed
        }),
      });

      if (!response.ok) {
        // Revert the optimistic update on failure
        setTodoLists(prev => prev.map(list => 
          list.id === listId 
            ? {
                ...list,
                items: list.items.map(item =>
                  item.id === itemId
                    ? { ...item, completed: currentItem.completed, status: currentItem.status }
                    : item
                )
              }
            : list
        ));
        console.error('Failed to update todo item');
      }
    } catch (error) {
      console.error('Error updating todo item:', error);
      // Revert on error
      setTodoLists(prev => prev.map(list => 
        list.id === listId 
          ? {
              ...list,
              items: list.items.map(item =>
                item.id === itemId
                  ? { ...item, completed: currentItem.completed, status: currentItem.status }
                  : item
              )
            }
          : list
      ));
    }
  };

  const deleteTodoItem = async (listId: string, itemId: string) => {
    // Optimistically remove from UI
    const originalLists = [...todoLists];
    setTodoLists(prev => prev.map(list =>
      list.id === listId
        ? {
            ...list,
            items: list.items.filter(item => item.id !== itemId)
          }
        : list
    ));

    try {
      const response = await fetch(`/api/todos/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert the optimistic update on failure
        setTodoLists(originalLists);
        console.error('Failed to delete todo item');
      }
    } catch (error) {
      console.error('Error deleting todo item:', error);
      setTodoLists(originalLists);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-orange-400 border-orange-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getSelectedTodoList = () => {
    return todoLists.find(list => list.id === selectedList);
  };

  const getFilteredItems = () => {
    const list = getSelectedTodoList();
    if (!list) return [];

    let filtered = list.items;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === filterPriority);
    }

    // Filter by status
    if (filterStatus === 'completed') {
      filtered = filtered.filter(item => item.completed);
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(item => !item.completed);
    }

    return filtered;
  };

  if (!mounted) return null;

  const selectedTodoList = getSelectedTodoList();
  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Todo Lists</h1>
          <p className="text-gray-400">
            AI-generated and custom task management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewListModal(true)}
            className="glass-subtle px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New List
          </button>
          
          <div className="relative">
            <select
              onChange={(e) => e.target.value && generateAITodos(e.target.value)}
              className="glass-card px-4 py-2 rounded-lg font-medium text-white bg-transparent border-0 appearance-none pr-10"
              disabled={isGenerating}
            >
              <option value="">
                {isGenerating ? 'Generating...' : '✨ Generate AI Todos'}
              </option>
              {repositories.map(repo => (
                <option key={repo.id} value={repo.id} className="bg-gray-800">
                  {repo.name}
                </option>
              ))}
            </select>
            <Zap className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Lists',
            value: todoLists.length.toString(),
            icon: ListTodo,
            color: 'from-blue-500 to-cyan-500'
          },
          {
            label: 'Pending Tasks',
            value: todoLists.reduce((sum, list) => sum + list.items.filter(item => !item.completed).length, 0).toString(),
            icon: AlertCircle,
            color: 'from-orange-500 to-red-500'
          },
          {
            label: 'Completed Tasks',
            value: todoLists.reduce((sum, list) => sum + list.items.filter(item => item.completed).length, 0).toString(),
            icon: CheckSquare,
            color: 'from-green-500 to-emerald-500'
          },
          {
            label: 'AI Generated',
            value: todoLists.filter(list => list.title.includes('AI Generated')).length.toString(),
            icon: Sparkles,
            color: 'from-purple-500 to-pink-500'
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
        {/* Todo Lists Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Your Lists</h3>
            
            <div className="space-y-2">
              {todoLists.map(list => (
                <motion.button
                  key={list.id}
                  onClick={() => setSelectedList(list.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedList === list.id
                      ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                      : 'hover:bg-white/5 text-gray-300 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{list.title}</h4>
                    {list.repository_name && (
                      <Github className="w-4 h-4" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                    {list.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {list.items.filter(item => !item.completed).length} pending
                    </span>
                    <span className="text-gray-500">
                      {list.items.filter(item => item.completed).length} done
                    </span>
                  </div>
                </motion.button>
              ))}
              
              {todoLists.length === 0 && (
                <div className="text-center py-8">
                  <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No todo lists yet</p>
                  <button
                    onClick={() => setShowNewListModal(true)}
                    className="glass-card px-4 py-2 rounded-lg text-white hover:scale-105 transition-transform"
                  >
                    Create Your First List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Todo Items */}
        <div className="lg:col-span-2">
          {selectedTodoList ? (
            <div className="space-y-6">
              {/* List Header */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedTodoList.title}
                    </h2>
                    <p className="text-gray-400">{selectedTodoList.description}</p>
                  </div>
                  
                  <button
                    onClick={() => setShowNewItemModal(true)}
                    className="glass-card px-4 py-2 rounded-lg font-medium text-white hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                </div>
                
                {selectedTodoList.repository_name && (
                  <div className="flex items-center gap-2 mb-4">
                    <Github className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 text-sm">
                      {selectedTodoList.repository_name}
                    </span>
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 glass-subtle rounded-lg text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="glass-subtle rounded-lg px-4 py-2 text-white bg-transparent"
                  >
                    <option value="all" className="bg-gray-800">All Priorities</option>
                    <option value="high" className="bg-gray-800">High</option>
                    <option value="medium" className="bg-gray-800">Medium</option>
                    <option value="low" className="bg-gray-800">Low</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="glass-subtle rounded-lg px-4 py-2 text-white bg-transparent"
                  >
                    <option value="all" className="bg-gray-800">All Tasks</option>
                    <option value="pending" className="bg-gray-800">Pending</option>
                    <option value="completed" className="bg-gray-800">Completed</option>
                  </select>
                </div>
              </div>

              {/* Todo Items */}
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className={`glass-card p-6 rounded-2xl ${
                        item.completed ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleTodoItem(selectedTodoList.id, item.id)}
                          className="mt-1 flex-shrink-0"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-5 h-5 text-green-400" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <h4 className={`text-lg font-medium mb-2 ${
                            item.completed ? 'text-gray-400 line-through' : 'text-white'
                          }`}>
                            {item.title}
                          </h4>
                          
                          <p className="text-gray-400 text-sm mb-3">
                            {item.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`px-2 py-1 rounded-full border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                            
                            {item.due_date && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Calendar className="w-4 h-4" />
                                {new Date(item.due_date).toLocaleDateString()}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-4 h-4" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button className="p-2 glass-subtle rounded-lg hover:bg-white/10 transition-colors">
                            <Edit3 className="w-4 h-4 text-gray-400" />
                          </button>
                          
                          <button
                            onClick={() => deleteTodoItem(selectedTodoList.id, item.id)}
                            className="p-2 glass-subtle rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {filteredItems.length === 0 && (
                  <div className="glass-card p-8 rounded-2xl text-center">
                    <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
                    <p className="text-gray-400 mb-6">
                      {searchTerm || filterPriority !== 'all' || filterStatus !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Add your first task to get started'
                      }
                    </p>
                    <button
                      onClick={() => setShowNewItemModal(true)}
                      className="glass-card px-6 py-3 rounded-lg font-medium text-white hover:scale-105 transition-transform inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-2xl text-center">
              <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a todo list</h3>
              <p className="text-gray-400">
                Choose a list from the sidebar to view and manage tasks
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
