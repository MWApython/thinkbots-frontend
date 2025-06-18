import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, ClipboardDocumentCheckIcon, DocumentTextIcon, UserGroupIcon, PaperAirplaneIcon, CheckCircleIcon, XCircleIcon, CalendarDaysIcon, PlusIcon, PencilIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getUsernameFromEmail } from '../utils/emailHelpers';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  dueDate: string;
  status: string;
  createdBy: string;
  createdAt: string;
  modifiedOn: string;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  link: string;
  createdAt: string;
  modifiedOn: string;
  author: string;
  version: string;
  updateReason?: string;
}

interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

const TeamCollab: React.FC = () => {
  const { user, isAdmin, token } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tasks' | 'discussions' | 'documents'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    id: '',
    title: '',
    description: '',
    assignedTo: [],
    dueDate: '',
    status: 'pending',
    createdBy: '',
    createdAt: '',
    modifiedOn: ''
  });
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
  });
  const [newComment, setNewComment] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocument, setNewDocument] = useState({
    name: '',
    link: '',
    version: '',
    updateReason: ''
  });
  const [loading, setLoading] = useState({
    tasks: false,
    discussions: false,
    documents: false,
    users: false,
    submit: false
  });
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [sortOrder, setSortOrder] = useState('latest');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskSummaryPage, setTaskSummaryPage] = useState(1);
  const TASKS_PER_PAGE = 5;
  const totalTaskPages = Math.ceil(tasks.length / TASKS_PER_PAGE);
  const paginatedTasks = tasks.slice((taskSummaryPage - 1) * TASKS_PER_PAGE, taskSummaryPage * TASKS_PER_PAGE);
  const [taskListPage, setTaskListPage] = useState(1);
  const TASK_LISTS_PER_PAGE = 10;
  const [summaryStatusFilter, setSummaryStatusFilter] = useState('all');
  const [summaryAssignedToFilter, setSummaryAssignedToFilter] = useState('all');
  const [summaryDueDateSort, setSummaryDueDateSort] = useState('closest');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isEditUserDropdownOpen, setIsEditUserDropdownOpen] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddDiscussionModal, setShowAddDiscussionModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [updateDoc, setUpdateDoc] = useState<Document | null>(null);

  const getAssignedToArray = (assignedTo: string | string[]): string[] => {
    if (!assignedTo) return [];
    if (Array.isArray(assignedTo)) return assignedTo;
    return [assignedTo];
  };

  const filteredTasks = tasks.filter(task => {
    if (filterBy === 'all') return true;
    if (filterBy === 'assignedTo') {
      const assignedUsers = getAssignedToArray(task.assignedTo);
      return user?.email ? assignedUsers.includes(user.email) : false;
    }
    if (filterBy === 'createdBy') return task.createdBy === user?.email;
    return true;
  });
  const totalTaskListPages = Math.ceil(filteredTasks.length / TASK_LISTS_PER_PAGE);
  const paginatedTaskList = filteredTasks.slice((taskListPage - 1) * TASK_LISTS_PER_PAGE, taskListPage * TASK_LISTS_PER_PAGE);
  const taskRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  // Filtered and sorted tasks for Task Summary
  const filteredSummaryTasks = tasks
    .filter(task => {
      if (summaryStatusFilter === 'all') return true;
      return task.status === summaryStatusFilter;
    })
    .filter(task => {
      if (summaryAssignedToFilter === 'all') return true;
      return getAssignedToArray(task.assignedTo).includes(summaryAssignedToFilter);
    })
    .sort((a: Task, b: Task): number => {
      if (summaryDueDateSort === 'closest') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
    });
  const totalFilteredSummaryPages = Math.ceil(filteredSummaryTasks.length / TASKS_PER_PAGE);
  const paginatedSummaryTasks = filteredSummaryTasks.slice((taskSummaryPage - 1) * TASKS_PER_PAGE, taskSummaryPage * TASKS_PER_PAGE);

  // Discussion pagination state
  const [discussionPage, setDiscussionPage] = useState(1);
  const DISCUSSIONS_PER_PAGE = 10;
  const totalDiscussionPages = Math.ceil(discussions.length / DISCUSSIONS_PER_PAGE);
  const paginatedDiscussions = discussions.slice((discussionPage - 1) * DISCUSSIONS_PER_PAGE, discussionPage * DISCUSSIONS_PER_PAGE);

  // Discussion summary cards
  const mostDiscussed = discussions.length > 0 ? discussions.reduce((max: Discussion, d: Discussion) => (d.comments.length > max.comments.length ? d : max), discussions[0]) : null;
  let latestComment: (Comment & { discussionTitle: string }) | null = null;
  discussions.forEach(d => d.comments.forEach(c => {
    if (!latestComment || new Date(c.createdAt) > new Date(latestComment.createdAt)) latestComment = { ...c, discussionTitle: d.title };
  }));

  // State for update document modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateDocId, setUpdateDocId] = useState<string | null>(null);
  const [updateDocLink, setUpdateDocLink] = useState('');
  const [updateDocReason, setUpdateDocReason] = useState('');

  const formatEmailDisplay = (email: string): string => {
    return email.split('@')[0];
  };

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchUsers();
    fetchTasks();
    fetchDiscussions();
    fetchDocuments();
  }, [user, token, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.user-dropdown');
      const button = target.closest('button');
      const checkbox = target.closest('input[type="checkbox"]');
      const label = target.closest('label');
      
      if (!dropdown && !button && !checkbox && !label) {
        setIsUserDropdownOpen(false);
        setIsEditUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiGet('/api/team/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await apiGet('/api/team/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchDiscussions = async () => {
    try {
      const data = await apiGet('/api/team/discussions');
      setDiscussions(data);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await apiGet('/api/team/documents');
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const createTask = async (taskData: any) => {
    try {
      const newTask = await apiPost('/api/team/tasks', taskData);
      setTasks(prev => [...prev, newTask]);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const createDiscussion = async (discussionData: any) => {
    try {
      const newDiscussion = await apiPost('/api/team/discussions', discussionData);
      setDiscussions(prev => [...prev, newDiscussion]);
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const addComment = async (discussionId: string, commentData: any) => {
    try {
      const newComment = await apiPost(`/api/team/discussions/${discussionId}/comments`, commentData);
      // Update discussions with new comment
      setDiscussions(prev => 
        prev.map(discussion => 
          discussion.id === discussionId 
            ? { ...discussion, comments: [...(discussion.comments || []), newComment] }
            : discussion
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const updateTask = async (taskId: string, taskData: any) => {
    try {
      const updatedTask = await apiPut(`/api/team/tasks/${taskId}`, taskData);
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const createDocument = async (documentData: any) => {
    try {
      const newDocument = await apiPost('/api/team/documents', documentData);
      setDocuments(prev => [...prev, newDocument]);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const updatedTask = await apiPut(`/api/team/tasks/${taskId}`, { status });
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await apiDelete(`/api/team/tasks/${taskId}`);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const deleteDiscussion = async (discussionId: string) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    
    try {
      await apiDelete(`/api/team/discussions/${discussionId}`);
      setDiscussions(prev => prev.filter(discussion => discussion.id !== discussionId));
    } catch (error) {
      console.error('Error deleting discussion:', error);
      setError('Failed to delete discussion');
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await apiDelete(`/api/team/documents/${docId}`);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const updateDocument = async () => {
    if (!updateDoc) return;
    
    try {
      const response = await apiPut(`/api/team/documents/${updateDoc.id}`, {
        ...updateDoc,
        modifiedOn: new Date().toISOString()
      });
      await fetchDocuments();
      setUpdateDoc(null);
    } catch (error) {
      console.error('Error updating document:', error);
      setError('Failed to update document');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const response = await apiPost('/api/team/tasks', {
        ...newTask,
        createdBy: user?.email || '',
        createdAt: new Date().toISOString(),
        modifiedOn: new Date().toISOString()
      });
      await fetchTasks();
      setNewTask({
        id: '',
        title: '',
        description: '',
        assignedTo: [],
        dueDate: '',
        status: 'pending',
        createdBy: '',
        createdAt: '',
        modifiedOn: ''
      });
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const response = await apiPost('/api/team/discussions', {
        ...newDiscussion,
        author: user?.email || '',
        createdAt: new Date().toISOString(),
        comments: []
      });
      if (!response.ok) {
        throw new Error('Failed to create discussion');
      }
      await fetchDiscussions();
      setNewDiscussion({
        title: '',
        content: '',
      });
    } catch (error) {
      console.error('Error creating discussion:', error);
      setError('Failed to create discussion');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleAddComment = async (discussionId: string, content: string) => {
    if (!content.trim()) return;
    
    try {
      const response = await apiPost(`/api/team/discussions/${discussionId}/comments`, {
        content,
        author: user?.email || '',
        createdAt: new Date().toISOString()
      });
      
      // Update discussions with new comment
      setDiscussions(prev => 
        prev.map(discussion => 
          discussion.id === discussionId 
            ? { ...discussion, comments: [...(discussion.comments || []), response] }
            : discussion
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await apiPut(`/api/team/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId ? response : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const response = await apiPost('/api/team/documents', {
        ...newDocument,
        author: user?.email || '',
        createdAt: new Date().toISOString(),
        modifiedOn: new Date().toISOString()
      });
      await fetchDocuments();
      setNewDocument({
        name: '',
        link: '',
        version: '',
        updateReason: ''
      });
    } catch (error) {
      console.error('Error creating document:', error);
      setError('Failed to create document');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleEditTask = (task: Task) => {
    setEditTask({
      ...task,
    });
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const response = await apiPut(`/api/team/tasks/${editTask.id}`, {
        ...editTask,
        modifiedOn: new Date().toISOString()
      });
      await fetchTasks();
      setEditTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleSummaryTaskClick = (taskId: string | null) => {
    if (!taskId) return;
    setExpandedTaskId(taskId);
    setTimeout(() => {
      const ref = taskRefs.current[taskId];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleUserSelection = (username: string) => {
    setNewTask(prev => {
      const isSelected = prev.assignedTo.includes(username);
      const newAssignedTo = isSelected
        ? prev.assignedTo.filter(user => user !== username)
        : [...prev.assignedTo, username];
      return { ...prev, assignedTo: newAssignedTo };
    });
  };

  const sortedUsers = [...users].sort((a: FirebaseUser, b: FirebaseUser): number => {
    const nameA = (a.displayName || a.email?.split('@')[0] || '').toLowerCase();
    const nameB = (b.displayName || b.email?.split('@')[0] || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Delete handlers
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await apiDelete(`/api/team/tasks/${taskId}`);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    
    try {
      await apiDelete(`/api/team/discussions/${discussionId}`);
      setDiscussions(prev => prev.filter(discussion => discussion.id !== discussionId));
    } catch (error) {
      console.error('Error deleting discussion:', error);
      setError('Failed to delete discussion');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await apiDelete(`/api/team/documents/${docId}`);
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const handleOpenUpdateModal = (doc: Document) => {
    setUpdateDoc(doc);
    setUpdateDocLink(doc.link);
    setUpdateDocReason('');
    setShowUpdateModal(true);
  };

  const handleUpdateDocument = async () => {
    if (!updateDoc) return;
    
    try {
      const response = await apiPut(`/api/team/documents/${updateDoc.id}`, {
        ...updateDoc,
        modifiedOn: new Date().toISOString()
      });
      await fetchDocuments();
      setUpdateDoc(null);
    } catch (error) {
      console.error('Error updating document:', error);
      setError('Failed to update document');
    }
  };

  // Update the user selection UI
  const renderUserSelection = (selectedUsers: string[], onChange: (users: string[]) => void) => {
    console.log('Current users:', users);
    console.log('Sorted users:', sortedUsers);

    if (!sortedUsers || sortedUsers.length === 0) {
      return (
        <div className="space-y-2">
          <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">Assigned To</label>
          <div className="relative">
            <select
              id="user-select"
              disabled
              className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-100 px-3 py-2"
              aria-label="Select users to assign"
              title="Select users to assign to this task"
            >
              <option>No users available</option>
            </select>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">Assigned To</label>
        <div className="relative">
          <select
            id="user-select"
            value={selectedUsers[0] || ''}
            onChange={(e) => {
              const selectedEmail = e.target.value;
              onChange([selectedEmail]);
            }}
            className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            aria-label="Select users to assign"
            title="Select users to assign to this task"
          >
            <option value="">Select a user</option>
            {sortedUsers.map((user) => {
              if (!user || !user.email) return null;
              const displayName = user.displayName || user.email.split('@')[0];
              return (
                <option 
                  key={user.uid} 
                  value={user.email}
                  className="py-2 px-3 hover:bg-blue-50"
                >
                  {displayName}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    );
  };

  // Update the task creation form
  const renderTaskForm = () => (
    <form onSubmit={handleCreateTask} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'ar' ? 'عنوان المهمة' : 'Task Title'}
        </label>
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
          placeholder={language === 'ar' ? 'أدخل عنوان المهمة' : 'Enter task title'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {language === 'ar' ? 'وصف المهمة' : 'Task Description'}
        </label>
        <textarea
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          required
          placeholder={language === 'ar' ? 'أدخل وصف المهمة' : 'Enter task description'}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-indigo-700">Due Date</label>
        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          className="mt-1 block w-full rounded-md border-2 border-indigo-200 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
          title="Select due date"
          aria-label="Select due date"
          placeholder="YYYY-MM-DD"
        />
      </div>
      {renderUserSelection(newTask.assignedTo, (users) => setNewTask({ ...newTask, assignedTo: users }))}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading.submit}
          className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ripple-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-5 w-5" />
          {loading.submit ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );

  // Update the task editing form
  const renderEditTaskForm = () => {
    if (!editTask) return null;
    
    return (
      <form onSubmit={handleUpdateTask} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={editTask.title}
            onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            title="Task Title"
            placeholder="Enter task title"
            aria-label="Task Title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={editTask.description}
            onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            required
            title="Task Description"
            placeholder="Enter task description"
            aria-label="Task Description"
          />
        </div>
        {renderUserSelection(editTask.assignedTo, (users) => setEditTask({ ...editTask, assignedTo: users }))}
        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date</label>
          <input
            type="date"
            value={editTask.dueDate}
            onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
            className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            title="Task Due Date"
            placeholder="YYYY-MM-DD"
            aria-label="Task Due Date"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setEditTask(null)}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading.submit}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ripple-button"
          >
            {loading.submit ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right font-bold ripple-button"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'ar' ? 'تعاون الفريق' : 'Team Collaboration'}
        </h1>
        <p className="mt-2 text-gray-600">
          {language === 'ar' 
            ? 'اعمل معًا، شارك الأفكار، وتتبع التقدم'
            : 'Work together, share insights, and track progress'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'tasks'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {language === 'ar' ? 'المهام' : 'Tasks'}
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'discussions'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {language === 'ar' ? 'المناقشات' : 'Discussions'}
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'documents'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {language === 'ar' ? 'المستندات' : 'Documents'}
        </button>
      </div>

      {/* Content Area */}
      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Task Status Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'المهام المعلقة' : 'Pending Tasks'}</h3>
              <p className="text-2xl font-bold text-yellow-600">{tasks.filter(task => task.status === 'pending').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'المهام المكتملة' : 'Completed Tasks'}</h3>
              <p className="text-2xl font-bold text-green-600">{tasks.filter(task => task.status === 'completed').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-gray-900">{language === 'ar' ? 'المهام المتأخرة' : 'Overdue Tasks'}</h3>
              <p className="text-2xl font-bold text-red-600">{tasks.filter(task => task.status === 'overdue').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'ar' ? 'معظم المهام مخصصة إلى' : 'Most Tasks Assigned to'}
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {(() => {
                  const userTaskCounts = tasks.reduce((acc, task) => {
                    const assignedToStr = getAssignedToArray(task.assignedTo).join(', ');
                    acc[assignedToStr] = (acc[assignedToStr] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  const maxUser = Object.entries(userTaskCounts).reduce((a, b) => (a[1] > b[1] ? a : b), ['', 0])[0];
                  return maxUser ? formatEmailDisplay(maxUser) : 'None';
                })()}
              </p>
            </div>
          </div>

          {/* Task Summary Table */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'ملخص المهام' : 'Task Summary'}
            </h2>
            {/* Filters for Task Summary */}
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={summaryStatusFilter}
                onChange={e => { setSummaryStatusFilter(e.target.value); setTaskSummaryPage(1); }}
                className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="Filter summary by status"
              >
                <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                <option value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</option>
                <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                <option value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</option>
              </select>
              <select
                value={summaryAssignedToFilter}
                onChange={e => { setSummaryAssignedToFilter(e.target.value); setTaskSummaryPage(1); }}
                className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="Filter summary by assigned user"
              >
                <option value="all">All Users</option>
                {sortedUsers.map(user => (
                  <option key={user.uid} value={user.email}>{getUsernameFromEmail(user.email) || user.displayName}</option>
                ))}
              </select>
              <select
                value={summaryDueDateSort}
                onChange={e => setSummaryDueDateSort(e.target.value)}
                className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="Sort summary by due date"
              >
                <option value="closest">Due Date: Closest First</option>
                <option value="farthest">Due Date: Farthest First</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Title</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Assigned To</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSummaryTasks.map(task => (
                    <tr key={task.id} className="hover:bg-blue-50 cursor-pointer" onClick={() => handleSummaryTaskClick(task.id)}>
                      <td className="px-4 py-2">{task.title}</td>
                      <td className="px-4 py-2">{getAssignedToArray(task.assignedTo).map(email => formatEmailDisplay(email)).join(', ')}</td>
                      <td className="px-4 py-2 capitalize">{task.status.replace('_', ' ')}</td>
                      <td className="px-4 py-2">{task.dueDate}</td>
                    </tr>
                  ))}
                  {filteredSummaryTasks.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-2 text-center text-gray-400">No tasks found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalFilteredSummaryPages > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                  className="flex items-center px-4 py-2 rounded-full bg-white border border-blue-500 text-blue-600 font-semibold shadow-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed ripple-button"
                  onClick={() => setTaskSummaryPage(p => Math.max(1, p - 1))}
                  disabled={taskSummaryPage === 1}
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </button>
                <span className="mx-2 text-sm font-medium text-gray-700">Page {taskSummaryPage} of {totalFilteredSummaryPages}</span>
                <button
                  className="flex items-center px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed ripple-button"
                  onClick={() => setTaskSummaryPage(p => Math.min(totalFilteredSummaryPages, p + 1))}
                  disabled={taskSummaryPage === totalFilteredSummaryPages}
                  aria-label="Next page"
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg shadow-md p-6 border border-indigo-100 hover:shadow-lg transition-all duration-200">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4">
              {language === 'ar' ? 'إنشاء مهمة جديدة' : 'Create New Task'}
            </h2>
            {renderTaskForm()}
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{language === 'ar' ? 'قائمة المهام' : 'Task List'}</h2>
              {/* Filter options */}
              <div className="mb-4 flex space-x-4">
                <div className="flex-1">
                  <label htmlFor="filterBy" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter Tasks
                  </label>
                  <select
                    id="filterBy"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5c6bc0] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer hover:border-[#5c6bc0] bg-gradient-to-r from-white to-gray-50"
                    aria-label="Filter tasks"
                  >
                    <option value="all">{language === 'ar' ? 'جميع المهام' : 'All Tasks'}</option>
                    <option value="assignedTo">{language === 'ar' ? 'مخصصة لي' : 'Assigned to Me'}</option>
                    <option value="createdBy">{language === 'ar' ? 'أنشأتها' : 'Created by Me'}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5c6bc0] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer hover:border-[#5c6bc0] bg-gradient-to-r from-white to-gray-50"
                    aria-label="Filter tasks by status"
                  >
                    <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                    <option value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</option>
                    <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                    <option value="overdue">{language === 'ar' ? 'متأخر' : 'Overdue'}</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5c6bc0] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer hover:border-[#5c6bc0] bg-gradient-to-r from-white to-gray-50"
                    aria-label="Sort tasks by creation date"
                  >
                    <option value="latest">Latest to Oldest</option>
                    <option value="oldest">Oldest to Latest</option>
                  </select>
                </div>
              </div>
              {loading.tasks ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedTaskList.map((task) => {
                    const isExpanded = expandedTaskId === task.id;
                    const maxLength = 120;
                    const shouldTruncate = task.description.length > maxLength;
                    const displayDescription = isExpanded || !shouldTruncate
                      ? task.description
                      : task.description.slice(0, maxLength) + '...';
                    return (
                      <div
                        key={task.id}
                        ref={el => (taskRefs.current[task.id] = el)}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-all duration-200"
                        style={{ minHeight: !isExpanded ? '140px' : 'auto' }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="w-full">
                            <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                            <p className="mt-1 text-sm text-gray-500 break-words">
                              {displayDescription}
                              {shouldTruncate && !isExpanded && (
                                <button
                                  className="ml-2 text-blue-600 hover:underline text-xs"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSummaryTaskClick(task.id);
                                  }}
                                >
                                  Read more
                                </button>
                              )}
                              {isExpanded && shouldTruncate && (
                                <button
                                  className="ml-2 text-blue-600 hover:underline text-xs"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleSummaryTaskClick(null);
                                  }}
                                >
                                  Show less
                                </button>
                              )}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <span>Assigned to: {getAssignedToArray(task.assignedTo).map(email => formatEmailDisplay(email)).join(', ')}</span>
                              <span className="flex items-center">
                                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                <span
                                  className={(() => {
                                    const today = new Date();
                                    const due = new Date(task.dueDate);
                                    const isCompleted = task.status === 'completed';
                                    if (isCompleted) return 'bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full';
                                    if (due < new Date(today.getFullYear(), today.getMonth(), today.getDate()) && !isCompleted) return 'bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full';
                                    if (due.toDateString() === today.toDateString()) return 'bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded-full';
                                    return 'bg-yellow-100 text-yellow-800 font-semibold px-2 py-0.5 rounded-full';
                                  })()}
                                >
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </span>
                              <span>Created by: {formatEmailDisplay(task.createdBy)}</span>
                              <span>Created on: {new Date(task.createdAt).toLocaleDateString()}</span>
                              {task.modifiedOn && <span>Modified On: {new Date(task.modifiedOn).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                              className={`px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5c6bc0] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer hover:border-[#5c6bc0] text-sm font-medium ${
                                task.status === 'pending' 
                                  ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                                  : task.status === 'in_progress' 
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                              title="Update task status"
                              aria-label="Update task status"
                            >
                              <option value="pending" className="bg-yellow-50 text-yellow-700">Pending</option>
                              <option value="in_progress" className="bg-blue-50 text-blue-700">In Progress</option>
                              <option value="completed" className="bg-green-50 text-green-700">Completed</option>
                            </select>
                            {user && getAssignedToArray(task.assignedTo).includes(user?.email || user?.uid || '') && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleEditTask(task);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title="Edit Task"
                              >
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteTask(task.id);
                                }}
                                className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                                title="Delete Task"
                              >
                                {language === 'ar' ? 'حذف' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Pagination Controls for Task List */}
                  {totalTaskListPages > 1 && (
                    <div className="flex justify-center items-center mt-4 space-x-2">
                      <button
                        className="flex items-center px-4 py-2 rounded-full bg-white border border-blue-500 text-blue-600 font-semibold shadow-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed ripple-button"
                        onClick={e => { e.preventDefault(); setTaskListPage(p => Math.max(1, p - 1)); }}
                        disabled={taskListPage === 1}
                        aria-label="Previous page"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        {language === 'ar' ? 'السابق' : 'Previous'}
                      </button>
                      <span className="mx-2 text-sm font-medium text-gray-700">Page {taskListPage} of {totalTaskListPages}</span>
                      <button
                        className="flex items-center px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed ripple-button"
                        onClick={e => { e.preventDefault(); setTaskListPage(p => Math.min(totalTaskListPages, p + 1)); }}
                        disabled={taskListPage === totalTaskListPages}
                        aria-label="Next page"
                      >
                        {language === 'ar' ? 'التالي' : 'Next'}
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
            {renderEditTaskForm()}
          </div>
        </div>
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div className="space-y-6">
          {/* Discussion Info Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 text-center">
              <h3 className="text-sm font-semibold text-gray-900">{language === 'ar' ? 'أكثر المناقشات تعليقًا' : 'Most Discussed Topic'}</h3>
              <p className="text-lg font-bold text-blue-600">{mostDiscussed ? mostDiscussed.title : 'None'}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 text-center">
              <h3 className="text-sm font-semibold text-gray-900">{language === 'ar' ? 'آخر تعليق' : 'Latest Comment'}</h3>
              <p className="text-lg font-bold text-green-600">
                {latestComment ? formatEmailDisplay((latestComment as Comment & { discussionTitle: string }).author) : 'None'}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200 text-center">
              <h3 className="text-sm font-semibold text-gray-900">
                {language === 'ar' ? 'تم نشر آخر تعليق في' : 'Last Comment Posted On'}
              </h3>
              <p className="text-lg font-bold text-purple-600">
                {latestComment ? new Date((latestComment as Comment & { discussionTitle: string }).createdAt).toLocaleDateString() : 'None'}
              </p>
            </div>
          </div>

          {/* Start a Discussion Card */}
          <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-lg shadow-md p-6 border border-blue-100 hover:shadow-lg transition-all duration-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              {language === 'ar' ? 'ابدأ مناقشة' : 'Start a Discussion'}
            </h3>
            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-700">
                  {language === 'ar' ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-blue-200 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={language === 'ar' ? 'أدخل عنوان المناقشة' : 'Enter discussion title'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700">
                  {language === 'ar' ? 'المحتوى' : 'Content'}
                </label>
                <textarea
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-blue-200 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  placeholder={language === 'ar' ? 'شارك أفكارك وأفكارك...' : 'Share your thoughts and ideas...'}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading.submit}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ripple-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                  {loading.submit 
                    ? (language === 'ar' ? 'جاري النشر...' : 'Posting...') 
                    : (language === 'ar' ? 'ابدأ المناقشة' : 'Start Discussion')}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Discussions</h2>
              {loading.discussions ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {paginatedDiscussions.map((discussion) => (
                    <div key={discussion.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{discussion.title}</h3>
                          <p className="mt-1 text-sm text-gray-500">Posted by {formatEmailDisplay(discussion.author)} on {new Date(discussion.createdAt).toLocaleDateString()}</p>
                          <p className="mt-2 text-gray-700">{discussion.content}</p>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setSelectedDiscussion(discussion)}
                            className="px-4 py-2 bg-gradient-to-r from-[#5c6bc0] via-[#3949ab] to-[#283593] text-white rounded-lg hover:from-[#3949ab] hover:via-[#283593] hover:to-[#1a237e] transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ripple-button"
                          >
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                            View Comments
                          </button>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteDiscussion(discussion.id);
                            }}
                            className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium ripple-button"
                            title="Delete Discussion"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      
                      {/* Comments Section */}
                      {selectedDiscussion?.id === discussion.id && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="font-medium mb-2">Comments</h4>
                          <div className="space-y-4">
                            {discussion.comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{formatEmailDisplay(comment.author)}</p>
                                    <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <p className="mt-1 text-gray-700">{comment.content}</p>
                              </div>
                            ))}
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={language === 'ar' ? 'أدخل اسم المستند' : 'Add a comment...'}
                                className="flex-1 rounded-md border border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-gray-900"
                              />
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAddComment(discussion.id.toString(), newComment);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ripple-button"
                                title="Add comment"
                                aria-label="Add comment"
                              >
                                <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
                                <span className="sr-only">Add comment</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Pagination Controls for Discussions */}
                  {totalDiscussionPages > 1 && (
                    <div className="flex justify-center items-center mt-4 space-x-2">
                      <button
                        className="flex items-center px-4 py-2 rounded-full bg-white border border-blue-500 text-blue-600 font-semibold shadow-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed ripple-button"
                        onClick={e => { e.preventDefault(); setDiscussionPage(p => Math.max(1, p - 1)); }}
                        disabled={discussionPage === 1}
                        aria-label="Previous page"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        Previous
                      </button>
                      <span className="mx-2 text-sm font-medium text-gray-700">Page {discussionPage} of {totalDiscussionPages}</span>
                      <button
                        className="flex items-center px-4 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed ripple-button"
                        onClick={e => { e.preventDefault(); setDiscussionPage(p => Math.min(totalDiscussionPages, p + 1)); }}
                        disabled={discussionPage === totalDiscussionPages}
                        aria-label="Next page"
                      >
                        Next
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Document Info Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{language === 'ar' ? 'ملخص المستندات' : 'Document Summary'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'آخر تحديث' : 'Most Recent Update'}</p>
                <p className="text-lg font-medium">
                  {(() => {
                    if (!documents.length) return 'None';
                    const recentDoc = documents.reduce((a, b) => new Date(a.modifiedOn) > new Date(b.modifiedOn) ? a : b);
                    return new Date(recentDoc.modifiedOn).toLocaleDateString();
                  })()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'تم التحديث بواسطة' : 'Updated By'}</p>
                <p className="text-lg font-medium">
                  {(() => {
                    if (!documents.length) return 'None';
                    const recentDoc = documents.reduce((a, b) => new Date(a.modifiedOn) > new Date(b.modifiedOn) ? a : b);
                    return getUsernameFromEmail(recentDoc.author);
                  })()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'أحدث مستند' : 'Latest Document'}</p>
                <p className="text-lg font-medium">
                  {(() => {
                    if (!documents.length) return 'None';
                    const recentDoc = documents.reduce((a, b) => new Date(a.modifiedOn) > new Date(b.modifiedOn) ? a : b);
                    return recentDoc.name;
                  })()}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Documents</p>
                <p className="text-lg font-medium">{documents.length}</p>
              </div>
            </div>
          </div>

          {/* Add a Document Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 rounded-lg shadow-md p-6 border border-emerald-100 hover:shadow-lg transition-all duration-200">
            <h3 className="text-lg font-semibold text-emerald-900 mb-4">
              {language === 'ar' ? 'إضافة مستند' : 'Add a Document'}
            </h3>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-emerald-700">
                  {language === 'ar' ? 'اسم المستند' : 'Document Name'}
                </label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder={language === 'ar' ? 'أدخل اسم المستند' : 'Enter document name'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-700">
                  {language === 'ar' ? 'رابط المستند' : 'Document Link'}
                </label>
                <input
                  type="url"
                  value={newDocument.link}
                  onChange={(e) => setNewDocument({ ...newDocument, link: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder={language === 'ar' ? 'أدخل رابط المستند' : 'Enter document URL'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-700">
                  {language === 'ar' ? 'الإصدار' : 'Version'}
                </label>
                <input
                  type="text"
                  value={newDocument.version}
                  onChange={(e) => setNewDocument({ ...newDocument, version: e.target.value })}
                  className="mt-1 block w-full rounded-md border-2 border-emerald-200 bg-white px-3 py-2 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder={language === 'ar' ? 'مثال: v1.0، 2.1.0' : 'e.g., v1.0, 2.1.0'}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading.submit}
                  className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 text-white rounded-lg hover:from-emerald-700 hover:via-green-700 hover:to-lime-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ripple-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  {loading.submit 
                    ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...') 
                    : (language === 'ar' ? 'إضافة المستند' : 'Add Document')}
                </button>
              </div>
            </form>
          </div>

          {/* Document Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Compliance Documentation</h2>
              {loading.documents ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الاسم' : 'Name'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الرابط' : 'Link'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الإصدار' : 'Version'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'تم التحديث بواسطة' : 'Updated By'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {language === 'ar' ? 'الإجراءات' : 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <a href={doc.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {doc.link}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.version}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(doc.modifiedOn).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getUsernameFromEmail(doc.author)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleOpenUpdateModal(doc)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              {language === 'ar' ? 'تحديث' : 'Update'}
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              {language === 'ar' ? 'حذف' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Document Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Update Document</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateDocument(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Document Link</label>
                <input
                  type="url"
                  value={updateDocLink}
                  onChange={(e) => setUpdateDocLink(e.target.value)}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  title="Document Link"
                  placeholder={language === 'ar' ? 'أدخل الرابط الجديد' : 'Enter new link'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Update Reason</label>
                <textarea
                  value={updateDocReason}
                  onChange={(e) => setUpdateDocReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  required
                  title="Update Reason"
                  placeholder={language === 'ar' ? 'أدخل سبب التحديث' : 'Enter reason for update'}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Update Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCollab; 