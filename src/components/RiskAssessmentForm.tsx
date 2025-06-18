import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Chip,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  Grid,
  Snackbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

interface RiskFactor {
  id: string;
  name: string;
  description: string;
  category: string;
  dependencies?: string[];
}

interface RiskAssessmentFormProps {
  requirementId: string;
  onAssessmentComplete: () => void;
}

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
  essentialEightAlignment?: string;
}

interface HazardAssessment {
  likelihood: number | null;
  consequence: number | null;
  materialImpact: string;
  existingControls: string;
  riskLevel: string;
  notApplicable?: boolean;
}

interface HazardAssessments {
  [key: string]: HazardAssessment;
}

interface RiskAssessmentHistory {
  id: string;
  date: string;
  sector: string;
  hazard_assessments: HazardAssessments;
  assessment_details: {
    context: string;
    stakeholders: string;
    riskCriteria: string;
    riskTreatment: string;
    controlValidation: string;
    effectivenessReview: string;
  };
  comments: string;
  control_recommendations?: ControlRecommendation[];
  user_id: number;
  user_name: string;
  user_role: string;
}

interface User { email: string; uid?: string; role?: string; accessEndDate?: string; }

const riskLevels = {
  CRITICAL: { min: 80, max: 100, color: '#d32f2f', label: 'Critical' },
  HIGH: { min: 60, max: 79, color: '#f57c00', label: 'High' },
  MEDIUM: { min: 40, max: 59, color: '#ffc107', label: 'Medium' },
  LOW: { min: 20, max: 39, color: '#4caf50', label: 'Low' },
  MINIMAL: { min: 0, max: 19, color: '#2196f3', label: 'Minimal' }
};

const riskCategories = [
  'Technical',
  'Operational',
  'Environmental',
  'Regulatory',
  'Financial',
  'Reputational',
];

const hazardDomains = [
  'cyber_security',
  'physical_security',
  'personnel_security',
  'supply_chain_security',
  'natural_hazards',
  'recovery_planning'
];

const hazardDomainLabels: Record<string, string> = {
  cyber_security: 'Govern',
  physical_security: 'Identify',
  personnel_security: 'Protect',
  supply_chain_security: 'Detect',
  natural_hazards: 'Respond',
  recovery_planning: 'Recover'
};

const StyledGrid = styled(Box)({});

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ requirementId, onAssessmentComplete }) => {
  const { token } = useAuth();
  const [riskName, setRiskName] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compensatingControls, setCompensatingControls] = useState<{ [key: string]: string }>({});
  const [riskAssessmentDetails, setRiskAssessmentDetails] = useState({
    likelihood: 50,
    consequence: 50,
    materialImpact: '',
    riskTreatment: '',
    controlValidation: '',
    effectivenessReview: '',
    context: '',
    stakeholders: '',
    riskCriteria: '',
  });
  const [controlRecommendations, setControlRecommendations] = useState<ControlRecommendation[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<RiskAssessmentHistory[]>([]);
  const [submittedAssessment, setSubmittedAssessment] = useState<any>(null);
  const [pendingAssessmentId, setPendingAssessmentId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notApplicable, setNotApplicable] = useState<{ [key: string]: boolean }>({});

  const [hazardAssessments, setHazardAssessments] = useState<HazardAssessments>(() => {
    const initial: HazardAssessments = {};
    hazardDomains.forEach(domain => {
      initial[domain] = {
        likelihood: 50,
        consequence: 50,
        materialImpact: '',
        existingControls: '',
        riskLevel: 'Medium'
      };
    });
    return initial;
  });

  useEffect(() => {
    if (token) {
    fetchRiskFactors();
    fetchAssessmentHistory();
    fetchUserList();
    } else {
      console.log('No token available, skipping user fetch');
    }
  }, [token, requirementId]);

  const fetchRiskFactors = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/risk-factors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch risk factors');
      const data = await response.json();
      setRiskFactors(data);
      const initialScores = data.reduce((acc: { [key: string]: number }, factor: RiskFactor) => {
        acc[factor.id] = 50;
        return acc;
      }, {});
      setScores(initialScores);
      const initialControls = data.reduce((acc: { [key: string]: string }, factor: RiskFactor) => {
        acc[factor.id] = '';
        return acc;
      }, {});
      setCompensatingControls(initialControls);
    } catch (err) {
      setError('Failed to load risk factors');
      console.error('Error fetching risk factors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessmentHistory = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/risk-assessment/history/${requirementId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch assessment history');
      const data = await response.json();
      setAssessmentHistory(data);
    } catch (err) {
      console.error('Error fetching assessment history:', err);
      setError('Failed to load assessment history. Please try again later.');
    }
  };

  const fetchUserList = async () => {
    if (!token) {
      console.log('No token available for fetching users');
      return;
    }
    try {
      console.log('Fetching user list with token...'); // Debug log
      const response = await fetch('http://localhost:3001/api/team/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('User fetch response status:', response.status); // Debug log
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
      const data = await response.json();
      console.log('Fetched users:', data); // Debug log
      console.log('Number of users:', data.length); // Debug log
      // Sort users A-Z by email for consistent dropdown ordering
      const sortedUsers = data.sort((a: User, b: User) => a.email.toLowerCase().localeCompare(b.email.toLowerCase()));
      setUserList(sortedUsers);
    } catch (err) {
      console.error('Error fetching user list:', err);
      setError('Failed to load user list. Please refresh the page.');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    try {
      // Validate required fields
      if (!riskName) throw new Error('Please enter a risk name');
      if (!assignedTo || assignedTo.length === 0) throw new Error('Please select at least one user to assign this assessment to');
      const hasEmptyFields = Object.entries(hazardAssessments).some(
        ([domain, assessment]) =>
          !notApplicable[domain] && (!assessment.materialImpact || !assessment.existingControls)
      );

      if (hasEmptyFields) {
        throw new Error('Please complete all hazard domain assessments before submitting');
      }

      const response = await fetch('http://localhost:3001/api/risk-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          risk_name: riskName,
          assigned_to: assignedTo,
          requirement_id: requirementId,
          scores,
          comments,
          compensating_controls: compensatingControls,
          assessment_details: riskAssessmentDetails,
          hazard_assessments: hazardAssessments,
          control_recommendations: controlRecommendations.length > 0 ? controlRecommendations : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      const result = await response.json();
      console.log('Assessment submitted successfully:', result);
      
      // Store the submitted assessment and move to AI recommendations step
      setSubmittedAssessment(result);
      setCurrentStep(5); // Move to AI recommendations step

      // Refresh the assessment history
      await fetchAssessmentHistory();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
      console.error('Error submitting assessment:', err);
      return null;
    }
  };

  const calculateRiskLevel = (likelihood: number, consequence: number) => {
    const score = (likelihood + consequence) / 2;
    for (const [level, range] of Object.entries(riskLevels)) {
      if (score >= range.min && score <= range.max) {
        return { level, ...range };
      }
    }
    return { level: 'UNKNOWN', ...riskLevels.LOW };
  };

  const handleGenerateRecommendations = async () => {
    setError(null);
    setIsGeneratingRecommendations(true);
    try {
      // Calculate overall risk level based on hazard assessments
      const overallRiskLevel = Object.values(hazardAssessments).reduce((highest, assessment) => {
        const riskLevel = calculateRiskLevel(assessment.likelihood!, assessment.consequence!).level;
        return riskLevel === 'CRITICAL' ? 'CRITICAL' : 
               riskLevel === 'HIGH' ? 'HIGH' : 
               riskLevel === 'MEDIUM' ? 'MEDIUM' : highest;
      }, 'LOW');
      const response = await fetch('http://localhost:3001/api/generate-control-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          risk_level: overallRiskLevel,
          risk_factors: Object.entries(hazardAssessments).map(([domain, data]) => ({
            name: domain,
            score: (data.likelihood! + data.consequence!) / 2,
            category: domain,
            materialImpact: data.materialImpact,
            existingControls: data.existingControls
          })),
          assessment_details: {
            context: riskAssessmentDetails.context,
            stakeholders: riskAssessmentDetails.stakeholders,
            riskCriteria: riskAssessmentDetails.riskCriteria,
            riskTreatment: riskAssessmentDetails.riskTreatment,
            controlValidation: riskAssessmentDetails.controlValidation,
            effectivenessReview: riskAssessmentDetails.effectivenessReview,
            comments: comments
          },
          prompt: `Generate detailed control recommendations based on NIST CSF 2.0 framework. For each recommendation, provide:

1. Control Name and Priority (Critical/High/Medium/Low)
2. Detailed Description
3. Category (Technical/Administrative/Operational)
4. Implementation Steps
5. NIST CSF 2.0 Alignment (specify relevant functions and categories)
6. Monitoring Requirements

Focus on:
- Governance and risk management (Govern)
- Asset and risk identification (Identify)
- Protective measures (Protect)
- Detection capabilities (Detect)
- Response procedures (Respond)
- Recovery planning (Recover)

Ensure recommendations are:
- Specific and actionable
- Aligned with NIST CSF 2.0 guidelines
- Practical for implementation
- Measurable and monitorable
- Cost-effective and scalable

Format each recommendation as:
Control Name: [Name]
Priority: [Critical/High/Medium/Low]
Description: [Detailed description]
Category: [Technical/Administrative/Operational]
Implementation: [Numbered steps]
NIST CSF 2.0 Alignment: [Relevant functions and categories]
Monitoring: [Monitoring requirements]`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recommendations');
      }

      const data = await response.json();
      setControlRecommendations(data.recommendations || []);
      setCurrentStep(5); // Move to Step 5
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
      console.error('Error generating recommendations:', err);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const renderRiskMatrix = () => {
    const currentRisk = calculateRiskLevel(
      riskAssessmentDetails.likelihood,
      riskAssessmentDetails.consequence
    );

    return (
      <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Risk Matrix
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
          {Object.entries(riskLevels).map(([level, { color, label }]) => (
            <Box
              key={level}
              sx={{
                p: 1,
                bgcolor: color,
                color: 'white',
                textAlign: 'center',
                borderRadius: 1,
                opacity: currentRisk.level === level ? 1 : 0.7,
              }}
            >
              {label}
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            Current Risk Level:
          </Typography>
          <Chip
            label={currentRisk.label}
            sx={{
              bgcolor: currentRisk.color,
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>
      </Box>
    );
  };

  const renderStepIndicator = () => (
    <Box sx={{ mb: 4 }}>
      <Stepper activeStep={currentStep - 1} alternativeLabel>
        <Step>
          <StepLabel>Context & Criteria</StepLabel>
        </Step>
        <Step>
          <StepLabel>Risk Assessment</StepLabel>
        </Step>
        <Step>
          <StepLabel>Risk Treatment</StepLabel>
        </Step>
        <Step>
          <StepLabel>Review & Submit</StepLabel>
        </Step>
        <Step>
          <StepLabel>AI Recommendations</StepLabel>
        </Step>
      </Stepper>
    </Box>
  );

  const renderContextStep = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Risk Assessment Context (NIST CSF 2.0)
      </Typography>
      <Box sx={{ display: 'grid', gap: 3 }}>
        <TextField
          fullWidth
          required
          label="Risk Name"
          value={riskName}
          onChange={(e) => setRiskName(e.target.value)}
          placeholder="E.g. Unauthorized Access to Critical System"
          helperText="Provide a concise, descriptive name for this risk (e.g. 'Data Breach in HR System'). This helps identify and track the risk across assessments."
        />
        <FormControl fullWidth required>
          <InputLabel>Assigned To</InputLabel>
          <Select
            multiple
            value={assignedTo}
            onChange={(e) => setAssignedTo(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            label="Assigned To"
            renderValue={(selected) => (selected as string[]).map(email => email.split('@')[0]).join(', ')}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 200, // Limit height to show ~5 items
                },
              },
            }}
          >
            {userList && userList.length > 0 ? (
              userList.map((user) => (
                <MenuItem key={user.uid || user.email} value={user.email}>
                  {user.email.split('@')[0]}
              </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <em>Loading users...</em>
              </MenuItem>
            )}
          </Select>
          <Typography variant="caption" color="text.secondary">
            Select one or more users responsible for this risk assessment.
            {userList && userList.length === 0 && (
              <span style={{ color: 'red' }}> No users found. Please check your connection.</span>
            )}
          </Typography>
        </FormControl>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Context"
          value={riskAssessmentDetails.context}
          onChange={(e) => setRiskAssessmentDetails(prev => ({ ...prev, context: e.target.value }))}
          placeholder="Describe the critical infrastructure asset and its importance to the sector..."
          helperText="Include asset description, critical functions, and dependencies"
        />
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Stakeholders"
          value={riskAssessmentDetails.stakeholders}
          onChange={(e) => setRiskAssessmentDetails(prev => ({ ...prev, stakeholders: e.target.value }))}
          placeholder="List key stakeholders including asset owners, operators, and relevant authorities..."
          helperText="Include internal and external stakeholders with interests in the asset"
        />
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Risk Criteria"
          value={riskAssessmentDetails.riskCriteria}
          onChange={(e) => setRiskAssessmentDetails(prev => ({ ...prev, riskCriteria: e.target.value }))}
          placeholder="Define risk criteria based on NIST CSF 2.0 requirements and sector-specific standards..."
          helperText="Include criteria for likelihood, consequence, and material impact assessment"
        />
      </Box>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => setCurrentStep(2)}
          disabled={!riskName || assignedTo.length === 0 || !riskAssessmentDetails.context || !riskAssessmentDetails.riskCriteria}
        >
          Next: Risk Assessment
        </Button>
      </Box>
    </Paper>
  );

  const renderRiskAssessmentStep = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Risk Assessment Details (NIST CSF 2.0)
      </Typography>
      <Box sx={{ display: 'grid', gap: 4 }}>
        {hazardDomains.map((domain) => (
          <Box key={domain} sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              {hazardDomainLabels[domain]} Risk Assessment
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Checkbox
                checked={!!notApplicable[domain]}
                onChange={e => setNotApplicable(prev => ({ ...prev, [domain]: e.target.checked }))}
                color="primary"
              />
              <Typography variant="body2">Not Applicable</Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Likelihood Assessment
                  </Typography>
                  <Slider
                    value={notApplicable[domain] ? 0 : hazardAssessments[domain].likelihood!}
                    onChange={(_, value) => setHazardAssessments(prev => ({
                      ...prev,
                      [domain]: { ...prev[domain], likelihood: value as number }
                    }))}
                    valueLabelDisplay="auto"
                    step={10}
                    marks
                    min={0}
                    max={100}
                    valueLabelFormat={(value) => `${value}%`}
                    disabled={!!notApplicable[domain]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Assess the probability of the risk occurring
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Consequence Assessment
                  </Typography>
                  <Slider
                    value={notApplicable[domain] ? 0 : hazardAssessments[domain].consequence!}
                    onChange={(_, value) => setHazardAssessments(prev => ({
                      ...prev,
                      [domain]: { ...prev[domain], consequence: value as number }
                    }))}
                    valueLabelDisplay="auto"
                    step={10}
                    marks
                    min={0}
                    max={100}
                    valueLabelFormat={(value) => `${value}%`}
                    disabled={!!notApplicable[domain]}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Assess the potential impact on critical functions
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Material Impact Description"
                value={hazardAssessments[domain].materialImpact}
                onChange={(e) => setHazardAssessments(prev => ({
                  ...prev,
                  [domain]: { ...prev[domain], materialImpact: e.target.value }
                }))}
                placeholder={`Describe the potential material impact on the critical infrastructure asset from ${hazardDomainLabels[domain].toLowerCase()} risks...`}
                helperText="Include impact on critical functions, service delivery, and sector operations"
                required={!notApplicable[domain]}
                disabled={!!notApplicable[domain]}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Existing Controls"
                value={hazardAssessments[domain].existingControls}
                onChange={(e) => setHazardAssessments(prev => ({
                  ...prev,
                  [domain]: { ...prev[domain], existingControls: e.target.value }
                }))}
                placeholder="Describe existing controls and measures aligned with NIST CSF 2.0 requirements..."
                helperText="Include preventive, detective, and corrective controls"
                required={!notApplicable[domain]}
                disabled={!!notApplicable[domain]}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">
                  Risk Level:
                </Typography>
                <Chip
                  label={calculateRiskLevel(
                    hazardAssessments[domain].likelihood!,
                    hazardAssessments[domain].consequence!
                  ).label}
                  sx={{
                    bgcolor: calculateRiskLevel(
                      hazardAssessments[domain].likelihood!,
                      hazardAssessments[domain].consequence!
                    ).color,
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => setCurrentStep(1)}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => setCurrentStep(3)}
          disabled={!Object.entries(hazardAssessments).every(([domain, assessment]) =>
            notApplicable[domain] || (assessment.materialImpact && assessment.existingControls)
          )}
        >
          Next: Risk Treatment
        </Button>
      </Box>
    </Paper>
  );

  const renderRiskTreatmentStep = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Risk Treatment & Controls (NIST CSF 2.0)
      </Typography>
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Risk Treatment Controls"
            value={riskAssessmentDetails.riskTreatment}
            onChange={(e) => setRiskAssessmentDetails(prev => ({ ...prev, riskTreatment: e.target.value }))}
            placeholder="Describe the risk treatment controls implemented to address identified risks..."
            helperText="Include controls that align with NIST CSF 2.0 requirements and sector standards"
          />
        </Box>
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Control Validation"
            value={riskAssessmentDetails.controlValidation}
            onChange={(e) => setRiskAssessmentDetails(prev => ({ ...prev, controlValidation: e.target.value }))}
            placeholder="Describe how the controls have been validated and tested..."
            helperText="Include testing methods, results, and compliance verification"
          />
        </Box>
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Effectiveness Review"
            value={riskAssessmentDetails.effectivenessReview}
            onChange={(e) => setRiskAssessmentDetails(prev => ({ ...prev, effectivenessReview: e.target.value }))}
            placeholder="Describe the effectiveness review process and findings..."
            helperText="Include review methodology, findings, and continuous improvement measures"
          />
        </Box>
      </Box>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => setCurrentStep(2)}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => setCurrentStep(4)}
          disabled={!riskAssessmentDetails.riskTreatment}
        >
          Next: Review & Submit
        </Button>
      </Box>
    </Paper>
  );

  const renderReviewStep = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Review & Submit Assessment
      </Typography>
      <Box sx={{ display: 'grid', gap: 3 }}>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Context & Criteria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {riskAssessmentDetails.context}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Hazard Domain Assessments
          </Typography>
          {hazardDomains.map((domain) => (
            <Box key={domain} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {hazardDomainLabels[domain]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {notApplicable[domain] ? (
                  <>
                    <b>Status:</b> <Chip label="Non-Applicable" size="small" sx={{ bgcolor: '#888', color: 'white' }} />
                  </>
                ) : (
                  <>
                    Likelihood: {hazardAssessments[domain].likelihood}%<br />
                    Consequence: {hazardAssessments[domain].consequence}%<br />
                Risk Level: {calculateRiskLevel(
                      hazardAssessments[domain].likelihood!,
                      hazardAssessments[domain].consequence!
                    ).label}<br />
                    Material Impact: {hazardAssessments[domain].materialImpact}<br />
                Existing Controls: {hazardAssessments[domain].existingControls}
                  </>
                )}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Risk Treatment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {riskAssessmentDetails.riskTreatment}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Additional Information
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any additional comments or observations..."
          />
        </Box>
      </Box>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => setCurrentStep(3)}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateRecommendations}
          disabled={isGeneratingRecommendations}
        >
          {isGeneratingRecommendations ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Generating Recommendations...
            </>
          ) : (
            'Generate AI Recommendations'
          )}
        </Button>
      </Box>
    </Paper>
  );

  const renderAIRecommendationsStep = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI-Powered Control Recommendations
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Assessment Summary
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="subtitle2">Sector</Typography>
            <Typography>N/A</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2">Risk Levels</Typography>
            {Object.entries(hazardAssessments).map(([domain, data]) => (
              <Box key={domain} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 150 }}>
                  {hazardDomainLabels[domain]}:
                </Typography>
                {notApplicable[domain] ? (
                  <Chip label="Non-Applicable" size="small" sx={{ bgcolor: '#888', color: 'white' }} />
                ) : (
                <Chip
                    label={calculateRiskLevel(data.likelihood!, data.consequence!).label}
                  size="small"
                  sx={{
                      bgcolor: calculateRiskLevel(data.likelihood!, data.consequence!).color,
                    color: 'white',
                  }}
                />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {isGeneratingRecommendations ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, gap: 2 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Generating AI recommendations based on your risk assessment...
          </Typography>
        </Box>
      ) : controlRecommendations.length > 0 ? (
        <Box>
          <Typography variant="h6" gutterBottom>
            AI-Generated Security Control Recommendations
            </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Based on NIST Cybersecurity Framework 2.0 and NIST CSF 2.0 compliance requirements
          </Typography>
          {controlRecommendations.map((recommendation, index) => (
            <Paper key={recommendation.id || index} sx={{ p: 3, mb: 2, border: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="primary">
                  {recommendation.name}
                </Typography>
                      <Chip
                        label={recommendation.priority}
                        color={
                    recommendation.priority === 'Critical' ? 'error' : 
                    recommendation.priority === 'High' ? 'warning' : 
                    recommendation.priority === 'Medium' ? 'info' : 'default'
                  } 
                  variant="outlined"
                />
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Typography variant="body2" paragraph>
                    {recommendation.category}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body2" paragraph>
                    {recommendation.description}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Implementation Steps</Typography>
                  <Typography variant="body2" paragraph>
                    {recommendation.implementationSteps}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">NIST CSF 2.0 Reference</Typography>
                  <Typography variant="body2" paragraph>
                    {recommendation.nistCsfReference}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary">Monitoring Requirements</Typography>
                  <Typography variant="body2">
                    {recommendation.monitoringRequirements}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText">
              These recommendations are generated based on NIST Cybersecurity Framework 2.0, Australian Essential Eight, and NIST CSF 2.0 requirements.
              They should be reviewed and tailored to your specific organizational context and regulatory obligations.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No control recommendations generated yet.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateRecommendations}
            sx={{ mt: 2 }}
          >
            Generate AI Recommendations
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={() => setCurrentStep(4)}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCompleteAssessment}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Completing Assessment...
            </>
          ) : (
            'Complete Assessment'
          )}
        </Button>
      </Box>
    </Paper>
  );

  const renderAssessmentHistory = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Risk Assessment History
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Assessed By</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>User Role</TableCell>
              <TableCell>Risk Assessment Details</TableCell>
              <TableCell>Context & Criteria</TableCell>
              <TableCell>Treatment & Controls</TableCell>
              <TableCell>AI Recommendations</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessmentHistory.map((assessment) => (
              <TableRow key={assessment.id}>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(assessment.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(assessment.date).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{assessment.user_name || 'Unknown User'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{assessment.user_id || 'N/A'}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={assessment.user_role || 'User'} 
                    size="small" 
                    color={assessment.user_role === 'admin' ? 'error' : 'primary'} 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {Object.entries(assessment.hazard_assessments || {}).map(([domain, data]) => (
                      <Box key={domain} sx={{ 
                        p: 1, 
                        border: '1px solid #eee', 
                        borderRadius: 1,
                        bgcolor: 'background.default',
                        mb: 1
                      }}>
                        <Typography variant="subtitle2" color="primary">
                          {hazardDomainLabels[domain]}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Risk Level:
                          </Typography>
                          <Chip
                            label={calculateRiskLevel(data.likelihood!, data.consequence!).label}
                            size="small"
                            sx={{
                              bgcolor: calculateRiskLevel(data.likelihood!, data.consequence!).color,
                              color: 'white',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Likelihood: {data.likelihood!}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Consequence: {data.consequence!}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Material Impact: {data.materialImpact || 'Not provided'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Existing Controls: {data.existingControls || 'Not provided'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ maxWidth: 250 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Context
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {assessment.assessment_details?.context || 'Not provided'}
                    </Typography>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Stakeholders
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {assessment.assessment_details?.stakeholders || 'Not provided'}
                    </Typography>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Risk Criteria
                    </Typography>
                    <Typography variant="body2">
                      {assessment.assessment_details?.riskCriteria || 'Not provided'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ maxWidth: 250 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Risk Treatment
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {assessment.assessment_details?.riskTreatment || 'Not provided'}
                    </Typography>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Control Validation
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {assessment.assessment_details?.controlValidation || 'Not provided'}
                    </Typography>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Effectiveness Review
                    </Typography>
                    <Typography variant="body2">
                      {assessment.assessment_details?.effectivenessReview || 'Not provided'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {pendingAssessmentId === assessment.id && isGeneratingRecommendations ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : assessment.control_recommendations ? (
                    <Box sx={{ maxWidth: 400 }}>
                      {assessment.control_recommendations.map((rec) => (
                        <Paper key={rec.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" color="primary">
                            {rec.name}
                          </Typography>
                            <Chip 
                              label={rec.priority} 
                              size="small" 
                              color={
                                rec.priority === 'Critical' ? 'error' : 
                                rec.priority === 'High' ? 'warning' : 
                                rec.priority === 'Medium' ? 'info' : 'default'
                              } 
                              variant="outlined"
                            />
                          </Box>
                          
                          <Typography variant="body2" paragraph sx={{ fontSize: '0.875rem' }}>
                            {rec.description}
                          </Typography>
                          
                          {rec.category && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              <strong>Category:</strong> {rec.category}
                            </Typography>
                          )}
                          
                          {rec.implementationSteps && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              <strong>Implementation:</strong> {rec.implementationSteps}
                            </Typography>
                          )}
                          
                          {rec.nistCsfReference && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                              <strong>NIST CSF 2.0:</strong> {rec.nistCsfReference}
                            </Typography>
                          )}
                          
                          <Typography variant="caption" color="text.secondary" display="block">
                            <strong>Monitoring:</strong> {rec.monitoringRequirements}
                          </Typography>
                          
                          {/* Fallback for old format recommendations */}
                          {rec.cost && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              Legacy: Cost: {rec.cost} | Timeline: {rec.implementationTime}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No recommendations available</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  const handleCompleteAssessment = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // Prepare hazard assessments with notApplicable logic
      const preparedHazardAssessments: HazardAssessments = {};
      hazardDomains.forEach(domain => {
        if (notApplicable[domain]) {
          preparedHazardAssessments[domain] = {
            notApplicable: true,
            likelihood: null,
            consequence: null,
            materialImpact: '',
            existingControls: '',
            riskLevel: ''
          } as any;
        } else {
          preparedHazardAssessments[domain] = {
            ...hazardAssessments[domain],
            notApplicable: false
          };
        }
      });
      await submitAssessmentOnce(controlRecommendations, preparedHazardAssessments);
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  // Update submitAssessmentOnce to accept hazardAssessments as a parameter
  const submitAssessmentOnce = async (recommendations: ControlRecommendation[], hazardAssessmentsOverride?: HazardAssessments) => {
    try {
      const response = await fetch('http://localhost:3001/api/risk-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          risk_name: riskName,
          assigned_to: assignedTo,
          requirement_id: requirementId,
          scores,
          comments,
          compensating_controls: compensatingControls,
          assessment_details: riskAssessmentDetails,
          hazard_assessments: hazardAssessmentsOverride || hazardAssessments,
          control_recommendations: recommendations.length > 0 ? recommendations : undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }
      const result = await response.json();
      setSubmittedAssessment(result);
      setCurrentStep(5);
      setShowSuccess(true);
      await fetchAssessmentHistory();

      // Send notifications to assigned users
      for (const username of assignedTo) {
        try {
          await fetch('http://localhost:3001/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user: username,
              type: 'risk_assigned',
              message: `You have been assigned as a risk owner for the assessment: "${riskName}"`,
            }),
          });
        } catch (err) {
          console.error('Error sending notification:', err);
        }
      }

      // Call onAssessmentComplete to trigger tab change
      onAssessmentComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
      console.error('Error submitting assessment:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading risk factors...</Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {renderStepIndicator()}
      
      {!assessmentComplete ? (
        <>
          {currentStep === 1 && renderContextStep()}
          {currentStep === 2 && renderRiskAssessmentStep()}
          {currentStep === 3 && renderRiskTreatmentStep()}
          {currentStep === 4 && renderReviewStep()}
          {currentStep === 5 && renderAIRecommendationsStep()}
        </>
      ) : (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>
            Risk assessment completed successfully!
          </Alert>
          {renderAssessmentHistory()}
        </>
      )}

      {error && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Snackbar open={showSuccess} autoHideDuration={4000} onClose={() => setShowSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Risk assessment and AI recommendations have been saved and recorded in the assessment history.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RiskAssessmentForm; 