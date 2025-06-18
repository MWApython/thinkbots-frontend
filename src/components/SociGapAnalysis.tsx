import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowDownTrayIcon, CheckCircleIcon, ExclamationCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { generatePDF } from '../utils/pdfGenerator';
import { apiGet, apiPost, apiUpload, getApiUrl } from '../utils/api';

const nistDomains = [
  {
    id: 'GV',
    name: 'GOVERN (GV)',
    description: 'Organizational context, risk management strategy, and supply chain risk management'
  },
  {
    id: 'ID',
    name: 'IDENTIFY (ID)',
    description: 'Asset management, business environment, governance, risk assessment, and risk management strategy'
  },
  {
    id: 'PR',
    name: 'PROTECT (PR)',
    description: 'Identity management, access control, awareness and training, data security, and maintenance'
  },
  {
    id: 'DE',
    name: 'DETECT (DE)',
    description: 'Continuous monitoring, anomaly detection, and event detection'
  },
  {
    id: 'RS',
    name: 'RESPOND (RS)',
    description: 'Incident management, incident analysis, and incident response'
  },
  {
    id: 'RC',
    name: 'RECOVER (RC)',
    description: 'Incident recovery plan execution and improvements'
  }
];

const LOGS_KEY = 'nist_gap_analysis_logs';

interface AnalysisResult {
  tier_assessment: {
    tier: number;
    explanation: string;
    criteria_met: string[];
    criteria_missing: string[];
  };
  compliant: Array<{
    id: string;
    category: string;
    subcategory: string;
    explanation: string;
  }>;
  gaps?: Array<{
    id: string;
    category: string;
    subcategory: string;
    explanation: string;
  }>;
  recommendations?: Array<{
    id: string;
    category: string;
    subcategory: string;
    recommendation: string;
  }>;
  gaps_summary: {
    has_gaps: boolean;
    explanation: string;
  };
}

const SociGapAnalysis: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedDomain, setSelectedDomain] = useState(nistDomains[0]);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<{ upload: boolean; analyze: boolean; delete: boolean }>({ upload: false, analyze: false, delete: false });
  const terminalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch logs from backend on mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await apiGet('/api/gap-analysis-log');
        setLogs(data);
      } catch (error) {
        console.warn('Error fetching logs:', error);
      }
    };
    fetchLogs();
  }, []);

  const addLog = async (message: string) => {
    try {
      await apiPost('/api/gap-analysis-log', { log: message, username: user?.email || 'Anonymous' });
      const updatedLogs = await apiGet('/api/gap-analysis-log');
      setLogs(updatedLogs);
    } catch (error) {
      console.warn('Error adding log:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      await addLog(`Document selected: ${file.name}`);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !selectedDomain) return;

    setLoading(true);
    setLogs([]);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('domain', selectedDomain.id);
      formData.append('language', language);

      console.log('Sending analysis request with language:', language);

      const data = await apiUpload('/api/gap-analysis', formData);
      console.log('Received analysis response:', data);
      setResults(data);
    } catch (error) {
      console.error('Error analyzing document:', error);
      setLogs(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    apiPost('/api/gap-analysis-log', { log: '__CLEAR__' });
    setLogs([]);
  };

  const handleDownloadLogs = async () => {
    try {
      const response = await fetch(getApiUrl('/api/gap-analysis-log/download'));
      if (!response.ok) {
        throw new Error('Failed to download logs');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gap-analysis-logs.txt';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading logs:', error);
      alert('Failed to download logs');
    }
  };

  // Helper to download results as PDF
  const handleDownloadPDF = async () => {
    if (!results) return;
    
    try {
      const content = [];
      
      // Add compliant areas
      if (Array.isArray(results.compliant) && results.compliant.length > 0) {
        content.push({
          title: language === 'ar' ? 'المناطق الممتثلة:' : 'Compliant Areas:',
          content: results.compliant.map((item: any) => 
            `- ${item.id} (${item.category}): ${item.subcategory}\n  ${language === 'ar' ? 'الشرح:' : 'Explanation:'} ${item.explanation}`
          ).join('\n\n')
        });
      }
      
      // Add gaps
      if (Array.isArray(results.gaps) && results.gaps.length > 0) {
        content.push({
          title: language === 'ar' ? 'الفجوات:' : 'Gaps:',
          content: results.gaps.map((item: any) => 
            `- ${item.id} (${item.category}): ${item.subcategory}\n  ${language === 'ar' ? 'الشرح:' : 'Explanation:'} ${item.explanation}`
          ).join('\n\n')
        });
      }
      
      // Add recommendations
      if (Array.isArray(results.recommendations) && results.recommendations.length > 0) {
        content.push({
          title: language === 'ar' ? 'التوصيات:' : 'Recommendations:',
          content: results.recommendations.map((item: any) => 
            `- ${item.id} (${item.category}): ${item.subcategory}\n  ${language === 'ar' ? 'التوصية:' : 'Recommendation:'} ${item.recommendation}`
          ).join('\n\n')
        });
      }
      
      // Add tier assessment if available
      if (results.tier_assessment) {
        content.push({
          title: language === 'ar' ? 'تقييم المستوى:' : 'Tier Assessment:',
          content: `${language === 'ar' ? 'المستوى:' : 'Tier:'} ${results.tier_assessment.tier}\n${language === 'ar' ? 'الشرح:' : 'Explanation:'} ${results.tier_assessment.explanation}`
        });
      }
      
      const metadata = {
        domain: selectedDomain.name,
        date: new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en'),
        user: 'System User'
      };
      
      await generatePDF({
        content,
        type: 'gap-analysis',
        language: language as 'en' | 'ar',
        metadata
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(language === 'ar' ? 'فشل في إنشاء ملف PDF' : 'Failed to generate PDF');
    }
  };

  // Animated light component
  const StatusLight = ({ active, label, color }: { active: boolean; label: string; color: string }) => {
    const colorClass = active
      ? color === 'green'
        ? 'bg-green-500 animate-pulse'
        : color === 'yellow'
        ? 'bg-yellow-400 animate-pulse'
        : color === 'red'
        ? 'bg-red-500 animate-pulse'
        : 'bg-gray-300'
      : 'bg-gray-300';
    return (
      <div className="flex flex-col items-center mx-2">
        <span className={`w-4 h-4 rounded-full mb-1 transition-all duration-300 shadow-lg ${colorClass}`}></span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex flex-col w-full min-h-0 h-screen gap-8 px-8 py-8">
        {/* Top row with two cards */}
        <div className="flex gap-8">
          {/* Left column */}
          <div className="w-2/5 bg-white rounded-xl shadow-lg p-10 flex flex-col justify-start">
            <h1 className="text-3xl font-bold mb-4 text-primary-700">{t('nistGapAnalysis')}</h1>
            {/* Disclaimer card under heading */}
            <div className="mb-6 w-full">
              <div className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <svg className="w-6 h-6 text-blue-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <div className="text-sm text-blue-900">
                  {t('gapAnalysisDisclaimer')}
                </div>
              </div>
            </div>
            <p className="mb-6 text-gray-700 text-lg">
              {t('gapAnalysisDescription')}
            </p>
            <div className="mb-6">
              <label className="block font-semibold mb-2">{t('selectNistDomain')}</label>
              <select
                value={selectedDomain.id}
                onChange={(e) => {
                  const domain = nistDomains.find(d => d.id === e.target.value);
                  if (domain) setSelectedDomain(domain);
                }}
                className="w-full p-2 border rounded-lg mb-2"
                title={t('selectNistDomain')}
                aria-label={t('selectNistDomain')}
              >
                {nistDomains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-1">{selectedDomain.description}</p>
            </div>
            <div className="mb-6">
              <label className="block font-semibold mb-2">{t('uploadPolicy')}</label>
              <div 
                className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) {
                    const event = { target: { files: [droppedFile] } } as any;
                    handleFileChange(event);
                  }
                }}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt"
                  title={t('uploadPolicy')}
                  aria-label={t('uploadPolicy')}
                />
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium">
                    {file ? file.name : t('orDragAndDrop')}
                  </p>
                  <p className="text-xs mt-1 text-gray-400">
                    {t('supportedFormats')}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`w-full py-3 rounded-lg text-white font-semibold ${
                !file || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {loading ? t('analyzing') : t('analyzeGaps')}
            </button>
          </div>

          {/* Right column */}
          <div className="w-3/5 bg-white rounded-xl shadow-lg p-10 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6 text-primary-700">{t('analysisResults')}</h2>
            
            {results && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{t('analysisResults')}</h2>
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    {t('downloadAsPdf')}
                  </button>
                </div>
                
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4">
                  {/* Tier Assessment */}
                  {results.tier_assessment && (
                    <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
                      <h3 className="text-lg font-semibold text-purple-900 mb-4">NIST CSF 2.0 Implementation Tier</h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-purple-700">Tier Level:</span>
                          <span className="ml-2 text-lg font-bold text-purple-900">Tier {results.tier_assessment.tier}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-purple-700">Explanation:</span>
                          <p className="mt-1 text-purple-900">{results.tier_assessment.explanation}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-purple-700">Criteria Met:</span>
                          <ul className="mt-1 list-disc list-inside text-purple-900">
                            {results.tier_assessment.criteria_met.map((criteria: string, index: number) => (
                              <li key={index}>{criteria}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-purple-700">Criteria Missing:</span>
                          <ul className="mt-1 list-disc list-inside text-purple-900">
                            {results.tier_assessment.criteria_missing.map((criteria: string, index: number) => (
                              <li key={index}>{criteria}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compliant Areas */}
                  {results.compliant && results.compliant.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-6 border border-green-100">
                      <h3 className="text-lg font-semibold text-green-900 mb-4">Compliant Areas</h3>
                      <div className="space-y-4">
                        {results.compliant.map((item, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-start">
                              <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-green-900">{item.id} - {item.category}</h4>
                                <p className="text-sm text-green-700 mt-1">{item.subcategory}</p>
                                <p className="text-sm text-gray-600 mt-2">{item.explanation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gaps Summary */}
                  {results.gaps_summary && (
                    <div className={`rounded-lg p-6 border ${results.gaps_summary.has_gaps ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                      <h3 className="text-lg font-semibold mb-4">
                        {results.gaps_summary.has_gaps ? 'Gaps Analysis' : 'No Gaps Found'}
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-start">
                            {results.gaps_summary.has_gaps ? (
                              <ExclamationCircleIcon className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                            ) : (
                              <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                            )}
                            <div className="ml-3">
                              <p className="text-sm text-gray-600">{results.gaps_summary.explanation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gaps Details - Only show if gaps exist */}
                  {results.gaps_summary?.has_gaps && results.gaps && results.gaps.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-6 border border-red-100">
                      <h3 className="text-lg font-semibold text-red-900 mb-4">Detailed Gaps</h3>
                      <div className="space-y-4">
                        {results.gaps.map((gap, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-start">
                              <ExclamationCircleIcon className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-red-900">{gap.id} - {gap.category}</h4>
                                <p className="text-sm text-red-700 mt-1">{gap.subcategory}</p>
                                <p className="text-sm text-gray-600 mt-2">{gap.explanation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations - Only show if gaps exist */}
                  {results.gaps_summary?.has_gaps && results.recommendations && results.recommendations.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">Recommendations</h3>
                      <div className="space-y-4">
                        {results.recommendations.map((rec, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-start">
                              <LightBulbIcon className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-blue-900">{rec.id} - {rec.category}</h4>
                                <p className="text-sm text-blue-700 mt-1">{rec.subcategory}</p>
                                <p className="text-sm text-gray-600 mt-2">{rec.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terminal spanning both columns */}
        <div className="w-full bg-black text-green-400 font-mono p-4 rounded-xl shadow-lg flex flex-col" style={{ height: '400px' }}>
          <div className="flex items-center mb-2">
            <StatusLight active={status.upload} label={t('upload')} color="green" />
            <StatusLight active={status.analyze} label={t('analyze')} color="yellow" />
            <StatusLight active={status.delete} label={t('delete')} color="red" />
            <div className="ml-auto flex space-x-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all text-xs"
                onClick={handleDownloadLogs}
                title={t('downloadLogs')}
              >
                {t('downloadLogs')}
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-all text-xs"
                onClick={handleClearLogs}
                title={t('clearLogs')}
              >
                {t('clearLogs')}
              </button>
            </div>
          </div>
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto bg-black rounded-b-xl p-2 border-t border-gray-700"
            style={{ 
              fontSize: '0.95rem',
              maxHeight: 'calc(400px - 3rem)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#4a5568 #1a202c'
            }}
          >
            {logs.length === 0 ? (
              <div className="text-gray-500">{t('noLogs')}</div>
            ) : (
              logs.map((log, idx) => <div key={idx}>{log}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SociGapAnalysis; 