import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Paper,
  Alert,
  IconButton,
  Collapse,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  TextField,
  LinearProgress,
  Button,
  Slider,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAuth } from '../contexts/AuthContext';
import RiskAssessmentForm from './RiskAssessmentForm';
import RiskAssessmentHistory from './RiskAssessmentHistory';
import RiskHeatMap from './RiskHeatMap';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid
} from 'recharts';
import { teal, orange, red, yellow, green, blue, grey } from '@mui/material/colors';
import Popover from '@mui/material/Popover';
import TablePagination from '@mui/material/TablePagination';
import OutlinedInput from '@mui/material/OutlinedInput';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MuiTooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/Download';
import html2canvas from 'html2canvas';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

interface Requirement {
  id: string;
  title: string;
  risk_score: number;
  risk_level: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`risk-tabpanel-${index}`}
      aria-labelledby={`risk-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface AssessmentHistoryEntry {
  id: number;
  risk_name: string;
  date: string;
  user_name: string;
  hazard_assessments: any;
  risk_level?: string;
}

interface RemediateRow {
  id: number;
  riskName: string;
  riskLevel: string;
  assessedBy: string;
  remediateAction: string;
  assignedTo: string;
  dueBy: string;
  progress: number;
  comment: string;
  isEditing: boolean;
  lastUpdatedBy?: string;
  _showFullRemediateAction?: boolean;
}

// Helper to calculate risk level from hazard assessments (matching Assessment History table logic)
const getOverallRiskLevelForDashboard = (hazard_assessments: any) => {
  const entries = Object.values(hazard_assessments || {});
  const applicable = entries.filter((data: any) => !isDomainNotApplicable(data));
  if (applicable.length === 0) return 'Minimal';
  const avgLikelihood = applicable.reduce((a: number, b: any) => a + (typeof b.likelihood === 'number' ? b.likelihood : 0), 0) / applicable.length;
  const avgConsequence = applicable.reduce((a: number, b: any) => a + (typeof b.consequence === 'number' ? b.consequence : 0), 0) / applicable.length;
  const score = (avgLikelihood + avgConsequence) / 2;
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Minimal';
};

// Helper to check if a domain is not applicable
const isDomainNotApplicable = (data: any) => data && (data.notApplicable === true || data.notApplicable === 'true');

// Add after domainLabels:
type DomainLabel =
  | 'Cyber Security'
  | 'Physical Security'
  | 'Personnel Security'
  | 'Supply Chain Security'
  | 'Natural Hazards';

const RiskAssessmentDashboard: React.FC = () => {
  const { token, user, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRiskLevelInfo, setShowRiskLevelInfo] = useState(false);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
  const [showRiskLevelDialog, setShowRiskLevelDialog] = useState(false);
  const [remediateRows, setRemediateRows] = useState<RemediateRow[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryEntry[]>([]);
  const [userList, setUserList] = useState<string[]>([]);
  const [trendInfoAnchor, setTrendInfoAnchor] = useState<null | HTMLElement>(null);
  const [deleteRemediateDialogOpen, setDeleteRemediateDialogOpen] = useState(false);
  const [deleteRemediateId, setDeleteRemediateId] = useState<number | null>(null);
  const [deleteRemediateConfirm, setDeleteRemediateConfirm] = useState('');
  const [deleteRemediateError, setDeleteRemediateError] = useState('');
  const [deleteRemediateLoading, setDeleteRemediateLoading] = useState(false);
  const [riskMgmtInfoAnchor, setRiskMgmtInfoAnchor] = useState<null | HTMLElement>(null);
  const [remediateFilters, setRemediateFilters] = useState({
    riskName: '',
    assessedBy: '',
    remediateAction: '',
    assignedTo: '',
    dueBy: '',
    progress: '',
    comment: '',
    lastUpdatedBy: '',
  });
  const [remediatePage, setRemediatePage] = useState(0);
  const [remediateRowsPerPage, setRemediateRowsPerPage] = useState(20);
  const [riskTrendData, setRiskTrendData] = useState([]);
  const [domainRiskLevelData, setDomainRiskLevelData] = useState([]);
  const [riskDistributionData, setRiskDistributionData] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      const data: any = await apiGet('/api/requirements');
      if (Array.isArray(data)) {
        setRequirements(data);
        setUserList(data.map(user => user.email));
      } else {
        setRequirements([]);
        setUserList([]);
        console.error('API did not return an array:', data);
      }
    } catch (err) {
      setError('Failed to load requirements');
      if (err instanceof Error) {
        console.error('Error fetching requirements:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRequirementSelect = (requirementId: string) => {
    setSelectedRequirement(requirementId);
    setTabValue(1); // Switch to assessment form tab
  };

  // Helper function to get username from email
  const getUsernameFromEmail = (email: string) => {
    if (!email) return '-';
    // If it's already a username (no @), return as is
    if (!email.includes('@')) return email;
    // Otherwise, return the part before @
    return email.split('@')[0];
  };

  // Update the syncRemediationActions function
  const syncRemediationActions = async (history: any[]) => {
    if (!selectedRequirement) return;
    // Fetch current remediation actions from backend
    let backendRows: any[] = [];
    try {
      backendRows = await apiGet(`/api/remediation-actions/${selectedRequirement}`);
    } catch {}

    // Map of backend risk_name for quick lookup
    const backendByRiskName = new Map(backendRows.map((r: any) => [r.risk_name, r]));

    // For each assessment history entry, if not in backend, POST it
    const sourceHistory = history || assessmentHistory;
    for (const a of sourceHistory as AssessmentHistoryEntry[]) {
      if (!backendByRiskName.has(a.risk_name)) {
        // Get the risk level using the same calculation as Assessment History
        const riskLevel = getOverallRiskLevelForDashboard(a.hazard_assessments);

        // POST to backend
        try {
          const payload = {
            requirement_id: selectedRequirement,
            risk_name: a.risk_name,
            risk_level: riskLevel,
            assessed_by: a.user_name,
            remediate_action: '',
            assigned_to: '',
            due_by: '',
            progress: 0,
            comment: '',
            last_updated_by: '',
          };
          const { id } = await apiPost('/api/remediation-actions', payload);
          backendRows.push({ ...payload, id });
        } catch (err) {
          // Optionally handle error
        }
      } else {
        // Update existing backend row with recalculated risk level
        const existingRow = backendByRiskName.get(a.risk_name);
        const newRiskLevel = getOverallRiskLevelForDashboard(a.hazard_assessments);
        
        if (existingRow.risk_level !== newRiskLevel) {
          try {
            await apiPut(`/api/remediation-actions/${existingRow.id}`, {
              risk_name: existingRow.risk_name,
              risk_level: newRiskLevel,
              assessed_by: existingRow.assessed_by,
              remediate_action: existingRow.remediate_action,
              assigned_to: existingRow.assigned_to,
              due_by: existingRow.due_by,
              progress: existingRow.progress,
              comment: existingRow.comment,
              last_updated_by: existingRow.last_updated_by
            });
            // Update the local backend row
            existingRow.risk_level = newRiskLevel;
          } catch (err) {
            console.error('Error updating risk level:', err);
          }
        }
      }
    }
    
    // Create a map of assessment history for quick risk level lookup
    const assessmentMap = new Map(sourceHistory.map((a: any) => [a.risk_name, a]));
    
    // After syncing, update remediateRows with backendRows, using dynamic risk level calculation
    setRemediateRows(backendRows.map(row => {
      const correspondingAssessment = assessmentMap.get(row.risk_name);
      const dynamicRiskLevel = correspondingAssessment ? 
        getOverallRiskLevelForDashboard(correspondingAssessment.hazard_assessments) : 
        row.risk_level;
        
      return {
        id: row.id,
        riskName: row.risk_name,
        riskLevel: dynamicRiskLevel, // Use dynamic calculation
        assessedBy: row.assessed_by,
        remediateAction: row.remediate_action,
        assignedTo: row.assigned_to,
        dueBy: row.due_by,
        progress: row.progress,
        comment: row.comment,
        lastUpdatedBy: getUsernameFromEmail(row.last_updated_by),
        isEditing: false
      };
    }));
  };

  const refreshAssessmentHistory = async () => {
    if (!selectedRequirement) return;
    try {
      const data = await apiGet(`/api/risk-assessment/history/${selectedRequirement}`);
      setAssessmentHistory(data);
      // After updating assessmentHistory, re-sync Remediate & Actions
      await syncRemediationActions(data);
    } catch (err) {
      // Optionally handle error
    }
  };

  const handleAssessmentComplete = async () => {
    fetchRequirements();
    await refreshAssessmentHistory(); // Ensure assessment history is up to date after new assessment
    setTabValue(2); // Switch to Assessment History tab
  };

  const handleRemediateEdit = (id: number) => {
    setRemediateRows(rows => rows.map(row => row.id === id ? { ...row, isEditing: true } : row));
  };
  const handleRemediateSave = async (id: number) => {
    try {
      const row = remediateRows.find(r => r.id === id);
      if (!row) return;

      // Get the current user's email
      const currentUserEmail = user?.email || '';

      await apiPut(`/api/remediation-actions/${id}`, {
        risk_name: row.riskName,
        risk_level: row.riskLevel,
        assessed_by: row.assessedBy,
        remediate_action: row.remediateAction,
        assigned_to: row.assignedTo,
        due_by: row.dueBy,
        progress: row.progress,
        comment: row.comment,
        last_updated_by: currentUserEmail
      });

      // Update local state with the username
      setRemediateRows(rows => rows.map(r => r.id === id ? { 
        ...r, 
        isEditing: false,
        lastUpdatedBy: getUsernameFromEmail(currentUserEmail)
      } : r));

      // Send notification to assigned user if changed
      if (row.assignedTo) {
        try {
          await apiPost('/api/notifications', {
            user: row.assignedTo,
            type: 'remediation_assigned',
            message: `You have been assigned to remediate the risk: "${row.riskName}"`,
          });
        } catch (err) {
          console.error('Error sending notification:', err);
        }
      }

      // Show success message using Snackbar
      setSnackbar({
        open: true,
        message: 'Changes saved successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error saving remediation action:', err);
      setSnackbar({
        open: true,
        message: 'Failed to save changes. Please try again.',
        severity: 'error'
      });
    }
  };
  const handleRemediateChange = (id: number, field: string, value: string | number) => {
    setRemediateRows(rows => rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  // Fetch all users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data: any[] = await apiGet('/api/team/users');
        // Sort users A-Z by email for consistent dropdown ordering
        const sortedUsers = data.map(user => user.email).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setUserList(sortedUsers);
        console.log('Fetched users for Remediate & Actions:', sortedUsers);
      } catch (err) {
        if (err instanceof Error) {
          console.error('Error fetching users:', err);
        }
      }
    };
    fetchUsers();
  }, [token]);

  const handleTrendInfoOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTrendInfoAnchor(event.currentTarget);
  };
  const handleTrendInfoClose = () => {
    setTrendInfoAnchor(null);
  };
  const trendInfoOpen = Boolean(trendInfoAnchor);

  const handleRemediateDeleteClick = (id: number) => {
    setDeleteRemediateId(id);
    setDeleteRemediateConfirm('');
    setDeleteRemediateError('');
    setDeleteRemediateDialogOpen(true);
  };
  const handleRemediateDeleteCancel = () => {
    setDeleteRemediateDialogOpen(false);
    setDeleteRemediateId(null);
    setDeleteRemediateConfirm('');
    setDeleteRemediateError('');
  };
  const handleRemediateDeleteConfirm = async () => {
    if (deleteRemediateConfirm !== 'DELETE') {
      setDeleteRemediateError('You must type DELETE to confirm.');
      return;
    }
    if (!deleteRemediateId || !selectedRequirement) return;
    setDeleteRemediateLoading(true);
    try {
      // Find the row to get the risk name
      const row = remediateRows.find(r => r.id === deleteRemediateId);
      if (!row) throw new Error('Remediation action not found');
      
      await apiDelete(`/api/remediation-actions/by-risk-name-and-requirement/${encodeURIComponent(row.riskName)}/${encodeURIComponent(selectedRequirement)}`);
      
      // Close the dialog and reset state
      setDeleteRemediateDialogOpen(false);
      setDeleteRemediateId(null);
      setDeleteRemediateConfirm('');
      setDeleteRemediateError('');
      
      // Refresh the data from the backend
      const data = await apiGet(`/api/remediation-actions/${selectedRequirement}`);
      setRemediateRows(data.map((row: any) => ({
        id: row.id,
        riskName: row.risk_name,
        riskLevel: row.risk_level,
        assessedBy: row.assessed_by,
        remediateAction: row.remediate_action,
        assignedTo: row.assigned_to,
        dueBy: row.due_by,
        progress: row.progress,
        comment: row.comment,
        lastUpdatedBy: getUsernameFromEmail(row.last_updated_by),
        isEditing: false
      })));
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteRemediateError(err instanceof Error ? err.message : 'Failed to delete remediation action.');
    } finally {
      setDeleteRemediateLoading(false);
    }
  };

  const handleRiskMgmtInfoOpen = (event: React.MouseEvent<HTMLElement>) => {
    setRiskMgmtInfoAnchor(event.currentTarget);
  };
  const handleRiskMgmtInfoClose = () => {
    setRiskMgmtInfoAnchor(null);
  };
  const riskMgmtInfoOpen = Boolean(riskMgmtInfoAnchor);

  useEffect(() => {
    if (selectedRequirement) {
      refreshAssessmentHistory();
    }
    // eslint-disable-next-line
  }, [selectedRequirement]);

  // Filtering logic
  const filteredRemediateRows = remediateRows.filter(row =>
    (!remediateFilters.riskName || row.riskName.toLowerCase().includes(remediateFilters.riskName.toLowerCase())) &&
    (!remediateFilters.assessedBy || row.assessedBy.toLowerCase().includes(remediateFilters.assessedBy.toLowerCase())) &&
    (!remediateFilters.remediateAction || (row.remediateAction || '').toLowerCase().includes(remediateFilters.remediateAction.toLowerCase())) &&
    (!remediateFilters.assignedTo || (row.assignedTo || '').toLowerCase().includes(remediateFilters.assignedTo.toLowerCase())) &&
    (!remediateFilters.dueBy || (row.dueBy || '').includes(remediateFilters.dueBy)) &&
    (!remediateFilters.progress || String(row.progress).includes(remediateFilters.progress)) &&
    (!remediateFilters.comment || (row.comment || '').toLowerCase().includes(remediateFilters.comment.toLowerCase())) &&
    (!remediateFilters.lastUpdatedBy || (row.lastUpdatedBy || '').toLowerCase().includes(remediateFilters.lastUpdatedBy.toLowerCase()))
  );
  const paginatedRemediateRows =
    remediateRowsPerPage === -1
      ? filteredRemediateRows
      : filteredRemediateRows.slice(remediatePage * remediateRowsPerPage, remediatePage * remediateRowsPerPage + remediateRowsPerPage);

  // Filter out "Not Applicable" domains from the data
  const filterApplicableDomains = (data: any[]) => {
    return data.filter(item => {
      const hazardAssessments = JSON.parse(item.hazard_assessments || '{}');
      return Object.entries(hazardAssessments).some(([_, assessment]: [string, any]) => 
        assessment && !assessment.notApplicable
      );
    });
  };

  const handleDownloadCard = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        backgroundColor: null,
        logging: false,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `${fileName}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (error) {
      console.error('Error downloading card:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Calculate overall risk score and level from all assessments
  let overallScore = 0;
  let overallLevel = 'Minimal';
  if (assessmentHistory.length > 0) {
    let totalScore = 0;
    let count = 0;
    assessmentHistory.forEach(a => {
      const assessments = Object.values(a.hazard_assessments || {}) as any[];
      let avgLikelihood = 0, avgConsequence = 0;
      if (assessments.length) {
        avgLikelihood = assessments.reduce((sum, h) => sum + ((h as any).likelihood || 0), 0) / assessments.length;
        avgConsequence = assessments.reduce((sum, h) => sum + ((h as any).consequence || 0), 0) / assessments.length;
      }
      const score = (avgLikelihood + avgConsequence) / 2;
      totalScore += score;
      count++;
    });
    overallScore = Math.round(totalScore / count);
    if (overallScore >= 80) overallLevel = 'Critical';
    else if (overallScore >= 60) overallLevel = 'High';
    else if (overallScore >= 40) overallLevel = 'Medium';
    else if (overallScore >= 20) overallLevel = 'Low';
  }

  // --- Risk Distribution by Domain Data ---
  const domainLabels: Record<string, string> = {
    cyber_security: 'Cyber Security',
    physical_security: 'Physical Security',
    personnel_security: 'Personnel Security',
    supply_chain_security: 'Supply Chain Security',
    natural_hazards: 'Natural Hazards',
  };
  const domains = Object.keys(domainLabels);
  // Ensure riskDistributionByDomain is typed for type safety
  const riskDistributionByDomain: { domain: DomainLabel; count: number }[] = domains.map(domain => {
    let count = 0;
    assessmentHistory.forEach(a => {
      const h = a.hazard_assessments?.[domain];
      if (h && !isDomainNotApplicable(h)) count++;
    });
    return { domain: domainLabels[domain] as DomainLabel, count };
  });

  // --- Not-Applicable by Domain Data ---
  const notApplicableByDomain = domains.map(domain => {
    let count = 0;
    assessmentHistory.forEach(a => {
      const h = a.hazard_assessments?.[domain];
      if (h && isDomainNotApplicable(h)) count++;
    });
    return { domain: domainLabels[domain], count };
  });

  // Helper function to get user display name
  const getUserDisplayName = (user: any): string => {
    if (!user) return '-';
    if (typeof user === 'string') return user;
    if (typeof user === 'object') {
      if (user.email) return user.email;
      if (user.displayName) return user.displayName;
      if (user.uid) return user.uid;
    }
    return '-';
  };

  return (
    <Box sx={{ width: '85vw', minHeight: '100vh', bgcolor: 'background.default', mx: 'auto', p: { xs: 2, md: 6 }, direction: 'ltr', textAlign: 'left' }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Risk Management Dashboard
        </Typography>
        {/* Help Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
          <HelpOutlineIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Help & Guidance
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <button
              onClick={() => setShowInstructionsDialog(true)}
              style={{
                background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              How to Use the Risk Assessment Dashboard
            </button>
            <button
              onClick={() => setShowRiskLevelDialog(true)}
              style={{
                background: 'linear-gradient(90deg, #43a047 0%, #66bb6a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              How Risk Level is Calculated in Assessment History
            </button>
          </Box>
        </Box>
        {/* Dialogs for Help Buttons */}
        <Dialog open={showInstructionsDialog} onClose={() => setShowInstructionsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>How to Use the Risk Assessment Dashboard</DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>
              Understanding Risk Assessment & Dashboard Tabs
            </Typography>
            <Typography variant="body2" paragraph>
              The dashboard is organized into several tabs, each supporting a different part of your risk management workflow:
            </Typography>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>
                <strong>Risk Overview:</strong> View all requirements and their current risk levels. Click any requirement to select it for further assessment and reporting.
              </li>
              <li>
                <strong>New Assessment:</strong> After selecting a requirement, perform a new risk assessment by rating each risk factor, adding comments, and submitting. This updates the risk score and history.
              </li>
              <li>
                <strong>Assessment History:</strong> See the full history of risk assessments for the selected requirement, including risk score trends, detailed breakdowns, and previous comments.
              </li>
              <li>
                <strong>Remediate & Actions:</strong> Track and manage remediation actions for each risk. Assign actions, set due dates, update progress, and add comments. All changes are saved and visible to all users.
              </li>
              <li>
                <strong>Monitoring & Reporting:</strong> Visualize your risk landscape with dynamic charts, cards, and tables. See risk trends over time, risk level distribution, action status, progress distribution, and recent critical/high risks. All visuals update automatically as data changes.
              </li>
              <li>
                <strong>SOCI Requirements:</strong> Reference key SOCI Act and CIRMP requirements and guidance for compliance.
              </li>
            </ol>
            <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
              How to Use the Dashboard Effectively
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Start in <b>Risk Overview</b> to select a requirement and see its current risk posture.</li>
              <li>Use <b>New Assessment</b> to perform and submit a new risk assessment for the selected requirement.</li>
              <li>Review <b>Assessment History</b> to track how risk scores and comments have changed over time.</li>
              <li>Manage and update actions in <b>Remediate & Actions</b> to ensure risks are being addressed and progress is tracked.</li>
              <li>Monitor your overall risk and action status in <b>Monitoring & Reporting</b> using the interactive charts and cards.</li>
              <li>Consult <b>SOCI Requirements</b> for compliance references and best practices.</li>
            </ul>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <b>Tip:</b> All charts and cards in Monitoring & Reporting update automatically as you add or edit assessments and actions. Use this tab for high-level reporting and to spot trends or issues that need attention.
            </Typography>
          </DialogContent>
        </Dialog>
        <Dialog open={showRiskLevelDialog} onClose={() => setShowRiskLevelDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>How Risk Level is Calculated in Assessment History</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" gutterBottom>
              The <b>overall Risk Level</b> for each assessment is calculated as follows:
            </Typography>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Collect all <b>hazard domains</b> that were assessed (e.g., Cyber Security, Personnel Security, etc.).</li>
              <li>For each domain, get the <b>likelihood</b> and <b>consequence</b> values (0–100).</li>
              <li>Average the likelihoods and average the consequences across all assessed domains.</li>
              <li>The <b>overall risk score</b> is the average of these two averages:</li>
            </ol>
            <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, my: 1, fontFamily: 'monospace', fontSize: 15 }}>
              Overall Risk Score = (Average Likelihood + Average Consequence) / 2
            </Box>
            <Typography variant="body2" gutterBottom>
              The <b>Risk Level</b> is then determined by this score:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><b>Critical:</b> 80–100</li>
              <li><b>High:</b> 60–79</li>
              <li><b>Medium:</b> 40–59</li>
              <li><b>Low:</b> 20–39</li>
              <li><b>Minimal:</b> 0–19</li>
            </ul>
            <Typography variant="body2" sx={{ mt: 2 }} gutterBottom>
              <b>Example:</b><br />
              If you have 3 domains with likelihoods 60, 80, 40 and consequences 70, 90, 50:
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, my: 1, fontFamily: 'monospace', fontSize: 15 }}>
              Average Likelihood = (60+80+40)/3 = 60<br />
              Average Consequence = (70+90+50)/3 = 70<br />
              Overall Risk Score = (60+70)/2 = 65<br />
              Risk Level = High
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }} gutterBottom>
              <b>Tips for Users:</b>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Risk Level reflects the <b>average risk</b> across all domains you assessed.</li>
                <li>To highlight a specific domain, look at the individual domain risk chips in the Hazard Assessments column.</li>
                <li>Use detailed comments and controls for each domain to provide context for your assessment.</li>
                <li>Consistent scoring helps track risk trends over time.</li>
              </ul>
            </Typography>
          </DialogContent>
        </Dialog>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            TabIndicatorProps={{ style: { display: 'none' } }}
            sx={{
              minHeight: 48,
              width: '100%',
              '& .MuiTabs-scrollButtons': {
                display: 'none',
              },
              '& .MuiTabs-scroller': {
                overflow: 'hidden',
                '& .MuiTabs-flexContainer': {
                  flexWrap: 'nowrap',
                  justifyContent: 'space-between',
                  width: '100%',
                },
              },
              '& .MuiTab-root': {
                minHeight: 48,
                flex: 1,
                fontWeight: 600,
                borderRadius: 3,
                mx: 0.5,
                color: '#5c6bc0',
                background: 'linear-gradient(90deg, #e8eaf6 0%, #c5cae9 100%)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                transform: 'none',
                '&:hover': {
                  background: 'linear-gradient(90deg, #c5cae9 0%, #e8eaf6 100%)',
                  color: '#3949ab',
                  boxShadow: '0 4px 12px rgba(92, 107, 192, 0.15)',
                  '&::after': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                },
                '&.Mui-selected': {
                  color: '#fff',
                  background: 'linear-gradient(90deg, #5c6bc0 0%, #3949ab 100%)',
                  boxShadow: '0 4px 12px rgba(92, 107, 192, 0.2)',
                },
                '&.Mui-disabled': {
                  color: '#9e9e9e !important',
                  background: 'linear-gradient(90deg, #f5f5f5 0%, #e0e0e0 100%) !important',
                  opacity: 1,
                  cursor: 'not-allowed',
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #f5f5f5 0%, #e0e0e0 100%) !important',
                    transform: 'none',
                    boxShadow: 'none',
                  },
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(92,107,192,0.1) 100%)',
                  opacity: 0,
                  transform: 'scale(0.8)',
                  transition: 'all 0.3s ease',
                },
                '&:active::after': {
                  opacity: 1,
                  transform: 'scale(1.5)',
                  transition: 'all 0.2s ease',
                },
              },
            }}
          >
            <Tab 
              label="Risk Overview" 
              className="risk-tab-button"
            />
            <Tab 
              label="New Assessment" 
              disabled={!selectedRequirement}
              className="risk-tab-button"
            />
            <Tab 
              label="Assessment History" 
              disabled={!selectedRequirement}
              className="risk-tab-button"
            />
            <Tab 
              label="Remediate & Actions" 
              disabled={!selectedRequirement}
              className="risk-tab-button"
            />
            <Tab 
              label="Monitoring & Reporting" 
              disabled={!selectedRequirement}
              className="risk-tab-button"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <RiskHeatMap
            requirements={requirements}
            onRequirementSelect={handleRequirementSelect}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {selectedRequirement ? (
            <Box>
              <Paper sx={{
                p: 2,
                mb: 2,
                bgcolor: '#e3f2fd',
                color: '#1565c0',
                borderLeft: '6px solid #1976d2',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2
              }}>
                <InfoOutlinedIcon sx={{ fontSize: 32, color: '#1976d2', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Important Note</Typography>
                  <Typography variant="body2">
                    Once an assessment is completed,it <b>cannot be edited</b>. If changes are required, please request your administrator to delete the assessment and you initiate a new one.<br />
                    For drafts or working notes, use the Excel Sheet provided by Critical AI. Only submit assessments when information is confirmed by the relevant responsible teams or individuals.
                  </Typography>
                </Box>
              </Paper>
              <RiskAssessmentForm
                requirementId={selectedRequirement}
                onAssessmentComplete={handleAssessmentComplete}
              />
            </Box>
          ) : (
            <Typography>Select a requirement from the Risk Overview to perform an assessment.</Typography>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {selectedRequirement ? (
            <RiskAssessmentHistory
              requirementId={selectedRequirement}
              onAssessmentDeleted={refreshAssessmentHistory}
            />
          ) : (
            <Typography>Select a requirement from the Risk Overview to view its assessment history.</Typography>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {selectedRequirement ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Remediate & Actions
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Risk Name</TableCell>
                      <TableCell>Risk Level</TableCell>
                      <TableCell>Remediate Action</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Due By</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Last Updated By</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRemediateRows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.riskName}</TableCell>
                        <TableCell>
                          {row.isEditing ? (
                            <TextField
                              value={row.riskLevel}
                              onChange={e => handleRemediateChange(row.id, 'riskLevel', e.target.value)}
                              size="small"
                              fullWidth
                            />
                          ) : (
                            <Chip 
                              label={row.riskLevel} 
                              size="small" 
                              sx={{
                                bgcolor: row.riskLevel === 'Critical' ? '#d32f2f' : 
                                         row.riskLevel === 'High' ? '#f57c00' : 
                                         row.riskLevel === 'Medium' ? '#fbc02d' : 
                                         row.riskLevel === 'Low' ? '#4caf50' : '#2196f3',
                                color: row.riskLevel === 'Medium' ? '#000' : 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 2,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                '&:hover': {
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ minWidth: 320, maxWidth: 480, width: 400 }}>
                          {row.isEditing ? (
                            <TextField
                              value={row.remediateAction}
                              onChange={e => handleRemediateChange(row.id, 'remediateAction', e.target.value)}
                              size="small"
                              fullWidth
                              multiline
                              minRows={3}
                              maxRows={8}
                              inputProps={{ style: { fontSize: 14 } }}
                            />
                          ) : (
                            <Box sx={{ position: 'relative', width: '100%' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  whiteSpace: row._showFullRemediateAction ? 'pre-line' : 'nowrap',
                                  overflow: row._showFullRemediateAction ? 'visible' : 'hidden',
                                  textOverflow: row._showFullRemediateAction ? 'unset' : 'ellipsis',
                                  maxWidth: '100%',
                                  fontSize: 14,
                                  cursor: row.remediateAction && row.remediateAction.length > 80 ? 'pointer' : 'default',
                                  display: 'block',
                                  minHeight: 24
                                }}
                                onClick={() => {
                                  if (row.remediateAction && row.remediateAction.length > 80) {
                                    setRemediateRows(rows => rows.map(r => r.id === row.id ? { ...r, _showFullRemediateAction: !r._showFullRemediateAction } : r));
                                  }
                                }}
                              >
                                {row.remediateAction}
                              </Typography>
                              {row.remediateAction && row.remediateAction.length > 80 && (
                                <Button
                                  size="small"
                                  sx={{ position: 'absolute', right: 0, bottom: 0, fontSize: 12, minWidth: 0, p: 0.5 }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setRemediateRows(rows => rows.map(r => r.id === row.id ? { ...r, _showFullRemediateAction: !r._showFullRemediateAction } : r));
                                  }}
                                >
                                  {row._showFullRemediateAction ? 'Show less' : 'Show more'}
                                </Button>
                              )}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.isEditing ? (
                            <Select
                              value={row.assignedTo || ''}
                              onChange={e => handleRemediateChange(row.id, 'assignedTo', e.target.value)}
                              size="small"
                              fullWidth
                              displayEmpty
                              MenuProps={{
                                PaperProps: {
                                  style: {
                                    maxHeight: 200, // Limit height to show ~5 items
                                  },
                                },
                              }}
                            >
                              <MenuItem value=""><em>Unassigned</em></MenuItem>
                              {userList.map(u => (
                                <MenuItem key={u} value={getUsernameFromEmail(u)}>{getUsernameFromEmail(u)}</MenuItem>
                              ))}
                            </Select>
                          ) : (
                            getUsernameFromEmail(row.assignedTo)
                          )}
                        </TableCell>
                        <TableCell>
                          {row.isEditing ? (
                            <TextField
                              type="date"
                              value={row.dueBy || ''}
                              onChange={e => handleRemediateChange(row.id, 'dueBy', e.target.value)}
                              size="small"
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          ) : (
                            row.dueBy
                          )}
                        </TableCell>
                        <TableCell>
                          {row.isEditing ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Slider
                                value={typeof row.progress === 'number' ? row.progress : 0}
                                onChange={(_, value) => handleRemediateChange(row.id, 'progress', value as number)}
                                min={0}
                                max={100}
                                step={1}
                                valueLabelDisplay="auto"
                                sx={{ width: 100 }}
                              />
                              <Typography variant="body2" sx={{ minWidth: 32 }}>{row.progress ?? 0}%</Typography>
                            </Box>
                          ) : (
                            <Box sx={{ minWidth: 120 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={row.progress ?? 0} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: row.progress >= 100 ? 'success.main' : 'primary.main'
                                  }
                                }} 
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: row.progress >= 100 ? 'success.main' : row.progress > 0 ? 'primary.main' : 'text.secondary' }}>
                                  {row.progress == null || row.progress === 0
                                    ? 'Not Started'
                                    : row.progress === 100
                                      ? 'Completed 100%'
                                      : `Work in Progress ${row.progress}%`}
                                </Typography>
                                {row.dueBy && new Date(row.dueBy) < new Date() && row.progress < 100 && (
                                  <Chip label="Overdue" color="error" size="small" />
                                )}
                              </Box>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.isEditing ? (
                            <TextField
                              value={row.lastUpdatedBy}
                              onChange={e => handleRemediateChange(row.id, 'lastUpdatedBy', e.target.value)}
                              size="small"
                              fullWidth
                            />
                          ) : (
                            getUsernameFromEmail(row.lastUpdatedBy ?? '')
                          )}
                        </TableCell>
                        <TableCell>
                          {row.isEditing ? (
                            <>
                              <Button
                                onClick={() => handleRemediateSave(row.id)}
                                color="success"
                                size="small"
                                variant="contained"
                                sx={{ mr: 1 }}
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => setRemediateRows(rows => rows.map(r => r.id === row.id ? { ...r, isEditing: false } : r))}
                                color="inherit"
                                size="small"
                                variant="outlined"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <IconButton
                              onClick={() => handleRemediateEdit(row.id)}
                              color="primary"
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Typography>Select a requirement from the Risk Overview to view monitoring & reporting.</Typography>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          {selectedRequirement ? (
            <Box>
              {/* Summary Cards Row */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  md: '1fr 1fr 1fr 1fr',
                },
                gap: 3,
                mb: 3,
                alignItems: 'stretch',
              }}>
                <Paper id="total-risks-card" sx={{ p: 3, minWidth: 180, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(90deg, #e3ffe8 0%, #b8f2e6 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Total Risks</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#222' }}>
                    {Array.from(new Set(assessmentHistory.map(a => a.risk_name))).length}
                  </Typography>
                </Paper>
                <Paper id="critical-risks-card" sx={{ p: 3, minWidth: 180, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(90deg, #ffe3e3 0%, #ffb8b8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#d32f2f', mb: 1 }}>Critical Risks</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                    {assessmentHistory.filter(a => getOverallRiskLevelForDashboard(a.hazard_assessments) === 'Critical').length}
                  </Typography>
                </Paper>
                <Paper id="high-risks-card" sx={{ p: 3, minWidth: 180, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(90deg, #fffbe3 0%, #fff7b8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f57c00', mb: 1 }}>High Risks</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#f57c00' }}>
                    {assessmentHistory.filter(a => getOverallRiskLevelForDashboard(a.hazard_assessments) === 'High').length}
                  </Typography>
                </Paper>
                <Paper id="medium-risks-card" sx={{ p: 3, minWidth: 180, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(90deg, #fffde3 0%, #fff7b8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fbc02d', mb: 1 }}>Medium Risks</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#fbc02d' }}>
                    {assessmentHistory.filter(a => getOverallRiskLevelForDashboard(a.hazard_assessments) === 'Medium').length}
                  </Typography>
                </Paper>
                <Paper id="low-risks-card" sx={{ p: 3, minWidth: 180, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(90deg, #e3ffe3 0%, #b8ffb8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>Low Risks</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                    {assessmentHistory.filter(a => getOverallRiskLevelForDashboard(a.hazard_assessments) === 'Low').length}
                  </Typography>
                </Paper>
                <Paper id="open-actions-card" sx={{ p: 3, minWidth: 180, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(90deg, #e3f0ff 0%, #b8d6ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>Open Actions</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {remediateRows.filter(r => r.progress < 100).length}
                  </Typography>
                </Paper>
                <Paper id="completed-actions-card" sx={{ p: 3, minWidth: 180, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(90deg, #e3ffe3 0%, #b8ffb8 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#388e3c', mb: 1 }}>Completed Actions</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#388e3c' }}>
                    {remediateRows.filter(r => r.progress === 100).length}
                  </Typography>
                </Paper>
                <Paper id="overdue-actions-card" sx={{ p: 3, minWidth: 220, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(90deg, #f3e3ff 0%, #dab8ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#d32f2f', mb: 1 }}>Overdue Actions</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                    {remediateRows.filter(r => r.dueBy && r.progress < 100 && new Date(r.dueBy) < new Date()).length}
                  </Typography>
                </Paper>
              </Box>
              {/* Charts */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 4,
                mb: 4,
              }}>
                {/* Risk Level Distribution */}
                <Paper 
                  id="risk-distribution-chart"
                  sx={{ p: 3, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #f0f4ff 0%, #e3ffe8 100%)', position: 'relative' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BarChartIcon sx={{ color: '#1976d2', mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Risk Level Distribution</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleDownloadCard('risk-distribution-chart', 'risk-distribution')}
                        sx={{
                          color: '#1976d2',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <MuiTooltip title="Shows the number of risks at each risk level (Critical, High, etc.) for this requirement. Helps you see your overall risk profile.">
                        <span><IconButton size="small"><InfoOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></span>
                      </MuiTooltip>
                    </Box>
                  </Box>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={['Critical','High','Medium','Low','Minimal'].map((level, i) => ({
                      level,
                      count: assessmentHistory.filter(a => getOverallRiskLevelForDashboard(a.hazard_assessments) === level).length,
                      color: [red[500], orange[500], yellow[700], teal[400], green[500]][i]
                    }))}
                    >
                      <XAxis dataKey="level" />
                      <YAxis allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e7ef' }} />
                      <Bar dataKey="count" radius={[8,8,0,0]}>
                        {['Critical','High','Medium','Low','Minimal'].map((level, i) => (
                          <Cell key={level} fill={`url(#barGrad${level})`} />
                        ))}
                      </Bar>
                      <defs>
                        <linearGradient id="barGradCritical" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d32f2f" /><stop offset="100%" stopColor="#ffb8b8" /></linearGradient>
                        <linearGradient id="barGradHigh" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f57c00" /><stop offset="100%" stopColor="#ffe3b8" /></linearGradient>
                        <linearGradient id="barGradMedium" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffc107" /><stop offset="100%" stopColor="#fffbe3" /></linearGradient>
                        <linearGradient id="barGradLow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4caf50" /><stop offset="100%" stopColor="#e3ffe8" /></linearGradient>
                        <linearGradient id="barGradMinimal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2196f3" /><stop offset="100%" stopColor="#e3f0ff" /></linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
                {/* Action Status Pie Chart */}
                <Paper 
                  id="action-status-chart"
                  sx={{ p: 3, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #e3f0ff 0%, #e3ffe8 100%)', position: 'relative' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PieChartIcon sx={{ color: '#1976d2', mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Action Status</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleDownloadCard('action-status-chart', 'action-status')}
                        sx={{
                          color: '#1976d2',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <MuiTooltip title="Shows the proportion of remediation actions that are open vs. completed. Use this to track progress on risk mitigation.">
                        <span><IconButton size="small"><InfoOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></span>
                      </MuiTooltip>
                    </Box>
                  </Box>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <defs>
                        <radialGradient id="pieOpen" cx="50%" cy="50%" r="80%"><stop offset="0%" stopColor="#1976d2" /><stop offset="100%" stopColor="#b8d6ff" /></radialGradient>
                        <radialGradient id="pieCompleted" cx="50%" cy="50%" r="80%"><stop offset="0%" stopColor="#388e3c" /><stop offset="100%" stopColor="#b8ffb8" /></radialGradient>
                      </defs>
                      <Pie
                        data={[
                          { name: 'Open', value: remediateRows.filter(r => r.progress < 100).length },
                          { name: 'Completed', value: remediateRows.filter(r => r.progress === 100).length }
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        <Cell key="open" fill="url(#pieOpen)" />
                        <Cell key="completed" fill="url(#pieCompleted)" />
                      </Pie>
                      <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e7ef' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
                {/* Action Progress Distribution Bar Chart */}
                <Paper 
                  id="action-progress-chart"
                  sx={{ p: 3, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #fffbe3 0%, #e3ffe8 100%)', position: 'relative' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ShowChartIcon sx={{ color: '#f57c00', mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Action Progress Distribution</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleDownloadCard('action-progress-chart', 'action-progress')}
                        sx={{
                          color: '#1976d2',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <MuiTooltip title="Shows how many actions are at each progress stage (e.g., 0-20%, 20-40%). Helps you spot bottlenecks in remediation.">
                        <span><IconButton size="small"><InfoOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></span>
                      </MuiTooltip>
                    </Box>
                  </Box>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[
                      { range: '0-20%', count: remediateRows.filter(r => r.progress >= 0 && r.progress < 20).length },
                      { range: '20-40%', count: remediateRows.filter(r => r.progress >= 20 && r.progress < 40).length },
                      { range: '40-60%', count: remediateRows.filter(r => r.progress >= 40 && r.progress < 60).length },
                      { range: '60-80%', count: remediateRows.filter(r => r.progress >= 60 && r.progress < 80).length },
                      { range: '80-100%', count: remediateRows.filter(r => r.progress >= 80 && r.progress <= 100).length },
                    ]}>
                      <XAxis dataKey="range" />
                      <YAxis allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e7ef' }} />
                      <Bar dataKey="count" radius={[8,8,0,0]}>
                        <Cell fill="url(#barProg1)" />
                        <Cell fill="url(#barProg2)" />
                        <Cell fill="url(#barProg3)" />
                        <Cell fill="url(#barProg4)" />
                        <Cell fill="url(#barProg5)" />
                      </Bar>
                      <defs>
                        <linearGradient id="barProg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d32f2f" /><stop offset="100%" stopColor="#ffb8b8" /></linearGradient>
                        <linearGradient id="barProg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f57c00" /><stop offset="100%" stopColor="#ffe3b8" /></linearGradient>
                        <linearGradient id="barProg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffc107" /><stop offset="100%" stopColor="#fffbe3" /></linearGradient>
                        <linearGradient id="barProg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4caf50" /><stop offset="100%" stopColor="#e3ffe8" /></linearGradient>
                        <linearGradient id="barProg5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2196f3" /><stop offset="100%" stopColor="#e3f0ff" /></linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
                {/* Risk Trend Over Time Line Chart */}
                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #f0f4ff 0%, #e3ffe8 100%)', position: 'relative' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ShowChartIcon sx={{ color: '#1976d2', mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Risk Trend</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleDownloadCard('risk-trend-chart', 'risk-trend')}
                        sx={{
                          color: '#1976d2',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <MuiTooltip title="Shows how risk levels have changed over time.">
                        <span><IconButton size="small"><InfoOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></span>
                      </MuiTooltip>
                    </Box>
                  </Box>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={(() => {
                      // Group by date, show max score per day
                      const grouped: Record<string, number> = {};
                      assessmentHistory.forEach(a => {
                        let date = a.date;
                        if (date) {
                          if (date.includes('T')) date = date.split('T')[0];
                          else if (date.includes(' ')) date = date.split(' ')[0];
                        } else {
                          date = '';
                        }
                        const assessments = Object.values(a.hazard_assessments || {}) as any[];
                        let avgLikelihood = 0, avgConsequence = 0;
                        if (assessments.length) {
                          avgLikelihood = assessments.reduce((sum, h) => sum + ((h as any).likelihood || 0), 0) / assessments.length;
                          avgConsequence = assessments.reduce((sum, h) => sum + ((h as any).consequence || 0), 0) / assessments.length;
                        }
                        const score = (avgLikelihood + avgConsequence) / 2;
                        if (!grouped[date]) grouped[date] = score;
                        else if (score > grouped[date]) grouped[date] = score;
                      });
                      return Object.entries(grouped).map(([date, score]) => ({ date, score }));
                    })()}>
                      <XAxis dataKey="date" tickFormatter={date => (typeof date === 'string' ? date : '')} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e7ef' }} labelFormatter={label => `Date: ${typeof label === 'string' ? label : ''}`} />
                      <Line type="monotone" dataKey="score" stroke="#1976d2" strokeWidth={3} dot={{ r: 5, fill: '#1976d2', stroke: '#fff', strokeWidth: 2, filter: 'drop-shadow(0 2px 6px #1976d2aa)' }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
                {/* Donut Chart: Risk Distribution by Domain */}
                <Paper 
                  id="risk-distribution-by-domain-chart"
                  sx={{ p: 3, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #e3ffe8 0%, #f0f4ff 100%)', position: 'relative' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DonutLargeIcon sx={{ color: '#1976d2', mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Risk Distribution by Domain</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleDownloadCard('risk-distribution-by-domain-chart', 'risk-distribution-by-domain')}
                        sx={{
                          color: '#1976d2',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <MuiTooltip title="Shows how many times each domain was assessed (excluding not-applicable). Helps you see which domains are most frequently assessed.">
                        <span><IconButton size="small"><InfoOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></span>
                      </MuiTooltip>
                    </Box>
                  </Box>
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <defs>
                        <linearGradient id="pieCyberSecurity" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1976d2" />
                          <stop offset="100%" stopColor="#64b5f6" />
                        </linearGradient>
                        <linearGradient id="piePhysicalSecurity" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f57c00" />
                          <stop offset="100%" stopColor="#ffb74d" />
                        </linearGradient>
                        <linearGradient id="piePersonnelSecurity" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#388e3c" />
                          <stop offset="100%" stopColor="#81c784" />
                        </linearGradient>
                        <linearGradient id="pieSupplyChainSecurity" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#7b1fa2" />
                          <stop offset="100%" stopColor="#ba68c8" />
                        </linearGradient>
                        <linearGradient id="pieNaturalHazards" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#d32f2f" />
                          <stop offset="100%" stopColor="#ef5350" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={riskDistributionByDomain}
                        dataKey="count"
                        nameKey="domain"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {riskDistributionByDomain.map((entry, index) => {
                          const domainToGradient: Record<DomainLabel, string> = {
                            'Cyber Security': 'pieCyberSecurity',
                            'Physical Security': 'piePhysicalSecurity',
                            'Personnel Security': 'piePersonnelSecurity',
                            'Supply Chain Security': 'pieSupplyChainSecurity',
                            'Natural Hazards': 'pieNaturalHazards',
                          };
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#${domainToGradient[entry.domain as DomainLabel]})`}
                            />
                          );
                        })}
                      </Pie>
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ marginTop: 64 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
                {/* Stacked Bar Chart: Risk Level by Domain */}
                <Paper 
                  id="risk-level-by-domain-chart"
                  sx={{ p: 3, borderRadius: 3, boxShadow: 3, background: 'linear-gradient(135deg, #f0f4ff 0%, #e3ffe8 100%)', position: 'relative' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BarChartIcon sx={{ color: '#1976d2', mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Risk Level by Domain</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleDownloadCard('risk-level-by-domain-chart', 'risk-level-by-domain')}
                        sx={{
                          color: '#1976d2',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <MuiTooltip title="Shows the distribution of risk levels across different domains.">
                        <span><IconButton size="small"><InfoOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></span>
                      </MuiTooltip>
                    </Box>
                  </Box>
                  {/* Legend above chart - now center aligned */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'center' }}>
                    <Box sx={{ width: 18, height: 18, bgcolor: '#d32f2f', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">Critical</Typography>
                    <Box sx={{ width: 18, height: 18, bgcolor: '#f57c00', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">High</Typography>
                    <Box sx={{ width: 18, height: 18, bgcolor: '#ffc107', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">Medium</Typography>
                    <Box sx={{ width: 18, height: 18, bgcolor: '#4caf50', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">Low</Typography>
                    <Box sx={{ width: 18, height: 18, bgcolor: '#2196f3', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">Minimal</Typography>
                  </Box>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={(() => {
                        // Build data: [{ domain: 'Cyber Security', Critical: 2, High: 3, ... }, ...]
                        const domains = ['cyber_security', 'physical_security', 'personnel_security', 'supply_chain_security', 'natural_hazards'];
                        const levels = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
                        const domainLabels: Record<string, string> = {
                          cyber_security: 'Cyber Security',
                          physical_security: 'Physical Security',
                          personnel_security: 'Personnel Security',
                          supply_chain_security: 'Supply Chain Security',
                          natural_hazards: 'Natural Hazards',
                        };
                        const data = domains.map(domain => {
                          const counts: Record<string, number> = {};
                          levels.forEach(level => { counts[level] = 0; });
                          assessmentHistory.forEach(a => {
                            const h = a.hazard_assessments?.[domain];
                            if (h && !isDomainNotApplicable(h)) {
                              const score = (h.likelihood + h.consequence) / 2;
                              let riskLevel = 'Minimal';
                              if (score >= 80) riskLevel = 'Critical';
                              else if (score >= 60) riskLevel = 'High';
                              else if (score >= 40) riskLevel = 'Medium';
                              else if (score >= 20) riskLevel = 'Low';
                              counts[riskLevel]++;
                            }
                          });
                          return { domain: domainLabels[domain], ...counts };
                        });
                        return data;
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }} // Increased bottom margin for angled labels
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="domain" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="Critical" stackId="a" fill="#d32f2f" />
                      <Bar dataKey="High" stackId="a" fill="#f57c00" />
                      <Bar dataKey="Medium" stackId="a" fill="#ffc107" />
                      <Bar dataKey="Low" stackId="a" fill="#4caf50" />
                      <Bar dataKey="Minimal" stackId="a" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
                {/* Risks by Month (Heatmap) */}
                <Paper 
                  id="risk-heatmap"
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    boxShadow: 3, 
                    background: 'linear-gradient(135deg, #f0f4ff 0%, #e3ffe8 100%)', 
                    position: 'relative',
                    gridColumn: '1 / -1' // Make it span full width
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarMonthIcon sx={{ color: '#1976d2', mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Risk Heat Map</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        onClick={() => handleDownloadCard('risk-heatmap', 'risk-heatmap')}
                        sx={{
                          color: '#1976d2',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <MuiTooltip title="Shows the distribution of risks across domains and time periods.">
                        <span><IconButton size="small"><InfoOutlinedIcon sx={{ color: '#1976d2' }} /></IconButton></span>
                      </MuiTooltip>
                    </Box>
                  </Box>
                  <Box sx={{ overflowX: 'auto', width: '100%' }}>
                    {(() => {
                      // Domains and months
                      const domains = ['cyber_security', 'physical_security', 'personnel_security', 'supply_chain_security', 'natural_hazards'];
                      const domainLabels: Record<string, string> = {
                        cyber_security: 'Cyber Security',
                        physical_security: 'Physical Security',
                        personnel_security: 'Personnel Security',
                        supply_chain_security: 'Supply Chain Security',
                        natural_hazards: 'Natural Hazards',
                      };
                      const today = new Date();
                      const months: string[] = [];
                      for (let i = 11; i >= 0; i--) {
                        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                      }
                      // Build matrix: domain x month
                      const matrix: Record<string, Record<string, number>> = {};
                      domains.forEach(domain => {
                        matrix[domain] = {};
                        months.forEach(month => { matrix[domain][month] = 0; });
                      });
                      assessmentHistory.forEach(a => {
                        let date = a.date;
                        if (date) {
                          if (date.includes('T')) date = date.split('T')[0];
                          else if (date.includes(' ')) date = date.split(' ')[0];
                        }
                        const month = date ? date.slice(0, 7) : '';
                        domains.forEach(domain => {
                          const h = a.hazard_assessments?.[domain];
                          if (h && !isDomainNotApplicable(h)) {
                            if (months.includes(month)) {
                              matrix[domain][month]++;
                            }
                          }
                        });
                      });
                      // Color scale: 0 = #e0e7ef, 1 = #b8d6ff, 2 = #1976d2, 3+ = #d32f2f
                      const getColor = (count: number) => count === 0 ? '#e0e7ef' : count === 1 ? '#b8d6ff' : count === 2 ? '#1976d2' : '#d32f2f';
                      const cellWidth = 60;
                      return (
                        <Box>
                          {/* Month headers */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: `140px repeat(${months.length}, ${cellWidth}px)`, mb: 1 }}>
                            <Box />
                            {months.map(month => (
                              <Box key={month} sx={{ width: cellWidth, textAlign: 'center', minWidth: cellWidth }}>
                                <Typography variant="caption" noWrap>{new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' })}</Typography>
                              </Box>
                            ))}
                          </Box>
                          {/* Data rows */}
                          {domains.map(domain => (
                            <Box key={domain} sx={{ display: 'grid', gridTemplateColumns: `140px repeat(${months.length}, ${cellWidth}px)`, alignItems: 'center', mb: 0.5 }}>
                              <Box sx={{ width: 140, pr: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{domainLabels[domain]}</Typography>
                              </Box>
                              {months.map(month => (
                                <Box key={month} title={`${matrix[domain][month]} risk${matrix[domain][month] !== 1 ? 's' : ''}`}
                                  sx={{ width: cellWidth, height: 36, bgcolor: getColor(matrix[domain][month]), borderRadius: 1, border: '1px solid #e0e7ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="caption" sx={{ color: matrix[domain][month] > 1 ? '#fff' : '#333', fontWeight: 600 }}>{matrix[domain][month] || ''}</Typography>
                              </Box>
                            ))}
                            </Box>
                          ))}
                          {/* Legend */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                            <Typography variant="caption">Legend:</Typography>
                            <Box sx={{ width: 24, height: 24, bgcolor: '#e0e7ef', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">0</Typography>
                            <Box sx={{ width: 24, height: 24, bgcolor: '#b8d6ff', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">1</Typography>
                            <Box sx={{ width: 24, height: 24, bgcolor: '#1976d2', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">2</Typography>
                            <Box sx={{ width: 24, height: 24, bgcolor: '#d32f2f', borderRadius: 1, border: '1px solid #e0e7ef' }} /> <Typography variant="caption">3+</Typography>
                          </Box>
                        </Box>
                      );
                    })()}
                  </Box>
                </Paper>
                {/* Not-Applicable by Domain (row of chips) */}
                <Paper 
                  id="not-applicable-card"
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    boxShadow: 3, 
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', 
                    position: 'relative', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <InfoOutlinedIcon sx={{ color: '#888', mr: 1 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#555' }}>Not-Applicable by Domain</Typography>
                    </Box>
                    <IconButton
                      onClick={() => handleDownloadCard('not-applicable-card', 'not-applicable-domains')}
                      sx={{
                        color: '#888',
                        '&:hover': { backgroundColor: 'rgba(136, 136, 136, 0.1)' }
                      }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {notApplicableByDomain.map(({ domain, count }) => (
                      <Chip key={domain} label={`${domain}: ${count}`} sx={{ bgcolor: '#888', color: 'white', fontWeight: 600, fontSize: 15, px: 2, py: 1, borderRadius: 2 }} />
                    ))}
                  </Box>
                </Paper>
              </Box>
              {/* Table: Critical & High Risks */}
              <Paper sx={{ p: 2, mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom>Recent Critical & High Risks</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Risk Name</TableCell>
                        <TableCell>Assessed By</TableCell>
                        <TableCell>Risk Level</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assessmentHistory
                        .filter(a => {
                          const level = getOverallRiskLevelForDashboard(a.hazard_assessments);
                          return level === 'Critical' || level === 'High';
                        })
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 10)
                        .map(a => {
                          const level = getOverallRiskLevelForDashboard(a.hazard_assessments);
                          return (
                            <TableRow 
                              key={a.id}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                  transition: 'all 0.2s ease-in-out',
                                  cursor: 'pointer'
                                }
                              }}
                            >
                              <TableCell>{a.date?.split('T')[0]}</TableCell>
                              <TableCell>{a.risk_name}</TableCell>
                              <TableCell>{getUsernameFromEmail(a.user_name)}</TableCell>
                              <TableCell>
                                <Chip label={level} color={level === 'Critical' ? 'error' : level === 'High' ? 'warning' : 'info'} size="small" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          ) : (
            <Typography>Select a requirement from the Risk Overview to view monitoring & reporting.</Typography>
          )}
        </TabPanel>
      </Box>
      {/* Add Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RiskAssessmentDashboard; 