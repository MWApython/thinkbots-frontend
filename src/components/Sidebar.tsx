import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Api as ApiIcon,
  Chat as ChatIcon,
  Warning as WarningIcon,
  AccountTree as AccountTreeIcon,
  ListAlt as ListAltIcon,
  VerifiedUser as VerifiedUserIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  MenuBook as MenuBookIcon,
  Notifications as NotificationsIcon,
  Translate as TranslateIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Map as MapIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  DocumentText as DocumentTextIcon,
  Bell as BellIcon,
} from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import CriticalAiLogo from '../assets/criticalai.png';
import { useAuth } from '../contexts/AuthContext';
import { ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import CustomScrollbar from './CustomScrollbar';
import { getUsernameFromEmail } from '../utils/emailHelpers';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/index';
import { SvgIconProps } from '@mui/material';

type TranslationKey = keyof typeof translations.en;

interface NavigationItem {
  type?: 'section' | 'divider';
  name?: string;
  href?: string;
  icon?: React.ComponentType<SvgIconProps>;
  children?: NavigationItem[];
  current?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'home', href: '/', icon: HomeIcon, current: true },
  { type: 'divider' },
  { type: 'section', name: 'dashboard' },
  { name: 'apiDashboard', href: '/api-dashboard', icon: ApiIcon, current: false },
  { type: 'divider' },
  { type: 'section', name: 'chatbot' },
  { name: 'chatbot', href: '/soci-bot', icon: ChatIcon, current: false },
  { type: 'divider' },
  { type: 'section', name: 'riskManagement' },
  { name: 'riskProgram', href: '/risk-management', icon: SecurityIcon, current: false },
  { type: 'divider' },
  { type: 'section', name: 'compliance' },
  { name: 'requirementMap', href: '/requirement-map', icon: DescriptionIcon, current: false },
  { name: 'requirements', href: '/requirements', icon: ListAltIcon, current: false },
  { type: 'divider' },
  { type: 'section', name: 'assessment' },
  { name: 'nistGapAnalysis', href: '/nist-gap-analysis', icon: VerifiedUserIcon, current: false },
  { name: 'docAnonymity', href: '/doc-anonymity', icon: DescriptionIcon, current: false },
  { type: 'divider' },
  { type: 'section', name: 'assignments' },
  { name: 'teamCollab', href: '/team-collab', icon: GroupIcon, current: false },
  { type: 'divider' },
  { name: 'aboutThinkbots', href: '/credits', icon: MenuBookIcon, current: false },
];

// Add loading states for eligible menu items (these would typically come from context or props)
const menuLoading = {
  '/cirmp': false, // replace with actual loading state from CIRMP
  '/risk-assessment': false, // replace with actual loading state from Risk Management
  '/requirements': false, // replace with actual loading state from Requirements
  '/team-collab': false, // replace with actual loading state from Team Collab
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed: collapsedProp, onToggle }) => {
  const [collapsed, setCollapsed] = useState(collapsedProp ?? false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const { language, setLanguage, t } = useLanguage();
  const username = user ? getUsernameFromEmail(user.email) : '';

  const handleLanguageToggle = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
    document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  // Automatically expand All Hazards if on a hazards route
  useEffect(() => {
    if (location.pathname === '/all-hazards' || 
        location.pathname === '/cybersecurity' || 
        location.pathname === '/physical-security' || 
        location.pathname === '/personnel-security' || 
        location.pathname === '/supply-chain-security') {
      setOpenMenus((prev) => ({ ...prev, ['All Hazards']: true }));
    }
  }, [location.pathname]);

  const handleToggle = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside
      className={`bg-white border-r shadow-lg flex flex-col h-full sticky top-0 z-20 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ 
        minWidth: collapsed ? 64 : 256, 
        width: collapsed ? 64 : 256,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <div className="flex items-center h-16 border-b border-gray-200 px-2 relative">
        {collapsed ? (
          <img
            src={process.env.PUBLIC_URL + '/favicon.png'}
            alt="Thinkbots Favicon"
            className="h-8 w-8 mx-auto"
            style={{ height: 32, width: 32, objectFit: 'contain' }}
          />
        ) : (
          <img
            src={CriticalAiLogo}
            alt="Thinkbots Logo"
            className="object-contain transition-all duration-200 h-12 w-auto"
            style={{ height: 48, width: 'auto', objectFit: 'contain' }}
          />
        )}
      </div>
      <div className="flex items-center justify-between h-12 border-b border-gray-100 px-3">
        <span className={`text-sm font-medium text-gray-700 transition-all duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`} style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
          {language === 'ar' ? `مرحباً ${username}` : `Hi! ${username}`}
        </span>
        <div className="flex items-center gap-2">
          <Tooltip title={language === 'en' ? t('switchToArabic') : t('switchToEnglish')}>
            <IconButton 
              onClick={handleLanguageToggle} 
              size="small" 
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                color: 'white',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                },
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
              }}
            >
              <TranslateIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              onClick={() => setCollapsed((c) => !c)}
              className="bg-white shadow-md rounded-full p-1 hover:bg-gray-50"
              sx={{ border: '1px solid #e0e0e0' }}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div 
        className="flex-1 overflow-hidden" 
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <CustomScrollbar>
          <nav className="h-full py-4">
            <ul className="space-y-1">
              {navigation.map((item, idx) => {
                if (item.type === 'divider') {
                  return <li key={`divider-${idx}`} className="my-2 border-t border-gray-200" />;
                }
                
                if (item.type === 'section') {
                  return (
                    <li key={`section-${idx}`} className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {t(String(item.name))}
                      </span>
                    </li>
                  );
                }

                if (item.name && item.href && item.icon) {
                  const Icon = item.icon;
                  return (
                    <li key={String(item.name)} className="relative">
                      <Link
                        to={item.href}
                        className={`flex items-center ${collapsed ? 'justify-center' : ''} px-4 py-2 rounded text-gray-700 hover:bg-blue-50 transition-colors sidebar-menu-link ${location.pathname === item.href ? 'bg-blue-100 font-semibold text-blue-700' : ''}`}
                        style={{ minHeight: 48, position: 'relative' }}
                      >
                        <Icon sx={{ color: '#3b82f6', fontSize: 20, mr: collapsed ? 0 : 1.5 }} />
                        {!collapsed && (
                          <div className="flex flex-col w-full">
                            <div className="flex items-center">
                              <span className="mr-2">{t(String(item.name))}</span>
                            </div>
                          </div>
                        )}
                        {Object.prototype.hasOwnProperty.call(menuLoading, item.href) && menuLoading[item.href as keyof typeof menuLoading] && (
                          <CircularProgress size={18} thickness={5} sx={{ ml: 1, color: '#3949ab' }} />
                        )}
                      </Link>
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </nav>
        </CustomScrollbar>
      </div>
      <div className={`p-4 border-t text-xs text-gray-400 flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
        <span>&copy; {new Date().getFullYear()} Thinkbots</span>
        {user && !collapsed && (
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded font-semibold shadow hover:bg-red-700 transition-all duration-200 ripple-button sidebar-logout-ripple"
          >
            {t('logout')}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 