import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const NistGapAnalysis: React.FC = () => {
  const { t } = useLanguage();
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... keep existing submit logic ...
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        {t('nistGapAnalysis')}
      </Typography>
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          '& .MuiAlert-message': {
            fontSize: '0.9rem',
            lineHeight: 1.5
          }
        }}
      >
        <Typography variant="body2" component="div">
          <strong>{t('gapAnalysisDisclaimer')}</strong> {t('gapAnalysisDescription')}
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>{t('gapAnalysisRecommendation1')}</li>
            <li>{t('gapAnalysisRecommendation2')}</li>
            <li>{t('gapAnalysisRecommendation3')}</li>
            <li>{t('gapAnalysisRecommendation4')}</li>
          </ul>
          {t('gapAnalysisNote')}
        </Typography>
      </Alert>
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('enterNistControl')}
            placeholder={t('enterNistControlPlaceholder')}
            value={requirement}
            onChange={e => setRequirement(e.target.value)}
            multiline
            minRows={2}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #283593 30%, #3949ab 90%)',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 3px 5px 2px rgba(40, 53, 147, .3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
                boxShadow: '0 4px 8px 3px rgba(40, 53, 147, .4)',
              },
              '&:active': {
                boxShadow: '0 2px 4px 1px rgba(40, 53, 147, .3)',
                transform: 'translateY(1px)',
              },
              '&.Mui-disabled': {
                background: 'linear-gradient(45deg, #9fa8da 30%, #c5cae9 90%)',
                color: 'rgba(255, 255, 255, 0.7)',
              }
            }}
          >
            {loading ? t('analyzing') : t('analyzeGaps')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default NistGapAnalysis; 