import { useLanguage } from '../contexts/LanguageContext';

interface PDFOptions {
  content: any;
  title?: string;
  type: 'gap-analysis' | 'key-documents' | 'api-dashboard' | 'risk-assessment' | 'requirements';
  language?: 'en' | 'ar';
  metadata?: Record<string, any>;
}

export const generatePDF = async ({ content, title, type, language = 'en', metadata }: PDFOptions) => {
  try {
    const response = await fetch('http://localhost:3001/api/requirements/generate-generic-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        title,
        type,
        language,
        metadata
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    // Create blob from response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Thinkbots-${type}-${Date.now()}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const generateLegacyPDF = ({ title, content, language = 'en' }: any) => {
  console.warn('generateLegacyPDF is deprecated. Use generatePDF instead.');
  return generatePDF({ content, title, type: 'requirements', language });
}; 