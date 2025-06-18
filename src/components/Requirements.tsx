import React, { useState, useRef, useEffect } from 'react';
import { requirements, Requirement } from '../data/requirementsData';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import '../styles/pdf-export.css';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsernameFromEmail } from '../utils/emailHelpers';
import { generatePDF } from '../utils/pdfGenerator';
import { apiGet, apiPost } from '../utils/api';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function formatBotOutput(content: string): string {
  content = content.replace(/(#{1,6} .+?)\*+$/gm, '$1');
  content = content.replace(/\*{2,}/g, '**');
  content = content.replace(/\n{3,}/g, '\n\n');
  return content.trim();
}

const fetchBotAnswer = async (question: string, language: string = 'en'): Promise<string> => {
  try {
    const systemPrompt = language === 'ar' 
      ? 'أنت خبير في إطار عمل NIST للأمن السيبراني (CSF) 2.0. قدم إجابة شاملة وواضحة وقابلة للتنفيذ للمستخدمين النهائيين. قم بتضمين أمثلة عملية وشروحات باللغة العربية ومراجع لإطار عمل NIST CSF 2.0 حيثما أمكن. استخدم النقاط والعناوين للوضوح. إذا كان ذلك مناسبًا، اقترح الخطوات التالية أو أفضل الممارسات للتنفيذ. أجب باللغة العربية فقط.'
      : 'You are an expert on the NIST Cybersecurity Framework (CSF) 2.0. Provide a comprehensive, clear, and actionable answer for end users. Include practical examples, plain English explanations, and references to the NIST CSF 2.0 framework where possible. Use bullet points and headings for clarity. If relevant, suggest next steps or best practices for implementation.';

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data.choices?.[0]?.message?.content || (language === 'ar' ? 'لم يتم العثور على إجابة.' : 'No answer found.');
  } catch (e) {
    return language === 'ar' ? 'عذرًا، لم أتمكن من الحصول على إجابة. يرجى المحاولة مرة أخرى.' : 'Sorry, I could not get an answer. Please try again.';
  }
};

// Add a helper to get a unique key for requirement+checklist+language
function getChecklistKey(requirementId: string, checked: boolean[], language: string = 'en'): string {
  const baseKey = !checked || checked.length === 0 || checked.every(c => !c) 
    ? `${requirementId}-general` 
    : `${requirementId}-` + checked.map((c, i) => c ? i : null).filter(i => i !== null).join('-');
  return `${baseKey}-${language}`;
}

const Requirements: React.FC = () => {
  const { token } = useAuth();
  const { language, t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ [key: string]: boolean[] }>({});
  const [botOutput, setBotOutput] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const [savedResponses, setSavedResponses] = useState<{ [key: string]: { response: string, timestamp: string, chatHistory?: string[] } }>({});
  const [chatHistory, setChatHistory] = useState<{ [key: string]: string[] }>({});
  const botOutputRef = useRef<HTMLDivElement>(null);

  // Fetch saved responses on mount and when token changes
  useEffect(() => {
    const fetchResponses = async () => {
      if (!token) {
        console.log('No token available for fetching responses');
        return;
      }
      try {
        console.log('Fetching saved responses...');
        const data = await apiGet('/api/requirements-responses');
        setSavedResponses(data || {});
        
        // If we have an expanded requirement, restore its response
        if (expanded) {
          const checklist = checked[expanded] || [];
          const checklistKey = getChecklistKey(expanded, checklist, language);
          if (data[checklistKey]) {
            setBotOutput(formatBotOutput(data[checklistKey].response));
            setChatHistory(prev => ({ ...prev, [checklistKey]: data[checklistKey].chatHistory || [] }));
          }
        }
      } catch (err) {
        console.error('Error fetching responses:', err);
      }
    };
    fetchResponses();
  }, [token, expanded, checked, language]);

  // Persist expanded and checked state in localStorage
  useEffect(() => {
    if (expanded) {
      localStorage.setItem('requirements_last_expanded', expanded);
      localStorage.setItem('requirements_last_checked', JSON.stringify(checked[expanded] || []));
    }
  }, [expanded, checked]);

  const handleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  const handleCheck = (reqId: string, idx: number) => {
    setChecked(prev => ({
      ...prev,
      [reqId]: prev[reqId]
        ? prev[reqId].map((c: boolean, i: number) => (i === idx ? !c : c))
        : (requirements.find((r: Requirement) => r.id === reqId)?.checklist.map((_, i) => i === idx) || [])
    }));
  };

  const handleAskBot = async (summary: string, requirementId: string) => {
    if (!token) {
      console.error('No token available for saving response');
      return;
    }

    setBotLoading(true);
    setBotOutput('');
    const checklist = checked[requirementId] || [];
    const checklistKey = getChecklistKey(requirementId, checklist, language);
    
    console.log('Handling bot request:', {
      requirementId,
      checklistKey,
      checklist,
      savedResponses
    });
    
    // Get selected checklist item names
    const selectedChecklistItems = (requirements.find(r => r.id === requirementId)?.checklist || []).filter((_, idx) => checklist[idx]);
    
    // Check if we have a saved response for this checklistKey
    if (savedResponses[checklistKey]) {
      console.log('Found saved response for key:', checklistKey, savedResponses[checklistKey]);
      setBotOutput(formatBotOutput(savedResponses[checklistKey].response));
      setChatHistory(prev => ({ ...prev, [checklistKey]: savedResponses[checklistKey].chatHistory || [] }));
      setBotLoading(false);
      setTimeout(() => {
        botOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    // Compose the question for Critical AI
    let question = summary;
    if (selectedChecklistItems.length > 0) {
      question += '\n\nChecklist selected: ' + selectedChecklistItems.join(', ');
    }

    const answer = await fetchBotAnswer(question, language);
    const formattedAnswer = formatBotOutput(answer);
    setBotOutput(formattedAnswer);

    // Save the response
    try {
      console.log('Saving response for key:', checklistKey);
      const savedData = await apiPost('/api/requirements-responses', {
        requirementId,
        checklistKey,
        response: formattedAnswer,
        chatHistory: [question]
      });
      console.log('Response saved successfully:', savedData);
      setSavedResponses(savedData);
      setChatHistory(prev => ({ ...prev, [checklistKey]: [question] }));
    } catch (err) {
      console.error('Error saving response:', err);
    }

    setBotLoading(false);
    setTimeout(() => {
      botOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Download as PDF with enhanced configuration
  const handleDownload = async () => {
    if (!botOutput || !expanded) return;
    
    const currentReq = requirements.find(r => r.id === expanded);
    if (!currentReq) return;
    
    try {
      const content = [
        {
          title: currentReq.title,
          content: botOutput
        }
      ];
      
      const metadata = {
        title: currentReq.title,
        legalReference: currentReq.legalReference || 'N/A',
        checklist: Array.isArray(currentReq.checklist) ? currentReq.checklist.join(', ') : 'General Analysis',
        date: new Date().toLocaleDateString(language === 'ar' ? 'ar' : 'en'),
        user: 'System User'
      };
      
      await generatePDF({
        content,
        type: 'requirements',
        language: language as 'en' | 'ar',
        metadata
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(language === 'ar' ? 'فشل في إنشاء ملف PDF' : 'Failed to generate PDF');
    }
  };

  // Print the output
  const handlePrint = () => {
    if (!botOutput) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write('<pre>' + botOutput + '</pre>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Group requirements by category
  const grouped = requirements.reduce((acc, req) => {
    acc[req.category] = acc[req.category] || [];
    acc[req.category].push(req);
    return acc;
  }, {} as Record<string, Requirement[]>);

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Requirements List */}
      <div className={`w-2/5 max-w-xl p-4 overflow-y-auto border-r custom-scrollbar ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        <h1 className={`text-2xl font-bold mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('nistRequirementsTitle')}</h1>
        {Object.entries(grouped).map(([category, reqs]) => (
          <div key={category} className="mb-6">
            <h2 className={`text-lg font-bold mb-2 text-primary-700 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{category}</h2>
            {reqs.map((req: Requirement) => (
              <div key={req.id} className="mb-4 border rounded shadow-sm bg-white">
                <button
                  className={`w-full px-4 py-3 font-semibold text-lg bg-blue-50 hover:bg-blue-100 rounded-t ripple-button ${language === 'ar' ? 'text-right' : 'text-left'}`}
                  onClick={() => handleExpand(req.id)}
                >
                  <span className="text-primary-600 font-mono mr-2">{req.id}</span>
                  {req.title}
                </button>
                {expanded === req.id && (
                  <div className={`px-4 py-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="mb-2 text-gray-700">{req.summary}</p>
                    <div className="mb-2">
                      <span className="font-semibold">{t('checklist')}</span>
                      <ul className={`list-disc mt-1 ${language === 'ar' ? 'mr-6' : 'ml-6'}`}>
                        {req.checklist.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`check-${req.id}-${idx}`}
                              checked={checked[req.id]?.[idx] || false}
                              onChange={() => handleCheck(req.id, idx)}
                              className={language === 'ar' ? 'ml-2' : 'mr-2'}
                            />
                            <label htmlFor={`check-${req.id}-${idx}`}>{item}</label>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">{t('example')}</span>
                      <p className={`text-gray-600 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{req.example}</p>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">{t('legalReference')}</span>
                      <a
                        href="https://www.legislation.gov.au/C2024A00100/latest/text"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-blue-700 underline ${language === 'ar' ? 'mr-2' : 'ml-2'}`}
                      >
                        {req.legalReference}
                      </a>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">{t('sectors')}</span>
                      <p className={`text-gray-600 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{req.sector.join(', ')}</p>
                    </div>
                    {req.priority && (
                      <div className="mb-2">
                        <span className="font-semibold">{t('priority')}</span>
                        <span className={`px-2 py-1 rounded text-sm ${language === 'ar' ? 'mr-2' : 'ml-2'} ${
                          req.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          req.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                          req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {req.priority}
                        </span>
                      </div>
                    )}
                    {req.complianceDeadline && (
                      <div className="mb-2">
                        <span className="font-semibold">{t('complianceDeadline')}</span>
                        <p className={`text-gray-600 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{req.complianceDeadline}</p>
                      </div>
                    )}
                    {req.reportingFrequency && (
                      <div className="mb-2">
                        <span className="font-semibold">{t('reportingFrequency')}</span>
                        <p className={`text-gray-600 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{req.reportingFrequency}</p>
                      </div>
                    )}
                    <div className="mt-6 flex justify-center">
                    <button
                        className="bg-primary-600 text-white rounded hover:bg-primary-700 ripple-button fun-ripple-button"
                      onClick={() => handleAskBot(req.summary, req.id)}
                    >
                        {t('askCriticalAi')}
                    </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Bot Output Card */}
      <div className={`w-3/5 flex flex-col items-stretch justify-start bg-gray-50 overflow-y-auto p-8 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg p-8">
          <h2 className={`text-xl font-bold mb-4 text-primary-700 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t('criticalAiResponse')}</h2>
          <div className={`mb-2 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <span className="font-semibold">{t('checklistSelected')}</span>
            {(() => {
              const checklist = checked[expanded || ''] || [];
              const selectedItems = (requirements.find(r => r.id === expanded)?.checklist || []).filter((_, idx) => checklist[idx]);
              return selectedItems.length > 0 ? (
                <span className={language === 'ar' ? 'mr-2' : 'ml-2'}>{selectedItems.join(', ')}</span>
              ) : (
                <span className={`text-gray-500 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>{t('generalNoChecklist')}</span>
              );
            })()}
          </div>
          <div ref={botOutputRef} className="pdf-export">
            {botLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">{t('generatingResponse')}</span>
              </div>
            ) : botOutput ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h1 className="keep-with-next">{children}</h1>,
                    h2: ({children}) => <h2 className="keep-with-next">{children}</h2>,
                    h3: ({children}) => <h3 className="keep-with-next">{children}</h3>,
                    h4: ({children}) => <h4 className="keep-with-next">{children}</h4>,
                    ul: ({children}) => <ul className="section">{children}</ul>,
                    ol: ({children}) => <ol className="section">{children}</ol>,
                    blockquote: ({children}) => <blockquote className="section">{children}</blockquote>,
                    pre: ({children}) => <pre className="section">{children}</pre>
                  }}
                >
                  {botOutput}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-gray-400">{t('selectRequirementMessage')}</div>
            )}
          </div>
          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => handleDownload()}
              className="px-4 py-2 bg-gradient-to-r from-[#5c6bc0] via-[#3949ab] to-[#283593] text-white rounded hover:from-[#3949ab] hover:via-[#283593] hover:to-[#1a237e] flex items-center gap-2 ripple-button pretty-action-btn transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('downloadAsPdf')}
            </button>
            <button
              className="px-4 py-2 bg-gradient-to-r from-[#5c6bc0] via-[#3949ab] to-[#283593] text-white rounded hover:from-[#3949ab] hover:via-[#283593] hover:to-[#1a237e] ripple-button pretty-action-btn transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={handlePrint}
              disabled={!botOutput}
            >
              {t('printOutput')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Requirements;