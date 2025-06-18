import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tooltip,
  Paper,
  Grid,
  IconButton,
  Popover,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface Requirement {
  id: string;
  title: string;
  risk_score: number;
  risk_level: string;
}

interface RiskHeatMapProps {
  requirements: Requirement[];
  onRequirementSelect: (requirementId: string) => void;
}

const RiskHeatMap: React.FC<RiskHeatMapProps> = ({ requirements, onRequirementSelect }) => {
  const { token } = useAuth();
  // Risk Matrix Configuration
  const likelihoodLevels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
  const consequenceLevels = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Severe'];
  
  const getRiskLevel = (likelihood: number, consequence: number) => {
    const score = likelihood * consequence;
    if (score >= 20) return 'Critical';
    if (score >= 15) return 'High';
    if (score >= 10) return 'Medium';
    if (score >= 5) return 'Low';
    return 'Minimal';
  };

  const getRiskLevelColor = (level: string | null) => {
    if (!level) return 'grey.500';
    
    switch (level.toLowerCase()) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#4caf50';
      case 'minimal':
        return '#2196f3';
      default:
        return 'grey.500';
    }
  };

  // Render Risk Matrix
  const renderRiskMatrix = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Risk Rating Matrix
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This matrix helps visualize how likelihood and consequence combine to determine risk levels. 
        When performing an assessment, consider each risk factor's likelihood and potential impact 
        to determine its position on this matrix.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
        {/* Header Row */}
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gridColumn: '1'
        }}>
          <Typography variant="subtitle2">Likelihood ↓</Typography>
        </Box>
        {consequenceLevels.map((level, index) => (
          <Box 
            key={level}
            sx={{ 
              p: 1, 
              textAlign: 'center',
              border: '1px solid #ddd',
              bgcolor: 'grey.100',
              gridColumn: `${index + 2}`
            }}
          >
            <Typography variant="caption">{level}</Typography>
          </Box>
        ))}

        {/* Matrix Cells */}
        {likelihoodLevels.map((likelihood, lIndex) => (
          <React.Fragment key={likelihood}>
            <Box 
              sx={{ 
                p: 1, 
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ddd',
                bgcolor: 'grey.100',
                gridColumn: '1',
                gridRow: `${lIndex + 2}`
              }}
            >
              <Typography variant="caption">{likelihood}</Typography>
            </Box>
            {consequenceLevels.map((consequence, cIndex) => {
              const riskLevel = getRiskLevel(lIndex + 1, cIndex + 1);
              return (
                <Box 
                  key={`${likelihood}-${consequence}`}
                  sx={{ 
                    p: 1,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ddd',
                    bgcolor: getRiskLevelColor(riskLevel),
                    color: 'white',
                    cursor: 'pointer',
                    gridColumn: `${cIndex + 2}`,
                    gridRow: `${lIndex + 2}`,
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                >
                  <Typography variant="caption">{riskLevel}</Typography>
                </Box>
              );
            })}
          </React.Fragment>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Risk Level Guide:
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Box>
            <Typography variant="body2" gutterBottom>
              <strong>Likelihood Scale:</strong>
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {likelihoodLevels.map((level, index) => (
                <li key={level}>
                  <Typography variant="body2">
                    {level} ({index + 1}) - {getLikelihoodDescription(index + 1)}
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>
          <Box>
            <Typography variant="body2" gutterBottom>
              <strong>Consequence Scale:</strong>
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {consequenceLevels.map((level, index) => (
                <li key={level}>
                  <Typography variant="body2">
                    {level} ({index + 1}) - {getConsequenceDescription(index + 1)}
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>
        </Box>
      </Box>
    </Paper>
  );

  // Helper functions for descriptions
  const getLikelihoodDescription = (level: number): string => {
    switch (level) {
      case 1: return 'Very unlikely to occur';
      case 2: return 'Unlikely to occur';
      case 3: return 'May occur occasionally';
      case 4: return 'Likely to occur';
      case 5: return 'Almost certain to occur';
      default: return '';
    }
  };

  const getConsequenceDescription = (level: number): string => {
    switch (level) {
      case 1: return 'Minimal impact';
      case 2: return 'Minor impact';
      case 3: return 'Moderate impact';
      case 4: return 'Major impact';
      case 5: return 'Severe impact';
      default: return '';
    }
  };

  const [infoAnchor, setInfoAnchor] = React.useState<null | HTMLElement>(null);
  const handleInfoOpen = (event: React.MouseEvent<HTMLElement>) => {
    setInfoAnchor(event.currentTarget);
  };
  const handleInfoClose = () => {
    setInfoAnchor(null);
  };
  const infoOpen = Boolean(infoAnchor);

  const [latestRisk, setLatestRisk] = useState<{ score: number; level: string } | null>(null);

  useEffect(() => {
    // Find the Risk Management Program requirement
    const rmp = requirements.find(r => r.title === 'Risk Management Program');
    if (!rmp) return;
    // Fetch latest assessment history for this requirement
    fetch(`http://localhost:3001/api/risk-assessment/history/${rmp.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Calculate the average of all assessment scores (as per tooltip)
          let totalAssessmentScore = 0;
          let assessmentCount = 0;

          data.forEach(assessment => {
            const hazardAssessments = Object.values(assessment.hazard_assessments || {}) as any[];
            if (hazardAssessments.length > 0) {
              // Calculate this assessment's score
              let avgLikelihood = hazardAssessments.reduce((sum, h) => sum + (h.likelihood || 0), 0) / hazardAssessments.length;
              let avgConsequence = hazardAssessments.reduce((sum, h) => sum + (h.consequence || 0), 0) / hazardAssessments.length;
              const assessmentScore = (avgLikelihood + avgConsequence) / 2;
              totalAssessmentScore += assessmentScore;
              assessmentCount++;
            }
          });

          // Average all assessment scores
          const averageScore = assessmentCount > 0 ? totalAssessmentScore / assessmentCount : 0;
          const score = Math.round(averageScore);
          
          // Determine risk level from average score
          let level = 'Minimal';
          if (score >= 80) level = 'Critical';
          else if (score >= 60) level = 'High';
          else if (score >= 40) level = 'Medium';
          else if (score >= 20) level = 'Low';
          setLatestRisk({ score, level });
        } else {
          setLatestRisk(null);
        }
      })
      .catch(err => {
        console.error('Error fetching risk assessment history:', err);
        setLatestRisk(null);
      });
  }, [requirements, token]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Requirements Risk Assessment
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Select the Risk Management Program below to perform a detailed risk assessment. 
        The risk level shown is based on the combined impact of all risk factors.
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        {requirements
          .filter(requirement => requirement.title === 'Risk Management Program')
          .map((requirement) => (
            <React.Fragment key={requirement.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(92, 107, 192, 0.2)',
                  },
                  maxWidth: 400,
                  background: 'linear-gradient(135deg, #5c6bc0 0%, #3949ab 50%, #283593 100%) !important',
                  color: '#fff !important',
                  boxShadow: '0 4px 20px rgba(92, 107, 192, 0.15) !important',
                  borderRadius: 3,
                  border: 'none',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, rgba(92,107,192,0.3) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover::before': {
                    opacity: 1,
                  },
                  '& .MuiCardContent-root': {
                    color: '#fff !important',
                    '& .MuiTypography-root': {
                      color: '#fff !important',
                    },
                  },
                }}
                onClick={() => onRequirementSelect(requirement.id)}
                className="risk-program-card"
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {requirement.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: (theme) => {
                          switch (latestRisk?.level?.toLowerCase()) {
                            case 'critical':
                              return '#d32f2f';
                            case 'high':
                              return '#f57c00';
                            case 'medium':
                              return '#ffc107';
                            case 'low':
                              return '#4caf50';
                            case 'minimal':
                              return '#2196f3';
                            default:
                              return '#5c6bc0';
                          }
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#fff' }}>
                      Risk Level: {latestRisk?.level || 'Not Assessed'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Risk Score: {latestRisk ? latestRisk.score : requirement.risk_score}
                  </Typography>
                </CardContent>
              </Card>
              <IconButton size="small" onClick={handleInfoOpen} sx={{ ml: 1, color: '#1976d2', alignSelf: 'flex-start' }}>
                <InfoOutlinedIcon />
              </IconButton>
              <Popover
                open={infoOpen}
                anchorEl={infoAnchor}
                onClose={handleInfoClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <Box sx={{ p: 2, maxWidth: 320 }}>
                  <Typography variant="subtitle2" gutterBottom>How is this calculated?</Typography>
                  <Typography variant="body2">
                    The <b>Risk Score</b> is the average of all assessment scores for this requirement.<br /><br />
                    For each assessment, the score is calculated as:<br />
                    <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, my: 1, fontFamily: 'monospace', fontSize: 15 }}>
                      (Average Likelihood + Average Consequence) / 2
                    </Box>
                    (Averaged across all hazard domains in the assessment.)<br /><br />
                    The <b>Risk Level</b> is then determined from the average score:<br />
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li><b>Critical:</b> 80–100</li>
                      <li><b>High:</b> 60–79</li>
                      <li><b>Medium:</b> 40–59</li>
                      <li><b>Low:</b> 20–39</li>
                      <li><b>Minimal:</b> 0–19</li>
                    </ul>
                    <br />
                    This means if you have several assessments, the card shows the <b>average risk</b> across all of them, not just the highest or most recent.
                  </Typography>
                </Box>
              </Popover>
            </React.Fragment>
          ))}
      </Box>

      {/* Risk Level Guide */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Risk Level Guide:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#d32f2f', borderRadius: 1 }} />
            <Typography>Critical (80-100)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#f57c00', borderRadius: 1 }} />
            <Typography>High (60-79)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#ffc107', borderRadius: 1 }} />
            <Typography>Medium (40-59)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', borderRadius: 1 }} />
            <Typography>Low (20-39)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: '#2196f3', borderRadius: 1 }} />
            <Typography>Minimal (0-19)</Typography>
          </Box>
        </Box>
      </Paper>

      {renderRiskMatrix()}
    </Box>
  );
};

export default RiskHeatMap; 