import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, ArrowPathIcon, ClockIcon, TrashIcon, ShieldCheckIcon, LockClosedIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { OPENAI_API_KEY, OPENAI_API_URL } from '../config/api';
import ReactMarkdown from 'react-markdown';
import '../styles/prose-custom.css';
import '../styles/chatbot-animations.css';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { useChatbot } from '../context/ChatbotContext';
import SociBotLogo from '../assets/soci_bot_logo.png';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { TextField } from '@mui/material';
import { getUsernameFromEmail } from '../utils/emailHelpers';
import { apiGet, apiPost } from '../utils/api';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Send as SendIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import API_CONFIG from '../config/api';

GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
}

const SOCI_ACT_URL = 'https://www.legislation.gov.au/Series/C2018A00029';

const SOCIBot: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const { language, t } = useLanguage();

  const welcomeMessage: Message = {
    role: 'assistant' as const,
    content: 'Hello! I am Thinkbot, your AI Assistant for NIST CSF 2.0. I can help you understand the NIST Cybersecurity Framework 2.0, its requirements, and implementation guidance. How can I assist you today?',
    timestamp: new Date(),
  };

  // System message with PDF context
  const SYSTEM_MESSAGE = `You are Thinkbot, an AI Assistant specialized in NIST CSF 2.0. Your role is to help users understand and implement the NIST Cybersecurity Framework 2.0. Provide clear, accurate, and practical guidance while maintaining a professional and helpful tone.

IMPORTANT: You must ONLY answer questions related to NIST CSF 2.0, cybersecurity, and risk management. If a question is off-topic, politely refuse to answer and explain that you are designed to assist with NIST CSF 2.0 and cybersecurity matters.

Key areas of expertise:
1. NIST CSF 2.0 Core Functions (GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER)
2. Implementation guidance and best practices
3. Risk management strategies
4. Framework customization for different organizations
5. Integration with other security frameworks
6. Performance measurement and improvement

Always:
- Reference specific NIST CSF 2.0 categories and subcategories when relevant
- Provide practical, actionable advice
- Explain technical concepts clearly
- Emphasize the importance of risk-based decision making
- Suggest relevant NIST resources for further reading

Remember to maintain a professional and helpful tone while providing guidance.

IMPORTANT LANGUAGE INSTRUCTION: You must respond in the same language as the user's input. If the user writes in English, respond in English. If the user writes in Arabic, respond in Arabic.`;

  const PDF_URL = '/soci-act.pdf';

  async function extractTextFromPDF(url: string): Promise<string> {
    const loadingTask = getDocument(url);
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
  }

  function findRelevantSection(pdfText: string, query: string): string {
    // Split by paragraphs
    const sections = pdfText.split('\n\n');
    let bestSection = '';
    let maxMatches = 0;
    for (const section of sections) {
      const matches = query
        .toLowerCase()
        .split(' ')
        .filter(word => section.toLowerCase().includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSection = section;
      }
    }
    return bestSection;
  }

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/chat-history`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Only set messages and chat history if there is data
          if (data && data.length > 0) {
            setMessages([
              welcomeMessage,
              ...data.map((msg: any) => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.message,
                timestamp: new Date(msg.timestamp),
              }))
            ]);
            // Populate chatHistory with user queries
            setChatHistory(
              data
                .filter((msg: any) => msg.sender === 'user')
                .map((msg: any) => ({
                  id: msg.id || uuidv4(),
                  query: msg.message,
                  timestamp: new Date(msg.timestamp),
                }))
            );
          } else {
            // If no data, set only welcome message
            setMessages([welcomeMessage]);
            setChatHistory([]);
          }
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    };
    fetchHistory();
  }, [token]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load PDF on mount
  useEffect(() => {
    const loadPDF = async () => {
      setPdfLoading(true);
      const text = await extractTextFromPDF(PDF_URL);
      setPdfText(text);
      setPdfLoading(false);
    };
    loadPDF();
  }, []);

  // Add useEffect to focus input when messages change
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isLoading]);

  const formatMessage = (content: string) => {
    // Remove trailing ** from headings
    content = content.replace(/(#{1,6} .+?)\*\*$/gm, '$1');
    // Add double line breaks after headings
    content = content.replace(/(#{1,6}\s.*)\n/g, '$1\n\n');
    // Add double line breaks after horizontal rules
    content = content.replace(/---\n/g, '---\n\n');
    // Add double line breaks after lists (lines starting with - )
    content = content.replace(/((?:^- .*(?:\n|$))+)/gm, (m) => m.endsWith('\n\n') ? m : m + '\n');
    // Add double line breaks between paragraphs (but not inside lists)
    content = content.replace(/([^\n])\n([^\n-])/g, '$1\n\n$2');
    // Format section references
    content = content.replace(/Section (\d+[A-Z]?)/g, '**Section $1**');
    content = content.replace(/Part (\d+[A-Z]?)/g, '**Part $1**');
    // Format penalties and amounts
    content = content.replace(/\$(\d{1,3}(?:,\d{3})*)/g, '**$$$1**');
    // Clean up any remaining excessive formatting
    content = content.replace(/\*\*\*/g, '**');
    content = content.replace(/###\s*\*\*/g, '### ');
    // Ensure consistent spacing
    content = content.replace(/\n{3,}/g, '\n\n');
    return content.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (pdfLoading) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'The NIST CSF 2.0 documentation is still loading. Please wait a moment and try again.',
        timestamp: new Date()
      }]);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatHistory(prev => [...prev, { id: uuidv4(), query: input, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Find relevant section from PDF
      let context = '';
      if (pdfText) {
        context = findRelevantSection(pdfText, input);
        if (context.length > 1000) {
          context = context.slice(0, 1000) + '...';
        }
      }
      // Only send the last 5 messages
      const recentMessages = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      const systemMessage = language === 'ar'
        ? `أنت ثينكبوت، مساعد ذكاء اصطناعي متخصص في NIST CSF 2.0. يجب أن ترد على جميع الأسئلة باللغة العربية وتقدم إرشادات واضحة وعملية حول إطار العمل.

مهم: يجب أن ترد فقط على الأسئلة المتعلقة بـ NIST CSF 2.0 والأمن السيبراني وإدارة المخاطر. إذا كان السؤال خارج الموضوع، رفض الإجابة بأدب واشرح أنك مصمم للمساعدة في أمور NIST CSF 2.0 والأمن السيبراني.

مجالات الخبرة الرئيسية:
1. وظائف NIST CSF 2.0 الأساسية (GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER)
2. إرشادات التنفيذ وأفضل الممارسات
3. استراتيجيات إدارة المخاطر
4. تخصيص الإطار لمختلف المؤسسات
5. التكامل مع أطر الأمان الأخرى
6. قياس الأداء والتحسين

دائمًا:
- أشر إلى فئات وفئات فرعية محددة من NIST CSF 2.0 عند الاقتضاء
- قدم نصائح عملية وقابلة للتنفيذ
- اشرح المفاهيم التقنية بوضوح
- أكد على أهمية اتخاذ القرارات القائمة على المخاطر
- اقترح موارد NIST ذات الصلة لمزيد من القراءة

تذكر الحفاظ على نبرة مهنية ومفيدة أثناء تقديم التوجيه.`
        : `You are Thinkbot, an AI Assistant specialized in NIST CSF 2.0. Your role is to help users understand and implement the NIST Cybersecurity Framework 2.0. Provide clear, accurate, and practical guidance while maintaining a professional and helpful tone.

IMPORTANT: You must ONLY answer questions related to NIST CSF 2.0, cybersecurity, and risk management. If a question is off-topic, politely refuse to answer and explain that you are designed to assist with NIST CSF 2.0 and cybersecurity matters.

Key areas of expertise:
1. NIST CSF 2.0 Core Functions (GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER)
2. Implementation guidance and best practices
3. Risk management strategies
4. Framework customization for different organizations
5. Integration with other security frameworks
6. Performance measurement and improvement

Always:
- Reference specific NIST CSF 2.0 categories and subcategories when relevant
- Provide practical, actionable advice
- Explain technical concepts clearly
- Emphasize the importance of risk-based decision making
- Suggest relevant NIST resources for further reading

Remember to maintain a professional and helpful tone while providing guidance.

IMPORTANT LANGUAGE INSTRUCTION: You must respond in the same language as the user's input. If the user writes in English, respond in English. If the user writes in Arabic, respond in Arabic.`;
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemMessage },
            ...(context ? [{ role: 'system', content: `Relevant context from the NIST CSF 2.0: ${context}` }] : []),
            ...recentMessages,
            { role: 'user', content: input }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const formattedContent = formatMessage(data.choices[0].message.content);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: formattedContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      setIsLoading(false);

      // Save to chat history
      if (token) {
        try {
          await fetch(`${API_CONFIG.BASE_URL}/api/chat-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              sender: 'user',
              message: input,
              timestamp: new Date().toISOString()
            })
          });
          
          await fetch(`${API_CONFIG.BASE_URL}/api/chat-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              sender: 'assistant',
              message: formattedContent,
              timestamp: new Date().toISOString()
            })
          });
        } catch (err) {
          console.error('Error saving chat history:', err);
        }
      }
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `I apologize, but I encountered an error while processing your request. Please try again. (Error: ${error instanceof Error ? error.message : String(error)})`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const loadChatHistory = (query: string) => {
    setInput(query);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearChatHistory = async () => {
    if (!token) return;
    
    try {
      // Clear chat history from backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/chat-history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }

      // Clear local state
      setChatHistory([]);
      setMessages([welcomeMessage]);

      // Force a re-fetch of chat history to ensure it's cleared
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/chat-history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          console.log('Chat history successfully cleared');
        }
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: language === 'ar' ? false : true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={SociBotLogo} 
              alt="Thinkbot Logo" 
              className={`h-16 w-16 bot-avatar ${isTyping ? 'typing' : ''} border-2 border-primary-500 rounded-full`} 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/64';
              }}
            />
            <div className="ml-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('thinkbotTitle')}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('thinkbotSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-[#283593] to-[#3949ab] text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="prose prose-sm max-w-none 
                  prose-headings:font-semibold 
                  prose-headings:text-blue-700 
                  prose-headings:mb-4
                  prose-p:my-4
                  prose-ul:my-4
                  prose-li:my-2
                  prose-strong:text-blue-900
                  prose-h2:border-b
                  prose-h2:pb-2
                  prose-h3:mt-6
                  prose-h3:mb-3
                  prose-hr:my-6">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-300">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('thinkbotPlaceholder')}
              className="flex-1 rounded-lg border-2 border-[#5c6bc0] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#5c6bc0] dark:bg-gray-800 dark:text-white"
              disabled={isLoading || pdfLoading}
              ref={inputRef}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <button
              type="submit"
              disabled={isLoading || pdfLoading || !input.trim()}
              className={`px-4 py-2 rounded-lg ${
                isLoading || pdfLoading || !input.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#5c6bc0] hover:bg-[#3f51b5]'
              } text-white transition-colors duration-200`}
              title={t('thinkbotSend')}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('thinkbotHelper')}
          </p>
          <p className="text-xs text-red-500 mt-1">
            <strong>{t('thinkbotDisclaimer')}</strong>
          </p>
          {pdfLoading && (
            <p className="text-sm text-gray-500 mt-2">
              {t('thinkbotLoading')}
            </p>
          )}
        </form>
      </div>

      {/* Chat History Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l dark:border-gray-700 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('thinkbotChatHistory')}</h3>
          <button
            onClick={clearChatHistory}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={t('thinkbotClearHistory')}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {chatHistory.map((item) => (
            <button
              key={item.id}
              onClick={() => loadChatHistory(item.query)}
              className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {item.query}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SOCIBot;
