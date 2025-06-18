import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { CircularProgress } from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import CriticalAiLogo from '../assets/criticalai.png';
import bgImage from '../assets/bg.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');

  // Add ripple effect function
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;
    ripple.className = 'ripple';
    
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(ripple);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={CriticalAiLogo} 
            alt="Critical AI Logo" 
            className="mx-auto mb-4 h-16 w-auto"
          />
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {resetEmailSent && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-green-700">
              Password reset email sent! Please check your inbox and follow the instructions to reset your password.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
            >
              {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
            </button>
          </div>

          {/* Slider */}
          <div className="w-full">
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="0"
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value === 100) {
                  setIsVerified(true);
                }
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: isVerified 
                  ? 'linear-gradient(to right, #10B981, #059669, #047857)' 
                  : '#E5E7EB',
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '8px',
                borderRadius: '9999px',
                outline: 'none',
              }}
            />
            <div className="text-center mt-2 text-sm text-gray-600">
              {isVerified ? '✓ Verified' : '← Slide to verify →'}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isVerified}
              onClick={createRipple}
              className={`w-full py-2 px-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:via-cyan-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ripple-button disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" />
                  <span>{language === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...'}</span>
                </>
              ) : (
                <>
                  <LoginIcon className="h-5 w-5" />
                  <span>{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
                </>
              )}
            </button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {language === 'ar' ? 'بتسجيل الدخول، فإنك تقر وتوافق على' : 'By logging in, you acknowledge and agree to our'}{' '}
            <a 
              href="https://www.thinkbots.ai/disclaimer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {language === 'ar' ? 'الشروط والأحكام' : 'Terms and Conditions'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 