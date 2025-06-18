import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tooltip,
  Stack,
  Collapse,
  IconButton,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import { generatePDF } from '../utils/pdfGenerator';
import ReactDOM from 'react-dom';

interface ControlRecommendation {
  id: string;
  name: string;
  description: string;
  cost: string;
  benefit: string;
  implementationTime: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  residualRisk: string;
  monitoringRequirements: string;
  category: string;
  implementationSteps: string;
  nistCsfReference: string;
}

interface HazardAssessment {
  likelihood: number;
  consequence: number;
  materialImpact: string;
  existingControls: string;
  riskLevel: string;
}

interface HazardAssessments {
  [key: string]: HazardAssessment;
}

interface AssessmentDetails {
  context: string;
  stakeholders: string;
  riskCriteria: string;
  riskTreatment: string;
  controlValidation: string;
  effectivenessReview: string;
}

interface RiskAssessmentHistory {
  id: string;
  risk_name: string;
  date: string;
  assigned_to: string[];
  hazard_assessments: HazardAssessments;
  assessment_details: AssessmentDetails;
  comments: string;
  control_recommendations?: ControlRecommendation[];
  user_name: string;
}

interface RiskAssessmentHistoryProps {
  requirementId: string;
  view?: 'summary' | 'detailed' | 'monitoring';
  onAssessmentDeleted?: () => void;
}

const calculateRiskLevel = (likelihood: number, consequence: number) => {
  const score = (likelihood + consequence) / 2;
  if (score >= 80) return { label: 'Critical', color: '#d32f2f' };
  if (score >= 60) return { label: 'High', color: '#f57c00' };
  if (score >= 40) return { label: 'Medium', color: '#ffc107' };
  if (score >= 20) return { label: 'Low', color: '#4caf50' };
  return { label: 'Minimal', color: '#2196f3' };
};

// Add a helper function to render a print-friendly export card
interface AssessmentPDFExportProps {
  assessment: RiskAssessmentHistory;
  hazardDomainLabels: { [key: string]: string };
  calculateRiskLevel: (likelihood: number, consequence: number) => { label: string; color: string };
}
function AssessmentPDFExport({ assessment, hazardDomainLabels, calculateRiskLevel }: AssessmentPDFExportProps) {
  return (
    <div className="pdf-export" style={{ fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '0 auto', background: '#fff', padding: 24, borderRadius: 8 }}>
      <h2 style={{ color: '#1976d2', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{assessment.risk_name}</h2>
      <div style={{ color: '#333', marginBottom: 12, fontSize: 15 }}>
        <b>Assessed On:</b> {new Date(assessment.date).toLocaleString()}<br />
        <b>Assessed By:</b> {assessment.user_name || 'Unknown'}
      </div>
      <hr style={{ margin: '16px 0' }} />
      <h3 style={{ color: '#1565c0', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Hazard Assessments</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        {Object.entries(assessment.hazard_assessments || {}).map(([domain, data]) => {
          const d = data as HazardAssessment;
          const risk = calculateRiskLevel(d.likelihood, d.consequence);
          return (
            <div key={domain} style={{ minWidth: 180, background: '#f5f7fa', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #e0e0e0', display: 'inline-block' }}>
              <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{hazardDomainLabels[domain]}</div>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: risk.color,
                color: 'white',
                fontWeight: 600,
                borderRadius: 12,
                padding: '2px 12px 6px 12px',
                fontSize: 14,
                marginBottom: 6,
                minHeight: 18,
                lineHeight: 1.2
              }}>{risk.label}</span>
              <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>
                <div><b>Likelihood:</b> {d.likelihood}%</div>
                <div><b>Consequence:</b> {d.consequence}%</div>
                <div><b>Material Impact:</b> {d.materialImpact || 'No input'}</div>
                <div><b>Existing Controls:</b> {d.existingControls || 'No input'}</div>
              </div>
            </div>
          );
        })}
      </div>
      <hr style={{ margin: '16px 0' }} />
      <h3 style={{ color: '#1565c0', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Assessment Details</h3>
      <div style={{ fontSize: 15, color: '#333', marginBottom: 12 }}>
        <div><b>Context:</b> {assessment.assessment_details?.context || 'Not provided'}</div>
        <div><b>Stakeholders:</b> {assessment.assessment_details?.stakeholders || 'Not provided'}</div>
        <div><b>Risk Criteria:</b> {assessment.assessment_details?.riskCriteria || 'Not provided'}</div>
        <div><b>Risk Treatment:</b> {assessment.assessment_details?.riskTreatment || 'Not provided'}</div>
        <div><b>Control Validation:</b> {assessment.assessment_details?.controlValidation || 'Not provided'}</div>
        <div><b>Effectiveness Review:</b> {assessment.assessment_details?.effectivenessReview || 'Not provided'}</div>
      </div>
      {assessment.control_recommendations && assessment.control_recommendations.length > 0 && (
        <>
          <hr style={{ margin: '16px 0' }} />
          <h3 style={{ color: '#1565c0', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Recommendations</h3>
          <div style={{ fontSize: 15, color: '#333' }}>
            {assessment.control_recommendations.map((rec: ControlRecommendation, idx: number) => (
              <div key={rec.id || idx} style={{ marginBottom: 16, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #dee2e6' }}>
                {/* Header with name and priority */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '2px solid #e9ecef', paddingBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: '#2c3e50', fontSize: 16 }}>{rec.name}</div>
                  <span style={{
                    background: rec.priority === 'Critical' ? '#dc3545' : rec.priority === 'High' ? '#fd7e14' : rec.priority === 'Medium' ? '#ffc107' : '#28a745',
                    color: rec.priority === 'Medium' ? '#000' : 'white',
                    borderRadius: 12,
                    padding: '4px 12px',
                    fontWeight: 600,
                    fontSize: 12,
                    textAlign: 'center'
                  }}>{rec.priority}</span>
                </div>
                
                <div style={{ fontSize: 14, marginBottom: 8, color: '#495057', lineHeight: 1.5 }}>{rec.description}</div>
                
                {rec.category && (
                  <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 6, padding: '4px 8px', background: '#e3f2fd', borderRadius: 4 }}>
                    <b style={{ color: '#1976d2' }}>Category:</b> {rec.category}
                  </div>
                )}
                
                {rec.implementationSteps && (
                  <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 6, padding: '4px 8px', background: '#f3e5f5', borderRadius: 4 }}>
                    <b style={{ color: '#7b1fa2' }}>Implementation Steps:</b> {rec.implementationSteps}
                  </div>
                )}
                
                {rec.nistCsfReference && (
                  <div style={{ fontSize: 13, color: '#6c757d', marginBottom: 6, padding: '4px 8px', background: '#fff3e0', borderRadius: 4 }}>
                    <b style={{ color: '#f57c00' }}>NIST CSF 2.0 Reference:</b> {rec.nistCsfReference}
                  </div>
                )}
                
                <div style={{ fontSize: 13, color: '#6c757d', marginTop: 8, padding: '6px 8px', background: '#f1f3f4', borderRadius: 4, borderLeft: '3px solid #4caf50' }}>
                  <b style={{ color: '#2e7d32' }}>Monitoring:</b> {rec.monitoringRequirements}
                </div>
                
                {rec.cost && (
                  <div style={{ marginTop: 8, padding: '6px 0' }}>
                    <span style={{
                      background: '#fff8e1',
                      color: '#e65100',
                      borderRadius: 8,
                      padding: '2px 8px',
                      fontWeight: 500,
                      border: '1px solid #ffcc02',
                      fontSize: 12,
                      marginRight: 8
                    }}>Cost: {rec.cost}</span>
                    {rec.implementationTime && (
                      <span style={{
                        background: '#e1f5fe',
                        color: '#0277bd',
                        borderRadius: 8,
                        padding: '2px 8px',
                        fontWeight: 500,
                        border: '1px solid #29b6f6',
                        fontSize: 12
                      }}>Timeline: {rec.implementationTime}</span>
                    )}
                  </div>
                )}
                
                {rec.residualRisk && (
                  <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4, fontStyle: 'italic' }}>
                    <b>Residual Risk:</b> {rec.residualRisk}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const getUsernameFromEmail = (email: string) => {
  if (!email) return '-';
  if (!email.includes('@')) return email;
  return email.split('@')[0];
};

const RiskAssessmentHistory: React.FC<RiskAssessmentHistoryProps> = ({ requirementId, view = 'summary', onAssessmentDeleted }) => {
  const { token, isAdmin } = useAuth();
  const [assessments, setAssessments] = useState<RiskAssessmentHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);
  const riskLevelOptions = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
  const userNames = Array.from(new Set(assessments.map(a => a.user_name).filter(Boolean)));
  const riskOwners = Array.from(new Set(assessments.flatMap(a => Array.isArray(a.assigned_to) ? a.assigned_to : []).filter(Boolean)));
  const dateSortOptions = [
    { value: 'desc', label: 'New to Old' },
    { value: 'asc', label: 'Old to New' }
  ];
  const [summaryFilters, setSummaryFilters] = useState({
    name: '',
    riskLevel: [] as string[],
    assessedBy: '',
    riskOwner: '',
    date: '',
    dateSort: 'desc'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchAssessments();
    // eslint-disable-next-line
  }, [requirementId]);

  const fetchAssessments = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/risk-assessment/history/${requirementId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch assessment history');
      const data = await response.json();
      setAssessments(data);
    } catch (err) {
      setError('Failed to load assessment history');
      console.error('Error fetching assessment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const hazardDomains = [
    'cyber_security',
    'personnel_security',
    'physical_security',
    'supply_chain_security',
    'natural_hazards',
    'recovery_planning'
  ];
  const hazardDomainLabels = {
    cyber_security: 'Govern',
    personnel_security: 'Protect',
    physical_security: 'Identify',
    supply_chain_security: 'Detect',
    natural_hazards: 'Respond',
    recovery_planning: 'Recover'
  };

  // Group assessments by requirement
  const summaryData = React.useMemo(() => {
    const map: Record<string, { requirement: string; count: number; lastDate: string; latest: RiskAssessmentHistory[] }> = {};
    assessments.forEach(a => {
      const req = a.risk_name || 'Unknown Requirement';
      if (!map[req]) {
        map[req] = { requirement: req, count: 0, lastDate: '', latest: [] };
      }
      map[req].count++;
      if (!map[req].lastDate || new Date(a.date) > new Date(map[req].lastDate)) {
        map[req].lastDate = a.date;
      }
      map[req].latest.push(a);
    });
    // Only keep the latest assessment for each requirement in latest
    Object.values(map).forEach(obj => {
      obj.latest = obj.latest
        .filter(a => a.date === obj.lastDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    return Object.values(map);
  }, [assessments]);

  const filteredSummaryData = React.useMemo(() => {
    let filtered = summaryData.filter(row => {
      const latest = row.latest[0];
      const avgLikelihood = Object.values(latest.hazard_assessments || {}).reduce((a, b) => a + (b.likelihood || 0), 0) / Object.keys(latest.hazard_assessments || {}).length;
      const avgConsequence = Object.values(latest.hazard_assessments || {}).reduce((a, b) => a + (b.consequence || 0), 0) / Object.keys(latest.hazard_assessments || {}).length;
      const riskLevel = calculateRiskLevel(avgLikelihood, avgConsequence).label;
      return (
        (!summaryFilters.name || (latest.risk_name || '').toLowerCase().includes(summaryFilters.name.toLowerCase())) &&
        (!summaryFilters.riskLevel.length || summaryFilters.riskLevel.includes(riskLevel)) &&
        (!summaryFilters.assessedBy || (latest.user_name || '') === summaryFilters.assessedBy) &&
        (!summaryFilters.riskOwner || (Array.isArray(latest.assigned_to) ? latest.assigned_to.includes(summaryFilters.riskOwner) : false)) &&
        (!summaryFilters.date || (latest.date && new Date(latest.date).toLocaleDateString().includes(summaryFilters.date)))
      );
    });
    // Sort by date
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.latest[0].date).getTime();
      const dateB = new Date(b.latest[0].date).getTime();
      return summaryFilters.dateSort === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return filtered;
  }, [summaryData, summaryFilters]);

  // For monitoring, filter to only high/critical risk assessments as an example
  const monitoringSummaryData = React.useMemo(() => {
    if (view !== 'monitoring') return filteredSummaryData;
    return filteredSummaryData.filter(row => {
      const latest = row.latest[0];
      const avgLikelihood = Object.values(latest.hazard_assessments || {}).reduce((a, b) => a + (b.likelihood || 0), 0) / Object.keys(latest.hazard_assessments || {}).length;
      const avgConsequence = Object.values(latest.hazard_assessments || {}).reduce((a, b) => a + (b.consequence || 0), 0) / Object.keys(latest.hazard_assessments || {}).length;
      const riskLevel = calculateRiskLevel(avgLikelihood, avgConsequence).label;
      return riskLevel === 'High' || riskLevel === 'Critical';
    });
  }, [filteredSummaryData, view]);

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === 'All' ? -1 : parseInt(event.target.value, 10);
    setRowsPerPage(value);
    setPage(0);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteConfirm('');
    setDeleteError('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
    setDeleteConfirm('');
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('You must type DELETE to confirm.');
      return;
    }
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      // First delete the assessment
      const response = await fetch(`http://localhost:3001/api/risk-assessment/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete assessment');

      // Then delete the corresponding remediation action by risk_name and requirementId
      const assessment = assessments.find(a => a.id === deleteId);
      if (assessment) {
        const remediationResponse = await fetch(`http://localhost:3001/api/remediation-actions/by-risk-name-and-requirement/${encodeURIComponent(assessment.risk_name)}/${encodeURIComponent(requirementId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!remediationResponse.ok) {
          console.error('Failed to delete remediation action');
        }
      }

      setAssessments(prev => prev.filter(a => a.id !== deleteId));
      setDeleteDialogOpen(false);
      setDeleteId(null);
      setDeleteConfirm('');
      setDeleteError('');
      if (onAssessmentDeleted) onAssessmentDeleted();
    } catch (err) {
      setDeleteError('Failed to delete assessment.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper to check if a domain is not applicable
  const isDomainNotApplicable = (data: any) => data && (data.notApplicable === true || data.notApplicable === 'true');

  // Helper to get overall risk level, considering not applicable domains
  const getOverallRiskLevel = (hazard_assessments: any) => {
    const entries = Object.values(hazard_assessments || {});
    const applicable = entries.filter((data: any) => !isDomainNotApplicable(data));
    if (applicable.length === 0) return { label: 'Non-Applicable', color: '#888' };
    const avgLikelihood = applicable.reduce((a: number, b: any) => a + (typeof b.likelihood === 'number' ? b.likelihood : 0), 0) / applicable.length;
    const avgConsequence = applicable.reduce((a: number, b: any) => a + (typeof b.consequence === 'number' ? b.consequence : 0), 0) / applicable.length;
    return calculateRiskLevel(avgLikelihood, avgConsequence);
  };

  const handleDownloadPDF = async (assessment: RiskAssessmentHistory) => {
    try {
      const content = [
        {
          title: `${assessment.risk_name} (Assessed on ${new Date(assessment.date).toLocaleString()})`,
          content: `Assessed By: ${assessment.user_name || 'Unknown'}\nNumber of Domains: ${Object.keys(assessment.hazard_assessments || {}).length}`
        }
      ];
      
      // Add hazard assessments
      if (assessment.hazard_assessments) {
        Object.entries(assessment.hazard_assessments).forEach(([domain, data]) => {
          const domainLabel = hazardDomainLabels[domain as keyof typeof hazardDomainLabels] || domain;
          const riskLevel = isDomainNotApplicable(data) ? 'Non-Applicable' : calculateRiskLevel(data.likelihood, data.consequence).label;
          
          content.push({
            title: domainLabel,
            content: `Risk Level: ${riskLevel}\nLikelihood: ${data.likelihood}%\nConsequence: ${data.consequence}%\nMaterial Impact: ${data.materialImpact || 'No input'}\nExisting Controls: ${data.existingControls || 'No input'}`
          });
        });
      }
      
      // Add assessment details
      if (assessment.assessment_details) {
        content.push({
          title: 'Assessment Details',
          content: `Context: ${assessment.assessment_details.context || 'Not provided'}\nStakeholders: ${assessment.assessment_details.stakeholders || 'Not provided'}\nRisk Criteria: ${assessment.assessment_details.riskCriteria || 'Not provided'}\nRisk Treatment: ${assessment.assessment_details.riskTreatment || 'Not provided'}\nControl Validation: ${assessment.assessment_details.controlValidation || 'Not provided'}\nEffectiveness Review: ${assessment.assessment_details.effectivenessReview || 'Not provided'}`
        });
      }
      
      // Add AI recommendations
      if (assessment.control_recommendations && assessment.control_recommendations.length > 0) {
        assessment.control_recommendations.forEach((rec, index) => {
          content.push({
            title: `AI Recommendation ${index + 1}: ${rec.name}`,
            content: `Priority: ${rec.priority}\nDescription: ${rec.description}\nCategory: ${rec.category || 'N/A'}\nImplementation Steps: ${rec.implementationSteps || 'N/A'}\nNIST CSF Reference: ${rec.nistCsfReference || 'N/A'}\nMonitoring Requirements: ${rec.monitoringRequirements}\nCost: ${rec.cost || 'N/A'}\nTimeline: ${rec.implementationTime || 'N/A'}`
          });
        });
      }
      
      const metadata = {
        title: assessment.risk_name,
        date: new Date(assessment.date).toLocaleDateString(),
        user: assessment.user_name || 'Unknown',
        domains: Object.keys(assessment.hazard_assessments || {}).length.toString()
      };
      
      await generatePDF({
        content,
        type: 'risk-assessment',
        language: 'en', // RiskAssessmentHistory doesn't have language toggle yet
        metadata
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF');
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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (assessments.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography>No assessment history available.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {view === 'monitoring' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <b>Monitoring & Reporting:</b> Showing only High and Critical risk assessments for focused monitoring.
        </Alert>
      )}
      {(view === 'summary' || view === 'monitoring') && (
        <>
          <Typography variant="h6" gutterBottom>
            Assessment History
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    Risk Assessment Name
                    <input
                      type="text"
                      placeholder="Filter"
                      value={summaryFilters.name}
                      onChange={e => setSummaryFilters(f => ({ ...f, name: e.target.value }))}
                      style={{ width: '100%', fontSize: 12, marginTop: 4 }}
                    />
                  </TableCell>
                  <TableCell>
                    Risk Level
                    <Select
                      multiple
                      displayEmpty
                      value={summaryFilters.riskLevel}
                      onChange={e => setSummaryFilters(f => ({ ...f, riskLevel: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }))}
                      input={<OutlinedInput size="small" />}
                      renderValue={selected =>
                        (selected as string[]).length === 0 ? 'All' : (selected as string[]).join(', ')
                      }
                      size="small"
                      sx={{ width: '100%', fontSize: 12, marginTop: 1 }}
                    >
                      {riskLevelOptions.map(level => (
                        <MenuItem key={level} value={level}>
                          <Checkbox checked={summaryFilters.riskLevel.indexOf(level) > -1} size="small" />
                          <ListItemText primary={level} />
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    Assessed By
                    <Select
                      displayEmpty
                      value={summaryFilters.assessedBy}
                      onChange={e => setSummaryFilters(f => ({ ...f, assessedBy: e.target.value }))}
                      input={<OutlinedInput size="small" />}
                      renderValue={selected => selected ? getUsernameFromEmail(selected) : 'All'}
                      size="small"
                      sx={{ width: '100%', fontSize: 12, marginTop: 1 }}
                    >
                      <MenuItem value=""><em>All</em></MenuItem>
                      {userNames.map(name => (
                        <MenuItem key={name} value={getUsernameFromEmail(name)}>{getUsernameFromEmail(name)}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    Risk Owner
                    <Select
                      displayEmpty
                      value={summaryFilters.riskOwner}
                      onChange={e => setSummaryFilters(f => ({ ...f, riskOwner: e.target.value }))}
                      input={<OutlinedInput size="small" />}
                      renderValue={selected => selected ? getUsernameFromEmail(selected) : 'All'}
                      size="small"
                      sx={{ width: '100%', fontSize: 12, marginTop: 1 }}
                    >
                      <MenuItem value=""><em>All</em></MenuItem>
                      {riskOwners.map(owner => (
                        <MenuItem key={owner} value={getUsernameFromEmail(owner)}>{getUsernameFromEmail(owner)}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    Assessment Date
                    <Select
                      value={summaryFilters.dateSort}
                      onChange={e => setSummaryFilters(f => ({ ...f, dateSort: e.target.value }))}
                      input={<OutlinedInput size="small" />}
                      size="small"
                      sx={{ width: '100%', fontSize: 12, marginTop: 1 }}
                    >
                      {dateSortOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell align="center">Details</TableCell>
                  {isAdmin && <TableCell>Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {((view === 'monitoring' ? monitoringSummaryData : filteredSummaryData)
                  .slice(rowsPerPage > 0 ? page * rowsPerPage : 0, rowsPerPage > 0 ? page * rowsPerPage + rowsPerPage : undefined))
                  .map((row) => {
                    const latest = row.latest[0];
                    const avgLikelihood = Object.values(latest.hazard_assessments || {}).reduce((a, b) => a + (b.likelihood || 0), 0) / Object.keys(latest.hazard_assessments || {}).length;
                    const avgConsequence = Object.values(latest.hazard_assessments || {}).reduce((a, b) => a + (b.consequence || 0), 0) / Object.keys(latest.hazard_assessments || {}).length;
                    const overallRisk = getOverallRiskLevel(latest.hazard_assessments);
                    return (
                      <React.Fragment key={row.requirement}>
                        <TableRow 
                          sx={{ 
                            verticalAlign: 'top',
                            '&:hover': {
                              backgroundColor: 'rgba(59, 130, 246, 0.05)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s ease-in-out',
                              cursor: 'pointer'
                            }
                          }}
                          onClick={() => setExpandedSummary(expandedSummary === row.requirement ? null : row.requirement)}
                        >
                          <TableCell>{latest.risk_name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={overallRisk.label}
                              size="small"
                              sx={{ 
                                bgcolor: overallRisk.color, 
                                color: overallRisk.label === 'Medium' ? '#000' : 'white', 
                                fontWeight: 600, 
                                fontSize: 14, 
                                letterSpacing: 1, 
                                px: 2, 
                                py: 0.5, 
                                borderRadius: 2 
                              }}
                            />
                          </TableCell>
                          <TableCell>{getUsernameFromEmail(latest.user_name) || 'Unknown'}</TableCell>
                          <TableCell>{Array.isArray(latest.assigned_to) ? latest.assigned_to.map(getUsernameFromEmail).join(', ') : 'N/A'}</TableCell>
                          <TableCell>{latest.date ? new Date(latest.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => setExpandedSummary(expandedSummary === row.requirement ? null : row.requirement)}>
                              {expandedSummary === row.requirement ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Button 
                                color="error" 
                                size="small" 
                                onClick={() => handleDeleteClick(latest.id)}
                                disabled={deleteLoading}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                            <Collapse in={expandedSummary === row.requirement} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                {row.latest.map((assessment) => (
                                  <Paper key={assessment.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                                      <button
                                        onClick={async () => {
                                          await handleDownloadPDF(assessment);
                                        }}
                                        style={{
                                          background: '#1976d2',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: 6,
                                          padding: '6px 18px',
                                          fontWeight: 600,
                                          fontSize: 15,
                                          cursor: 'pointer',
                                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
                                          marginBottom: 8
                                        }}
                                      >
                                        Download as PDF
                                      </button>
                                    </Box>
                                    <div id={`pdf-assessment-${assessment.id}`} className="pdf-export">
                                      <Typography variant="subtitle1" color="primary" gutterBottom>
                                        {assessment.risk_name} (Assessed on {new Date(assessment.date).toLocaleString()})
                                      </Typography>
                                      <Stack direction="column" spacing={2} mb={1}>
                                        <Chip label={`Assessed By: ${assessment.user_name || 'Unknown'}`} size="small" />
                                        <Chip label={`# Domains: ${Object.keys(assessment.hazard_assessments || {}).length}`} size="small" />
                                      </Stack>
                                      <Divider sx={{ my: 1 }} />
                                      <Typography variant="subtitle2">Hazard Assessments</Typography>
                                      <Stack direction="column" spacing={2}>
                                        {Object.entries(assessment.hazard_assessments || {}).map(([domain, data]) => (
                                          <Paper key={domain} sx={{ p: 1, width: '100%', bgcolor: 'grey.50', borderRadius: 1, mb: 1 }} elevation={0}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box sx={{ minWidth: 200, textAlign: 'right', ml: 2 }}>
                                                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, fontSize: 16, mb: 1, textAlign: 'center' }}>
                                                {hazardDomainLabels[domain as keyof typeof hazardDomainLabels]}
                                              </Typography>
                                                  <Chip 
                                                    label={isDomainNotApplicable(data) ? 'Non-Applicable' : calculateRiskLevel(data.likelihood, data.consequence).label} 
                                                    size="small" 
                                                    sx={{ 
                                                      bgcolor: isDomainNotApplicable(data) ? '#888' : 
                                                               calculateRiskLevel(data.likelihood, data.consequence).label === 'Critical' ? '#d32f2f' : 
                                                               calculateRiskLevel(data.likelihood, data.consequence).label === 'High' ? '#f57c00' : 
                                                               calculateRiskLevel(data.likelihood, data.consequence).label === 'Medium' ? '#fbc02d' : 
                                                               calculateRiskLevel(data.likelihood, data.consequence).label === 'Low' ? '#4caf50' : '#2196f3',
                                                      color: calculateRiskLevel(data.likelihood, data.consequence).label === 'Medium' && !isDomainNotApplicable(data) ? '#000' : 'white',
                                                      fontWeight: 600,
                                                      fontSize: '0.75rem',
                                                      px: 1.5,
                                                      py: 0.5,
                                                      borderRadius: 2,
                                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                      mb: 1,
                                                      width: '100%',
                                                      justifyContent: 'center',
                                                      display: 'flex',
                                                      '&:hover': {
                                                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                                        transform: 'translateY(-1px)'
                                                      }
                                                    }} 
                                                  />
                                                  <Box sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1, textAlign: 'center' }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textAlign: 'center' }}>Likelihood</Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>{data.likelihood}%</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textAlign: 'center' }}>Consequence</Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>{data.consequence}%</Typography>
                                            </Box>
                                            </Box>
                                                <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>Material Impact</Typography>
                                            <Box sx={{ maxHeight: 60, overflowY: 'auto', bgcolor: '#f9f9f9', p: 1, borderRadius: 1, mb: 1, fontSize: 13 }}>
                                              {typeof data.materialImpact !== 'undefined' && data.materialImpact !== null && data.materialImpact !== ''
                                                ? data.materialImpact
                                                : <span style={{ color: '#bbb' }}>No input</span>}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>Existing Controls</Typography>
                                            <Box sx={{ maxHeight: 60, overflowY: 'auto', bgcolor: '#f9f9f9', p: 1, borderRadius: 1, fontSize: 13 }}>
                                              {typeof data.existingControls !== 'undefined' && data.existingControls !== null && data.existingControls !== ''
                                                ? data.existingControls
                                                : <span style={{ color: '#bbb' }}>No input</span>}
                                                  </Box>
                                                </Box>
                                              </Box>
                                            </Box>
                                          </Paper>
                                        ))}
                                      </Stack>
                                      <Divider sx={{ my: 1 }} />
                                      <Typography variant="subtitle2">Assessment Details</Typography>
                                      <Typography variant="body2" sx={{ mb: 1 }}>
                                        <b>Context:</b> {assessment.assessment_details?.context || 'Not provided'}<br />
                                        <b>Stakeholders:</b> {assessment.assessment_details?.stakeholders || 'Not provided'}<br />
                                        <b>Risk Criteria:</b> {assessment.assessment_details?.riskCriteria || 'Not provided'}<br />
                                        <b>Risk Treatment:</b> {assessment.assessment_details?.riskTreatment || 'Not provided'}<br />
                                        <b>Control Validation:</b> {assessment.assessment_details?.controlValidation || 'Not provided'}<br />
                                        <b>Effectiveness Review:</b> {assessment.assessment_details?.effectivenessReview || 'Not provided'}
                                      </Typography>
                                      {assessment.control_recommendations && (
                                        <>
                                          <Divider sx={{ my: 1 }} />
                                          <Typography variant="subtitle2">AI Recommendations</Typography>
                                          <Stack spacing={1}>
                                            {assessment.control_recommendations.map((rec) => (
                                              <Paper key={rec.id} sx={{ 
                                                p: 2.5, 
                                                bgcolor: '#fafafa', 
                                                borderRadius: 2, 
                                                border: '1px solid #e0e0e0',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                                '&:hover': {
                                                  boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                                                  transform: 'translateY(-1px)',
                                                  transition: 'all 0.2s ease-in-out'
                                                }
                                              }} elevation={0}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, pb: 1, borderBottom: '2px solid #e3f2fd' }}>
                                                  <Typography variant="subtitle2" sx={{ color: '#1565c0', fontWeight: 600, fontSize: '0.95rem' }}>
                                                    {rec.name}
                                                  </Typography>
                                                  <Chip 
                                                    label={rec.priority} 
                                                    size="small" 
                                                    sx={{
                                                      bgcolor: rec.priority === 'Critical' ? '#d32f2f' : 
                                                               rec.priority === 'High' ? '#f57c00' : 
                                                               rec.priority === 'Medium' ? '#fbc02d' : '#4caf50',
                                                      color: rec.priority === 'Medium' ? '#000' : 'white',
                                                      fontWeight: 600,
                                                      fontSize: '0.7rem',
                                                      px: 1,
                                                      py: 0.3
                                                    }}
                                                  />
                                                </Box>
                                                
                                                <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.8rem', color: '#37474f', lineHeight: 1.5 }}>
                                                  {rec.description}
                                                </Typography>
                                                
                                                {rec.category && (
                                                  <Box sx={{ mb: 1, p: 1, bgcolor: '#e3f2fd', borderRadius: 1, borderLeft: '3px solid #1976d2' }}>
                                                    <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600, fontSize: '0.65rem' }}>
                                                      CATEGORY
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.75rem', mt: 0.3 }}>
                                                      {rec.category}
                                                    </Typography>
                                                  </Box>
                                                )}
                                                
                                                {rec.implementationSteps && (
                                                  <Box sx={{ mb: 1, p: 1, bgcolor: '#f3e5f5', borderRadius: 1, borderLeft: '3px solid #7b1fa2' }}>
                                                    <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600, fontSize: '0.65rem' }}>
                                                      IMPLEMENTATION
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.75rem', mt: 0.3 }}>
                                                      {rec.implementationSteps}
                                                    </Typography>
                                                  </Box>
                                                )}
                                                
                                                {rec.nistCsfReference && (
                                                  <Box sx={{ mb: 1, p: 1, bgcolor: '#fff3e0', borderRadius: 1, borderLeft: '3px solid #f57c00' }}>
                                                    <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600, fontSize: '0.65rem' }}>
                                                      NIST CSF 2.0
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.75rem', mt: 0.3 }}>
                                                      {rec.nistCsfReference}
                                                    </Typography>
                                                  </Box>
                                                )}
                                                
                                                <Box sx={{ mt: 1.5, p: 1, bgcolor: '#f1f3f4', borderRadius: 1, borderLeft: '3px solid #4caf50' }}>
                                                  <Typography variant="caption" sx={{ color: '#1b5e20', fontWeight: 600, fontSize: '0.65rem' }}>
                                                    MONITORING
                                                  </Typography>
                                                  <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.75rem', mt: 0.3 }}>
                                                    {rec.monitoringRequirements}
                                                  </Typography>
                                                </Box>
                                                
                                                {rec.cost && (
                                                  <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
                                                    <Chip 
                                                      label={`Cost: ${rec.cost}`} 
                                                      size="small" 
                                                      sx={{ 
                                                        bgcolor: '#fff8e1',
                                                        color: '#e65100',
                                                        border: '1px solid #ffcc02',
                                                        fontWeight: 500,
                                                        fontSize: '0.65rem'
                                                      }}
                                                    />
                                                    {rec.implementationTime && (
                                                      <Chip 
                                                        label={`Timeline: ${rec.implementationTime}`} 
                                                        size="small" 
                                                        sx={{ 
                                                          bgcolor: '#e1f5fe',
                                                          color: '#0277bd',
                                                          border: '1px solid #29b6f6',
                                                          fontWeight: 500,
                                                          fontSize: '0.65rem'
                                                        }}
                                                      />
                                                    )}
                                                  </Stack>
                                                )}
                                                {rec.residualRisk && (
                                                  <Typography variant="caption" sx={{ color: '#616161', fontStyle: 'italic', display: 'block', mt: 1, fontSize: '0.65rem' }}>
                                                    <strong>Residual Risk:</strong> {rec.residualRisk}
                                                  </Typography>
                                                )}
                                              </Paper>
                                            ))}
                                          </Stack>
                                        </>
                                      )}
                                    </div>
                                  </Paper>
                                ))}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={(view === 'monitoring' ? monitoringSummaryData : filteredSummaryData).length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[20, 50, 100, { label: 'All', value: -1 }]}
            labelRowsPerPage="Entries per page:"
          />
        </>
      )}
      {view === 'detailed' && (
        <>
          <Typography variant="h6" gutterBottom>
            Assessment History (Detailed)
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 1200 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Risk Name</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Assessment Date</TableCell>
                  <TableCell>Hazard Assessments</TableCell>
                  <TableCell>Context & Criteria</TableCell>
                  <TableCell>Treatment & Controls</TableCell>
                  <TableCell>AI Recommendations</TableCell>
                  <TableCell>Assessed By</TableCell>
                  <TableCell>Risk Owner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessments.map((assessment, index) => {
                  const hazardAssessments = Object.fromEntries(
                    Object.entries(assessment.hazard_assessments || {}).map(([domain, data]) => [
                      domain,
                      {
                        ...data,
                        likelihood: typeof data.likelihood === 'string' ? Number(data.likelihood) : data.likelihood,
                        consequence: typeof data.consequence === 'string' ? Number(data.consequence) : data.consequence,
                      }
                    ])
                  );
                  const domains = Object.keys(hazardAssessments);
                  let totalLikelihood = 0;
                  let totalConsequence = 0;
                  let count = 0;
                  domains.forEach(domain => {
                    const data = hazardAssessments[domain];
                    if (data && typeof data.likelihood === 'number' && typeof data.consequence === 'number') {
                      totalLikelihood += data.likelihood;
                      totalConsequence += data.consequence;
                      count++;
                    }
                  });
                  const avgLikelihood = count > 0 ? totalLikelihood / count : 0;
                  const avgConsequence = count > 0 ? totalConsequence / count : 0;
                  const overallRisk = calculateRiskLevel(avgLikelihood, avgConsequence);
                  const isExpanded = expandedRows.has(assessment.id);
                  return (
                    <React.Fragment key={assessment.id}>
                      <TableRow 
                        sx={{ 
                          verticalAlign: 'top',
                          '&:hover': {
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease-in-out',
                            cursor: 'pointer'
                          }
                        }}
                      >
                        <TableCell sx={{ verticalAlign: 'top', minWidth: 160 }}>
                          <Typography variant="subtitle2" onClick={() => toggleRowExpansion(assessment.id)} style={{ cursor: 'pointer' }}>
                            {assessment.risk_name || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          <Chip 
                            label={overallRisk.label}
                            size="small"
                            sx={{ 
                              bgcolor: overallRisk.color, 
                              color: overallRisk.label === 'Medium' ? '#000' : 'white', 
                              fontWeight: 600, 
                              fontSize: 14, 
                              letterSpacing: 1, 
                              px: 2, 
                              py: 0.5, 
                              borderRadius: 2 
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top' }}>
                          <Typography variant="body2">
                            {new Date(assessment.date).toLocaleDateString()}<br />
                            <span style={{ fontWeight: 400, fontSize: 12, color: '#888' }}>
                              {new Date(assessment.date).toLocaleTimeString()}
                            </span>
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ verticalAlign: 'top', minWidth: 220 }}>
                          <Stack direction="column" spacing={2}>
                            {hazardDomains.filter(domain => hazardAssessments?.[domain]).map((domain) => {
                              const typedDomain = domain as keyof typeof hazardDomainLabels;
                              const data = hazardAssessments?.[domain];
                              if (!data) return null;
                              const risk = calculateRiskLevel(data.likelihood, data.consequence);
                              return (
                                <Paper key={domain} sx={{ p: 1, width: '100%', bgcolor: 'grey.50', borderRadius: 1, mb: 1 }} elevation={0}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <Box sx={{ minWidth: 200, textAlign: 'right', ml: 2 }}>
                                        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, fontSize: 16, mb: 1, textAlign: 'center' }}>
                                      {hazardDomainLabels[typedDomain]}
                                    </Typography>
                                        <Chip 
                                          label={isDomainNotApplicable(data) ? 'Non-Applicable' : calculateRiskLevel(data.likelihood, data.consequence).label} 
                                          size="small" 
                                          sx={{ 
                                            bgcolor: isDomainNotApplicable(data) ? '#888' : 
                                                     calculateRiskLevel(data.likelihood, data.consequence).label === 'Critical' ? '#d32f2f' : 
                                                     calculateRiskLevel(data.likelihood, data.consequence).label === 'High' ? '#f57c00' : 
                                                     calculateRiskLevel(data.likelihood, data.consequence).label === 'Medium' ? '#fbc02d' : 
                                                     calculateRiskLevel(data.likelihood, data.consequence).label === 'Low' ? '#4caf50' : '#2196f3',
                                            color: calculateRiskLevel(data.likelihood, data.consequence).label === 'Medium' && !isDomainNotApplicable(data) ? '#000' : 'white',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 2,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            mb: 1,
                                            width: '100%',
                                            justifyContent: 'center',
                                            display: 'flex',
                                            '&:hover': {
                                              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                              transform: 'translateY(-1px)'
                                            }
                                          }} 
                                        />
                                        <Box sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1, textAlign: 'center' }}>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textAlign: 'center' }}>Likelihood</Typography>
                                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>{data.likelihood}%</Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textAlign: 'center' }}>Consequence</Typography>
                                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>{data.consequence}%</Typography>
                                            </Box>
                                            </Box>
                                                <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>Material Impact</Typography>
                                            <Box sx={{ maxHeight: 60, overflowY: 'auto', bgcolor: '#f9f9f9', p: 1, borderRadius: 1, mb: 1, fontSize: 13 }}>
                                              {typeof data.materialImpact !== 'undefined' && data.materialImpact !== null && data.materialImpact !== ''
                                                ? data.materialImpact
                                                : <span style={{ color: '#bbb' }}>No input</span>}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>Existing Controls</Typography>
                                            <Box sx={{ maxHeight: 60, overflowY: 'auto', bgcolor: '#f9f9f9', p: 1, borderRadius: 1, fontSize: 13 }}>
                                              {typeof data.existingControls !== 'undefined' && data.existingControls !== null && data.existingControls !== ''
                                                ? data.existingControls
                                                : <span style={{ color: '#bbb' }}>No input</span>}
                                                  </Box>
                                                </Box>
                                              </Box>
                                            </Box>
                                          </Paper>
                                        );
                                    })}
                                  </Stack>
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top', minWidth: 180 }}>
                                  <Typography variant="subtitle2" color="primary">Context</Typography>
                                  <Typography variant="body2" paragraph>{assessment.assessment_details?.context || 'Not provided'}</Typography>
                                  <Typography variant="subtitle2" color="primary">Stakeholders</Typography>
                                  <Typography variant="body2" paragraph>{assessment.assessment_details?.stakeholders || 'Not provided'}</Typography>
                                  <Typography variant="subtitle2" color="primary">Risk Criteria</Typography>
                                  <Typography variant="body2">{assessment.assessment_details?.riskCriteria || 'Not provided'}</Typography>
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top', minWidth: 180 }}>
                                  <Typography variant="subtitle2" color="primary">Risk Treatment</Typography>
                                  <Typography variant="body2" paragraph>{assessment.assessment_details?.riskTreatment || 'Not provided'}</Typography>
                                  <Typography variant="subtitle2" color="primary">Control Validation</Typography>
                                  <Typography variant="body2" paragraph>{assessment.assessment_details?.controlValidation || 'Not provided'}</Typography>
                                  <Typography variant="subtitle2" color="primary">Effectiveness Review</Typography>
                                  <Typography variant="body2">{assessment.assessment_details?.effectivenessReview || 'Not provided'}</Typography>
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top', minWidth: 220 }}>
                                  {assessment.control_recommendations ? (
                                    <Stack spacing={1}>
                                      {assessment.control_recommendations.map((rec) => (
                                        <Paper key={rec.id} sx={{ 
                                          p: 2.5, 
                                          bgcolor: '#fafafa', 
                                          borderRadius: 2, 
                                          border: '1px solid #e0e0e0',
                                          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                          '&:hover': {
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                                            transform: 'translateY(-1px)',
                                            transition: 'all 0.2s ease-in-out'
                                          }
                                        }} elevation={0}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, pb: 1, borderBottom: '2px solid #e3f2fd' }}>
                                            <Typography variant="subtitle2" sx={{ color: '#1565c0', fontWeight: 600, fontSize: '0.95rem' }}>
                                              {rec.name}
                                            </Typography>
                                            <Chip 
                                              label={rec.priority} 
                                              size="small" 
                                              sx={{
                                                bgcolor: rec.priority === 'Critical' ? '#d32f2f' : 
                                                         rec.priority === 'High' ? '#f57c00' : 
                                                         rec.priority === 'Medium' ? '#fbc02d' : '#4caf50',
                                                color: rec.priority === 'Medium' ? '#000' : 'white',
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                                px: 1,
                                                py: 0.3
                                              }}
                                            />
                                          </Box>
                                          
                                          <Typography variant="body2" sx={{ mb: 1.5, fontSize: '0.8rem', color: '#37474f', lineHeight: 1.5 }}>
                                            {rec.description}
                                          </Typography>
                                          
                                          {rec.category && (
                                            <Box sx={{ mb: 1, p: 1, bgcolor: '#e3f2fd', borderRadius: 1, borderLeft: '3px solid #1976d2' }}>
                                              <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 600, fontSize: '0.65rem' }}>
                                                CATEGORY
                                              </Typography>
                                              <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.75rem', mt: 0.3 }}>
                                                {rec.category}
                                              </Typography>
                                            </Box>
                                          )}
                                          
                                          {rec.implementationSteps && (
                                            <Box sx={{ mb: 1, p: 1, bgcolor: '#f3e5f5', borderRadius: 1, borderLeft: '3px solid #7b1fa2' }}>
                                              <Typography variant="caption" sx={{ color: '#6a1b9a', fontWeight: 600, fontSize: '0.65rem' }}>
                                                IMPLEMENTATION
                                              </Typography>
                                              <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.75rem', mt: 0.3 }}>
                                                {rec.implementationSteps}
                                              </Typography>
                                            </Box>
                                          )}
                                          
                                          {rec.nistCsfReference && (
                                            <Box sx={{ mb: 1, p: 1, bgcolor: '#fff3e0', borderRadius: 1, borderLeft: '3px solid #f57c00' }}>
                                              <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 600, fontSize: '0.65rem' }}>
                                                NIST CSF 2.0
                                              </Typography>
                                              <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.75rem', mt: 0.3 }}>
                                                {rec.nistCsfReference}
                                              </Typography>
                                            </Box>
                                          )}
                                          
                                          <Box sx={{ mt: 1.5, p: 1, bgcolor: '#f1f3f4', borderRadius: 1, borderLeft: '3px solid #4caf50' }}>
                                            <Typography variant="caption" sx={{ color: '#1b5e20', fontWeight: 600, fontSize: '0.65rem' }}>
                                              MONITORING
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#37474f', fontSize: '0.75rem', mt: 0.3 }}>
                                              {rec.monitoringRequirements}
                                            </Typography>
                                          </Box>
                                          
                                          {rec.cost && (
                                            <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
                                              <Chip 
                                                label={`Cost: ${rec.cost}`} 
                                                size="small" 
                                                sx={{ 
                                                  bgcolor: '#fff8e1',
                                                  color: '#e65100',
                                                  border: '1px solid #ffcc02',
                                                  fontWeight: 500,
                                                  fontSize: '0.65rem'
                                                }}
                                              />
                                              {rec.implementationTime && (
                                                <Chip 
                                                  label={`Timeline: ${rec.implementationTime}`} 
                                                  size="small" 
                                                  sx={{ 
                                                    bgcolor: '#e1f5fe',
                                                    color: '#0277bd',
                                                    border: '1px solid #29b6f6',
                                                    fontWeight: 500,
                                                    fontSize: '0.65rem'
                                                  }}
                                                />
                                              )}
                                            </Stack>
                                          )}
                                          {rec.residualRisk && (
                                            <Typography variant="caption" sx={{ color: '#616161', fontStyle: 'italic', display: 'block', mt: 1, fontSize: '0.65rem' }}>
                                              <strong>Residual Risk:</strong> {rec.residualRisk}
                                            </Typography>
                                          )}
                                        </Paper>
                                      ))}
                                    </Stack>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">No recommendations available</Typography>
                                  )}
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <Typography variant="body2">{getUsernameFromEmail(assessment.user_name) || 'Unknown'}</Typography>
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <Typography variant="body2">
                                    {Array.isArray(assessment.assigned_to) 
                                      ? assessment.assigned_to.map((user, index) => (
                                          <React.Fragment key={user}>
                                            {user}
                                            {index < assessment.assigned_to.length - 1 ? ', ' : ''}
                                          </React.Fragment>
                                        ))
                                      : 'N/A'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={9} sx={{ bgcolor: 'background.default', p: 2 }}>
                                    <Typography variant="subtitle2" color="primary">Additional Details</Typography>
                                    <Typography variant="body2">Comments: {assessment.comments || 'No comments provided'}</Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                  <Typography gutterBottom>
                    Are you sure you want to delete this assessment? This action cannot be undone.<br />
                    Please type <b>DELETE</b> to confirm.
                  </Typography>
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Type DELETE to confirm"
                    fullWidth
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    error={!!deleteError}
                    helperText={deleteError}
                    disabled={deleteLoading}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleDeleteCancel} disabled={deleteLoading}>Cancel</Button>
                  <Button 
                    onClick={handleDeleteConfirm} 
                    color="error" 
                    variant="contained"
                    disabled={deleteLoading}
                    startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          );
        };

        export default RiskAssessmentHistory; 