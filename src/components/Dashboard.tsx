import React, { useEffect, useState } from 'react';
import { BellAlertIcon, NewspaperIcon, ShieldCheckIcon, ExclamationTriangleIcon, DocumentTextIcon, ArrowPathIcon, BuildingOfficeIcon, ArrowTopRightOnSquareIcon, CpuChipIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useRSSFeed } from '../hooks/useRSSFeed';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBell from './NotificationBell';
import { useLanguage } from '../contexts/LanguageContext';

// Quick action links
const quickActions = {
  legislativeUpdates: [
    { 
      name: 'NIST CSF 2.0 Framework Overview',
      description: 'Comprehensive overview of the NIST Cybersecurity Framework 2.0, including core functions and implementation guidance.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0'
    },
    { 
      name: 'NIST CSF 2.0 Quick Start Guide',
      description: 'Step-by-step guide for implementing the NIST Cybersecurity Framework 2.0 in your organization.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/quick-start-guides'
    },
    { 
      name: 'NIST CSF 2.0 Reference Tool',
      description: 'Interactive reference tool for exploring the NIST Cybersecurity Framework 2.0 categories and subcategories.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/reference-tool'
    }
  ],
  complianceRequirements: [
    { 
      name: 'NIST CSF 2.0 Core Functions and Implementation',
      description: 'Comprehensive guide covering the six core functions (GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER), implementation tiers, and incident response capabilities.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/core-functions'
    },
    { 
      name: 'NIST CSF 2.0 Implementation Tiers',
      description: 'Guidance on using the Framework Implementation Tiers to assess and improve your cybersecurity program.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/implementation-tiers'
    },
    { 
      name: 'NIST CSF 2.0 Profiles',
      description: 'Information on creating and using Framework Profiles to align cybersecurity activities with business requirements.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/profiles'
    }
  ],
  industryGuidelines: [
    { 
      name: 'NIST CSF 2.0 for Critical Infrastructure',
      description: 'Industry-specific guidance for implementing the Framework in critical infrastructure sectors.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/critical-infrastructure'
    },
    { 
      name: 'NIST CSF 2.0 for Small Businesses',
      description: 'Tailored guidance for small businesses implementing the Framework.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/small-business'
    },
    { 
      name: 'NIST CSF 2.0 for Supply Chain',
      description: 'Guidance on using the Framework to manage supply chain cybersecurity risks.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/supply-chain'
    }
  ],
  riskManagement: [
    { 
      name: 'NIST CSF 2.0 Risk Management and Assessment',
      description: 'Comprehensive guide covering risk assessment, management processes, metrics, measurement, recovery planning, and continuous improvement strategies.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/risk-management'
    }
  ],
  incidentResponse: [
    { 
      name: 'NIST CSF 2.0 Incident Response and Recovery',
      description: 'Comprehensive guide for developing and implementing incident response capabilities, recovery planning, and continuous improvement processes.',
      url: 'https://www.nist.gov/cyberframework/framework-2-0/incident-response'
    }
  ]
};

interface WarningCategory {
  [key: string]: string[];
}

interface SeverityInfo {
  color: string;
  label: string;
}

interface SeverityLevels {
  [key: string]: SeverityInfo;
}

interface Warning {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

interface AlertCategory {
  [key: string]: string[];
}

interface SeverityColor {
  [key: string]: string;
}

// Extract CVE ID from title
const getCVEId = (title: string): string => {
  const cveMatch = title.match(/CVE-\d{4}-\d+/);
  return cveMatch ? cveMatch[0] : '';
};

// Format description to remove HTML tags and clean up
const formatDescription = (description: string): string => {
  return description
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/<br\s*\/?>/gi, '\n') // Replace <br> with newlines
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

const Dashboard = () => {
  const { items: cyberAlerts, loading: cyberLoading, error: cyberError, refetch: refetchCyber } = useRSSFeed('https://cvefeed.io/rssfeed/latest.xml');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAlertType, setSelectedAlertType] = useState('all');
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const { language, t } = useLanguage();

  // Weather warning categories and their corresponding keywords
  const warningCategories: WarningCategory = {
    severe: ['severe', 'severe thunderstorm', 'severe weather'],
    flood: ['flood', 'flooding', 'river', 'flash flood'],
    fire: ['fire', 'bushfire', 'grass fire'],
    cyclone: ['cyclone', 'tropical cyclone'],
    marine: ['marine', 'coastal', 'wind warning'],
    heat: ['heat', 'extreme heat', 'heatwave'],
  };

  // Severity levels and their colors
  const severityLevels: SeverityLevels = {
    extreme: { color: 'red', label: 'Extreme' },
    severe: { color: 'orange', label: 'Severe' },
    moderate: { color: 'yellow', label: 'Moderate' },
    minor: { color: 'blue', label: 'Minor' },
  };

  // Update alert categories to match CVE severity levels
  const alertCategories: AlertCategory = {
    critical: ['9.0', '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '10.0'],
    high: ['7.0', '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8', '7.9', '8.0', '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7', '8.8', '8.9'],
    medium: ['4.0', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '5.0', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '6.0', '6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9'],
    low: ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.8', '2.9', '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9']
  };

  // Severity colors for alerts
  const severityColors: SeverityColor = {
    critical: '#DC2626', // Red
    high: '#EA580C',    // Orange
    medium: '#2563EB',  // Blue
    low: '#059669'      // Green
  };

  // Filter cyber alerts based on type
  const filteredCyberAlerts = cyberAlerts.filter((alert: Warning) => {
    if (selectedAlertType === 'all') return true;
    const severity = getAlertSeverity(alert);
    return severity === selectedAlertType;
  });

  // Get alert severity based on CVE score
  const getAlertSeverity = (alert: Warning): string => {
    const description = alert.description.toLowerCase();
    
    // Extract CVSS score from description
    const cvssMatch = description.match(/Severity:\s*(\d+\.\d+)\s*\|\s*([A-Z]+)/i);
    if (cvssMatch) {
      const score = parseFloat(cvssMatch[1]);
      const severity = cvssMatch[2].toLowerCase();
      
      // Map severity levels based on CVSS score
      if (score >= 9.0 || severity === 'critical') return 'critical';
      if (score >= 7.0 || severity === 'high') return 'high';
      if (score >= 4.0 || severity === 'medium') return 'medium';
      return 'low';
    }

    // Fallback to text-based severity if no CVSS score found
    if (description.includes('critical')) return 'critical';
    if (description.includes('high')) return 'high';
    if (description.includes('medium')) return 'medium';
    return 'low';
  };

  // Determine warning severity based on content
  const getWarningSeverity = (warning: Warning): string => {
    const title = warning.title.toLowerCase();
    if (title.includes('extreme') || title.includes('emergency')) return 'extreme';
    if (title.includes('severe') || title.includes('dangerous')) return 'severe';
    if (title.includes('moderate') || title.includes('significant')) return 'moderate';
    return 'minor';
  };

  const handleRefresh = async () => {
    try {
      setSelectedAlertType('all'); // Reset filter when refreshing
      await refetchCyber();
      setRefreshMessage('Refreshing alerts...');
      setTimeout(() => setRefreshMessage(null), 2000);
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      setRefreshMessage('Failed to refresh alerts. Please try again.');
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  // Add error details to the UI
  const renderErrorDetails = () => {
    if (!cyberError) return null;
    return (
      <div className="text-sm text-red-600 mt-2">
        <p>Error details: {cyberError}</p>
        <p className="text-xs mt-1">Please check your internet connection and try again.</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* All dashboard cards except Cyber Advisories - translated */}
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* AI Status Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg shadow-md p-6 border border-indigo-100 hover:shadow-lg transition-all duration-200 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <CpuChipIcon className="h-8 w-8 text-indigo-600 animate-pulse" />
                <div className="absolute -top-1 -right-1">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
                </div>
              </div>
              <div>
                  <h3 className="text-xl font-semibold text-indigo-900">{t('nistFramework')}</h3>
                  <p className="text-sm text-indigo-600">{t('nistImplementation')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <BoltIcon className="h-5 w-5 text-indigo-600 animate-bounce" />
                  <span className="text-sm font-medium text-indigo-700">Active</span>
                </div>
                <div className="h-4 w-px bg-indigo-200"></div>
                <div className="flex items-center space-x-1">
                  <SparklesIcon className="h-5 w-5 text-indigo-600 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-sm font-medium text-indigo-700">Learning</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 text-indigo-600 hover:text-indigo-700 focus:outline-none"
                  title="Refresh data"
                >
                  <ArrowPathIcon className="h-6 w-6" />
                </button>
                <NotificationBell />
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* NIST CSF 2.0 Resources Card */}
      <div className="bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 rounded-lg shadow-md p-6 border border-cyan-100 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BellAlertIcon className="h-6 w-6 text-cyan-600 mr-2" />
              <h3 className="text-xl font-semibold text-cyan-900">{t('nistResources')}</h3>
            </div>
            <span className="text-sm text-cyan-600">Updated with latest NIST guidance</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{t('legislativeUpdates')}</h3>
          </div>
          <ul className="space-y-3">
            {quickActions.legislativeUpdates.map((item, index) => (
              <li key={index}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 cursor-pointer block"
                >
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{t('complianceRequirements')}</h3>
          </div>
          <ul className="space-y-3">
            {quickActions.complianceRequirements.map((item, index) => (
              <li key={index}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 cursor-pointer block"
                >
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <BuildingOfficeIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{t('industryGuidelines')}</h3>
          </div>
          <ul className="space-y-3">
            {quickActions.industryGuidelines.map((item, index) => (
              <li key={index}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 cursor-pointer block"
                >
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{t('riskManagement')}</h3>
          </div>
          <ul className="space-y-3">
            {quickActions.riskManagement.map((item, index) => (
              <li key={index}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 cursor-pointer block"
                >
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <BellAlertIcon className="h-6 w-6 text-primary-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{t('incidentResponse')}</h3>
          </div>
          <ul className="space-y-3">
            {quickActions.incidentResponse.map((item, index) => (
              <li key={index}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 cursor-pointer block"
                >
                  <span className="font-medium">{item.name}</span>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
      {/* Cyber Advisories Card - always in English */}
      <div className="bg-white rounded-lg shadow p-6" style={{ direction: 'ltr', textAlign: 'left' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Cyber Advisories</h3>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refetchCyber}
              className="p-2 text-gray-600 hover:text-primary-600 focus:outline-none"
              title="Refresh cyber alerts"
            >
              <ArrowPathIcon className="h-6 w-6" />
            </button>
            <select
              value={selectedAlertType}
              onChange={(e) => setSelectedAlertType(e.target.value)}
              className="text-sm border rounded px-2 py-1"
              title="Select alert type"
              aria-label="Select alert type"
            >
              <option value="all">All Alerts</option>
              <option value="critical">Critical (9.0-10.0)</option>
              <option value="high">High (7.0-8.9)</option>
              <option value="medium">Medium (4.0-6.9)</option>
              <option value="low">Low (0.1-3.9)</option>
            </select>
          </div>
        </div>

        {refreshMessage && (
          <div className="mb-2 p-2 bg-blue-100 text-blue-800 rounded text-sm">{refreshMessage}</div>
        )}

        {cyberLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="ml-3 text-gray-600">Loading cyber alerts...</p>
          </div>
        ) : cyberError ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load cyber alerts. Please try again.</p>
            {renderErrorDetails()}
            <button
              onClick={refetchCyber}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        ) : filteredCyberAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredCyberAlerts.slice(0, 5).map((alert, index) => {
              const severity = getAlertSeverity(alert);
              const cvssMatch = alert.description.match(/Severity:\s*(\d+\.\d+)\s*\|\s*([A-Z]+)/i);
              const cvssScore = cvssMatch ? cvssMatch[1] : 'N/A';
              const cveId = getCVEId(alert.title);
              const formattedDescription = formatDescription(alert.description);
              
              return (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span 
                        className={`text-xs font-medium px-2 py-1 rounded-full`} 
                        style={{ 
                          backgroundColor: severityColors[severity],
                          color: severity === 'medium' ? '#FFFFFF' : '#FFFFFF',
                          border: severity === 'medium' ? '1px solid #1E40AF' : 'none'
                        }}
                      >
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </span>
                      {cvssScore !== 'N/A' && (
                        <span className="text-xs text-gray-600">
                          CVSS: {cvssScore}
                        </span>
                      )}
                      {cveId && (
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {cveId}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.pubDate).toLocaleDateString()}
                    </span>
                  </div>
                  <a href={alert.link} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 block font-medium">
                    {alert.title}
                  </a>
                  <p className="text-gray-600 text-sm mt-2">
                    {formattedDescription}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No cyber alerts for selected type</p>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <a
            href="https://cvefeed.io/rssfeed/latest.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            <DocumentTextIcon className="h-4 w-4 mr-1" />
            View all cyber advisories
          </a>
          <div className="flex space-x-4">
            {Object.entries(alertCategories).map(([level]) => (
              <span key={level} className="flex items-center text-xs">
                <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: severityColors[level] }}></span>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 