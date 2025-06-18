import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 

// Ripple effect for all buttons with the 'ripple-button' class
if (typeof window !== 'undefined') {
  document.addEventListener('click', function (e) {
    const el = e.target as Element | null;
    if (!el) return;
    const target = el.closest('.ripple-button');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = (e instanceof MouseEvent ? (e.clientX - rect.left) : '0') + 'px';
    ripple.style.top = (e instanceof MouseEvent ? (e.clientY - rect.top) : '0') + 'px';
    ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';

    target.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  });
} 