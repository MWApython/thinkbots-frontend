import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ReferenceDot } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import html2pdf from 'html2pdf.js';
import { useAuth } from '../contexts/AuthContext';
import { getUsernameFromEmail } from '../utils/emailHelpers';
import { useLanguage } from '../contexts/LanguageContext';
import { generatePDF } from '../utils/pdfGenerator';
import { apiGet, apiPost, apiDelete, apiPut } from '../utils/api';

// Add CSS for line-clamp functionality
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles into the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = lineClampStyles;
  document.head.appendChild(styleElement);
}


// Advanced API Configuration Types
interface ApiConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  auth: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    credentials?: {
      username?: string;
      password?: string;
      token?: string;
      key?: string;
      keyLocation?: 'header' | 'query';
    };
  };
  dataMapping: Record<string, string>;
  refreshInterval: number; // in milliseconds
  pagination: {
    enabled: boolean;
    pageSize: number;
    pageParam: string;
    totalParam: string;
  };
}

interface ApiConnection {
  id: string;
  name: string;
  config: ApiConfig;
  lastSync: Date | null;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
}



const STATUS_COLORS: Record<string, string> = {
  'Compliant': '#22c55e',
  'Work-In-Progress': '#eab308',
  'Non-compliant': '#ef4444'
};

// Modern color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
  'GV': '#6366f1',                        // Indigo
  'ID': '#e11d48',                        // Rose-600
  'PR': '#059669',                        // Emerald-600
  'DE': '#d97706',                        // Amber-600
  'RS': '#dc2626',                        // Red-600
  'RC': '#7c3aed',                        // Violet-600
};


// Modern color palette for priorities
const PRIORITY_COLORS: Record<string, string> = {
  'Critical': '#dc2626',  // Red-600
  'High': '#ea580c',      // Orange-600
  'Medium': '#ca8a04',    // Yellow-600
  'Low': '#16a34a'        // Green-600
};

// Modern color palette for hazard domains (16 distinct colors)
const HAZARD_DOMAIN_COLORS: Record<string, string> = {
  'Cybersecurity Threats': '#dc2626',                           // Red-600
  'Physical Intrusion or Sabotage': '#ea580c',                  // Orange-600
  'Insider Threats (Personnel)': '#d97706',                     // Amber-600
  'Natural Disasters (e.g., floods, bushfires)': '#65a30d',     // Lime-600
  'Supply Chain Disruption': '#16a34a',                         // Green-600
  'Pandemics / Health Emergencies': '#059669',                  // Emerald-600
  'Infrastructure Failure / Power Outage': '#0891b2',           // Cyan-600
  'Theft or Loss of Critical Assets': '#0284c7',                // Sky-600
  'Terrorism & Hostile Actor Risk': '#2563eb',                  // Blue-600
  'Data Integrity & Confidentiality Risks': '#4f46e5',         // Indigo-600
  'Communication System Failure': '#7c3aed',                    // Violet-600
  'IT Systems Misuse or Misconfiguration': '#9333ea',           // Purple-600
  'Unlawful Access or Tampering': '#c026d3',                    // Fuchsia-600
  'Logistics & Transport Disruption': '#db2777',                // Pink-600
  'Environmental or Biohazard Risks': '#be185d',                // Rose-600
  'Other': '#6b7280'                                             // Gray-500
};

const CATEGORIES = [
  'GV - GOVERN',
  'ID - IDENTIFY',
  'PR - PROTECT',
  'DE - DETECT',
  'RS - RESPOND',
  'RC - RECOVER'
];

const HAZARD_DOMAINS = [
  'GV.OC - Organizational Context',
  'GV.RM - Risk Management Strategy',
  'ID.AM - Asset Management',
  'ID.BE - Business Environment',
  'PR.AC - Identity Management, Authentication, and Access Control',
  'PR.DS - Data Security',
  'DE.CM - Security Continuous Monitoring',
  'DE.DP - Detection Process',
  'RS.RP - Response Planning',
  'RS.CO - Communications',
  'RC.RP - Recovery Planning',
  'RC.IM - Improvements'
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Compliant', 'Work-In-Progress', 'Non-compliant'];
const COMMENTS = ['Fully implemented', 'In progress', 'Needs attention', 'Compliant', 'Pending review', 'Annual training completed', 'New assessment framework needed', 'Real-time monitoring implemented', 'Updating response procedures', 'BCP tested and validated', 'Review pending', 'Documentation needed', 'Ongoing monitoring'];

// Define the CustomRequirement type at the top of the file
interface CustomRequirement {
  id?: string;
  requirement: string;
  sociActReference?: string;
  category: string;
  hazardDomain: string;
  status: string;
  priority: string;
  comments: string;
  lastUpdated?: string;
  lastUpdatedBy?: string;
  accessEndDate?: string;
  isSystemEntry?: boolean;
}

// Removed unused trendData variable

const getStatusCounts = (data: any[]) => {
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const status = item.status || 'Unknown';
    counts[status] = (counts[status] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

const getCategoryCounts = (data: any[]) => {
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const category = item.category || 'Unknown';
    counts[category] = (counts[category] || 0) + 1;
  });
   // Ensure all categories are included, even if count is 0
   const allCategories = CATEGORIES.reduce((acc, category) => {
     acc[category] = counts[category] || 0;
     return acc;
   }, {} as Record<string, number>);
  return Object.entries(allCategories).map(([name, value]) => ({ name, value }));
};

const getPriorityCounts = (data: any[]) => {
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const priority = item.priority || 'Unknown';
    counts[priority] = (counts[priority] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

const getHazardDomainCounts = (data: any[]) => {
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const hazardDomain = item.hazardDomain || 'Unknown';
    counts[hazardDomain] = (counts[hazardDomain] || 0) + 1;
  });
  // Ensure all hazard domains are included, even if count is 0
  const allHazardDomains = HAZARD_DOMAINS.reduce((acc, domain) => {
    acc[domain] = counts[domain] || 0;
    return acc;
  }, {} as Record<string, number>);
  return Object.entries(allHazardDomains).map(([name, value]) => ({ name, value }));
};

function generateSampleData(count: number) {
  const data = [];
  for (let i = 1; i <= count; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
    const hazardDomain = HAZARD_DOMAINS[Math.floor(Math.random() * HAZARD_DOMAINS.length)];
    const comments = COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
    const lastUpdated = `2024-03-${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}`;
    // Use a persistent UUID for each sample requirement
    const id = uuidv4();
    data.push({
      id,
      requirement: `Requirement ${i}`,
      status: status,
      category: category,
      hazardDomain: hazardDomain,
      sociActReference: `Part ${Math.floor(Math.random() * 5) + 2}${String.fromCharCode(65 + Math.floor(Math.random() * 8))}, Section ${Math.floor(Math.random() * 20) + 1}`,
      guidanceReference: `Guidelines 2023-${Math.floor(Math.random() * 10) + 1}`,
      lastUpdated: lastUpdated,
      comments: comments,
      priority: priority,
    });
  }
  return data;
}

// Helper to get compliance trend data from requirements (fortnightly basis)
const getComplianceTrendData = (data: any[]) => {
  // Group by fortnight (2 weeks) and count compliant/non-compliant
  const trendMap: Record<string, { compliant: number; nonCompliant: number }> = {};
  
  // Helper function to get fortnight start date (every 2 weeks from a reference point)
  const getFortnightStart = (date: Date) => {
    const d = new Date(date);
    // Use January 1, 2024 as reference point (Monday)
    const referenceDate = new Date(2024, 0, 1); // January 1, 2024
    
    // Calculate days since reference
    const daysSinceReference = Math.floor((d.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate which fortnight period this falls into
    const fortnightNumber = Math.floor(daysSinceReference / 14);
    
    // Calculate the start date of this fortnight
    const fortnightStart = new Date(referenceDate);
    fortnightStart.setDate(referenceDate.getDate() + (fortnightNumber * 14));
    fortnightStart.setHours(0, 0, 0, 0);
    
    return fortnightStart;
  };
  
  // Helper function to format fortnight label
  const formatFortnightLabel = (fortnightStart: Date) => {
    const fortnightEnd = new Date(fortnightStart);
    fortnightEnd.setDate(fortnightStart.getDate() + 13); // 14 days total (0-13)
    
    const formatDate = (date: Date) => {
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    };
    
    // If same month, show as "01/03-14/03", if different months show "28/02-13/03"
    return `${formatDate(fortnightStart)}-${formatDate(fortnightEnd)}`;
  };
  
  data.forEach(item => {
    if (!item.lastUpdated) return;
    let dateObj: Date | null = null;
    if (typeof item.lastUpdated === 'string') {
      dateObj = new Date(item.lastUpdated);
      if (isNaN(dateObj.getTime())) {
        // Try locale string (DD/MM/YYYY or MM/DD/YYYY)
        const parts = item.lastUpdated.split(/[/-]/);
        if (parts.length === 3) {
          const [a, b, c] = parts.map(Number);
          dateObj = new Date(c, b - 1, a);
        }
      }
    } else if (item.lastUpdated instanceof Date) {
      dateObj = item.lastUpdated;
    }
    if (!dateObj || isNaN(dateObj.getTime())) return;
    
    const fortnightStart = getFortnightStart(dateObj);
    const fortnightKey = fortnightStart.toISOString().split('T')[0]; // Use ISO date as key for sorting
    
    if (!trendMap[fortnightKey]) {
      trendMap[fortnightKey] = { compliant: 0, nonCompliant: 0 };
    }
    if (item.status === 'Compliant') {
      trendMap[fortnightKey].compliant += 1;
    } else if (item.status === 'Non-compliant') {
      trendMap[fortnightKey].nonCompliant += 1;
    }
  });
  
  // Sort by fortnight and return with formatted labels
  const sortedFortnights = Object.keys(trendMap).sort();
  return sortedFortnights.map(fortnightKey => {
    const fortnightStart = new Date(fortnightKey);
    const fortnightLabel = formatFortnightLabel(fortnightStart);
    return { 
      month: fortnightLabel, // Keep 'month' key for compatibility with chart
      ...trendMap[fortnightKey] 
    };
  });
};

const ApiDashboard: React.FC = () => {
  const { isAdmin, token, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [filterText, setFilterText] = useState('');
  const [aiCurrentPage, setAiCurrentPage] = useState(1);
  const [aiEntriesPerPage, setAiEntriesPerPage] = useState(20);

  // State for available API fields from sample upload (used in fetchData)
  const [availableApiFields, setAvailableApiFields] = useState<string[]>([]);

  // State for column filters
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // State for sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // New state for advanced API features
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newConnection, setNewConnection] = useState<Partial<ApiConnection>>({
    name: '',
    config: {
      url: '',
      method: 'GET',
      headers: {},
      auth: { 
        type: 'none',
        credentials: {}
      },
      dataMapping: {},
      refreshInterval: 300000, // 5 minutes
      pagination: {
        enabled: false,
        pageSize: 20,
        pageParam: 'page',
        totalParam: 'total'
      }
    }
  });

  // State for validation errors in config modal
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});

  // Add state for custom requirements
  const [customRequirements, setCustomRequirements] = useState<CustomRequirement[]>([]);
  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [showEditReqModal, setShowEditReqModal] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<CustomRequirement | null>(null);
  const [newReq, setNewReq] = useState<CustomRequirement>({
    requirement: '',
    sociActReference: '',
    category: CATEGORIES[0],
    hazardDomain: HAZARD_DOMAINS[0],
    status: STATUSES[0],
    priority: PRIORITIES[0],
    comments: '',
    lastUpdated: '',
    lastUpdatedBy: '',
  });

  // Add state for AI solutions
  const [aiSolutions, setAiSolutions] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  // Add state for expanded AI solution cards
  const [openAISolutionIds, setOpenAISolutionIds] = useState<string[]>([]);

  // Add state for AI solutions filtering
  const [aiSolutionFilter, setAiSolutionFilter] = useState('');
  const [aiCategoryFilter, setAiCategoryFilter] = useState('');
  const [aiPriorityFilter, setAiPriorityFilter] = useState('');
  const [aiHazardDomainFilter, setAiHazardDomainFilter] = useState('');

  // State for comments modal and column widths
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedComments, setSelectedComments] = useState<{title: string, content: string}>({title: '', content: ''});

  interface ColumnWidths {
    requirement: number;
    nistCategory: number;
    priority: number;
    nistDomain: number;
    aiSolutions: number;
    actions: number;
    [key: string]: number; // Add index signature
  }

  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    requirement: 300,
    nistCategory: 150,
    priority: 120,
    nistDomain: 200,
    aiSolutions: 250,
    actions: 150
  });
  
  // State for column resizing
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const { t } = useLanguage();

  const toggleAISolutionCard = (id: string) => {
    setOpenAISolutionIds(prev =>
      prev.includes(id) ? prev.filter(openId => openId !== id) : [...prev, id]
    );
  };

  // Fetch connections on mount
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await apiGet('/api/connections');
        setConnections(data);
      } catch (error) {
        console.error('Error fetching connections:', error);
      }
    };
    fetchConnections();
  }, []);

  // Fetch custom requirements on mount
  useEffect(() => {
    const fetchCustomRequirements = async () => {
      try {
        const data = await apiGet('/api/custom-requirements');
        setCustomRequirements(data);
      } catch (error) {
        console.error('Error fetching custom requirements:', error);
      }
    };
    fetchCustomRequirements();
  }, []);

  // Add custom requirement
  const handleAddCustomRequirement = () => {
    const today = new Date();
    const dateOnly = today.toISOString().split('T')[0]; // This will give YYYY-MM-DD format
    
    const reqToSave = {
      ...newReq,
      lastUpdated: dateOnly
      // Do not include lastUpdatedBy; backend will set it
    };
    
    apiPost('/api/custom-requirements', reqToSave)
      .then((created) => {
        setCustomRequirements(reqs => [...reqs, created]);
        setShowAddReqModal(false);
        setNewReq({
          requirement: '',
          sociActReference: '',
          category: CATEGORIES[0],
          hazardDomain: HAZARD_DOMAINS[0],
          status: STATUSES[0],
          priority: PRIORITIES[0],
          comments: '',
          lastUpdated: '',
          lastUpdatedBy: '',
        });
      })
      .catch(error => {
        console.error('Error adding custom requirement:', error);
      });
  };

  // Add delete handler function before the return statement
  const handleDeleteRequirement = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) return;
    
    apiDelete(`/api/custom-requirements/${id}`)
      .then(() => {
        setCustomRequirements(reqs => reqs.filter(req => req.id !== id));
      })
      .catch(error => console.error('Error deleting requirement:', error));
  };

  // Add edit handler function
  const handleEditRequirement = (id: string) => {
    const requirement = customRequirements.find(req => req.id === id);
    if (requirement) {
      setEditingRequirement(requirement);
      setShowEditReqModal(true);
    }
  };

  // Add update requirement function
  const handleUpdateRequirement = () => {
    if (!editingRequirement || !editingRequirement.id) return;
    
    const today = new Date();
    const dateOnly = today.toISOString().split('T')[0];
    
    const reqToUpdate = {
      ...editingRequirement,
      lastUpdated: dateOnly
      // Do not include lastUpdatedBy; backend will set it
    };
    
    apiPut(`/api/custom-requirements/${editingRequirement.id}`, reqToUpdate)
      .then((updated) => {
        setCustomRequirements(reqs => reqs.map(req => req.id === updated.id ? updated : req));
        setShowEditReqModal(false);
        setEditingRequirement(null);
      })
      .catch(error => console.error('Error updating requirement:', error));
  };

  const saveConnection = async () => {
    console.log('Save connection clicked');
    console.log('Current newConnection state:', newConnection);
    
    const errors: Record<string, string> = {};
    if (!newConnection.name) {
      errors.name = 'Connection Name is required.';
    }
    if (!newConnection.config?.url) {
      errors.url = 'API URL is required.';
    }

    console.log('Validation errors:', errors);

    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors);
      console.log('Validation failed, not saving');
      return;
    }

    // If no errors, clear previous errors and save
    setConfigErrors({});
    console.log('Validation passed, proceeding to save');

    const connectionToSave: Partial<ApiConnection> = {
      id: newConnection.id, // Include ID if editing existing
      name: newConnection.name!,
      config: newConnection.config as ApiConfig,
    };

    console.log('Connection to save:', connectionToSave);

    try {
      console.log('Making API request to save connection');
      const savedConnection: ApiConnection = await apiPost('/api/connections', connectionToSave);

      console.log('Saved connection response:', savedConnection);

      // Update connections state with the saved connection (add or update)
      setConnections(prev => {
        const existingIndex = prev.findIndex(conn => conn.id === savedConnection.id);
        if (existingIndex > -1) {
          // Update existing
          const updatedConnections = [...prev];
          updatedConnections[existingIndex] = { ...updatedConnections[existingIndex], ...savedConnection };
           // Convert lastSync string to Date object for the updated connection
           updatedConnections[existingIndex].lastSync = updatedConnections[existingIndex].lastSync ? new Date(updatedConnections[existingIndex].lastSync as any) : null;
          return updatedConnections;
        } else {
          // Add new
          // Convert lastSync string to Date object for the new connection
          const newConnWithDate = { ...savedConnection, lastSync: savedConnection.lastSync ? new Date(savedConnection.lastSync as any) : null };
          return [...prev, newConnWithDate];
        }
      });

      console.log('Connection saved successfully, closing modal');
      setShowConfigModal(false);
      // Reset newConnection state, but keep the initial structure
      setNewConnection({
        name: '',
        config: {
          url: '',
          method: 'GET',
          headers: {},
          auth: { 
            type: 'none',
            credentials: {}
          },
          dataMapping: {},
          refreshInterval: 300000,
          pagination: {
            enabled: false,
            pageSize: 20,
            pageParam: 'page',
            totalParam: 'total'
          }
        }
      });

    } catch (err: any) {
      console.error('Error saving connection:', err);
      // Optionally, show a user-facing error message for save failure
    }
  };

  // Function to handle deleting a connection
  const deleteConnection = async (id: string) => {
    try {
      await apiDelete(`/api/connections/${id}`);
  
      // Remove the deleted connection from the state
      setConnections(prev => prev.filter(conn => conn.id !== id));
  
    } catch (err: any) {
      console.error('Error deleting connection:', err);
      // Optionally, show a user-facing error message for delete failure
    }
  };

  const handleViewSolution = async (id: string) => {
    if (!aiSolutions[id]) {
      try {
        const response = await apiGet(`/api/ai-solutions/${id}`);
        setAiSolutions(prev => ({ ...prev, [id]: response.solution }));
      } catch (error) {
        console.error('Error fetching AI solution:', error);
      }
    }
    toggleAISolutionCard(id);
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const requirement = customRequirements.find(req => req.id === id);
      if (!requirement) return;

      const content = [
        {
          title: 'Requirement Details',
          content: `
            Requirement: ${requirement.requirement}
            NIST Category: ${requirement.category}
            Priority: ${requirement.priority}
            NIST Domain: ${requirement.hazardDomain}
            AI Solution: ${aiSolutions[id] || 'No AI solution available'}
          `
        }
      ];

      await generatePDF({
        content,
        type: 'api-dashboard',
        language: 'en',
        metadata: {
          title: `AI Solution - ${requirement.requirement}`,
          date: new Date().toLocaleDateString(),
          category: requirement.category,
          priority: requirement.priority
        }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 border text-left font-semibold text-gray-700">Requirement</th>
              <th className="px-4 py-2 border text-left font-semibold text-gray-700">NIST Category</th>
              <th className="px-4 py-2 border text-left font-semibold text-gray-700">Priority</th>
              <th className="px-4 py-2 border text-left font-semibold text-gray-700">NIST Domain</th>
              <th className="px-4 py-2 border text-left font-semibold text-gray-700">AI Solutions</th>
              <th className="px-4 py-2 border text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customRequirements.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{req.requirement}</td>
                <td className="px-4 py-2 border">{req.category}</td>
                <td className="px-4 py-2 border">
                  <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                    req.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                    req.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                    req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {req.priority}
                  </span>
                </td>
                <td className="px-4 py-2 border">{req.hazardDomain}</td>
                <td className="px-4 py-2 border">
                  {aiSolutions[req.id!] ? (
                    <div className="flex flex-col space-y-2">
                      <div className="prose prose-sm max-w-none">
                        {aiSolutions[req.id!]}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">No AI solution available</span>
                  )}
                </td>
                <td className="px-4 py-2 border">
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleViewSolution(req.id!)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-semibold shadow ripple-button"
                    >
                      View Solution
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(req.id!)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-semibold shadow ripple-button"
                    >
                      Download PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApiDashboard;
