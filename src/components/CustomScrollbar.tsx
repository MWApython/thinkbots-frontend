import React, { useRef, useEffect, useState } from 'react';

interface CustomScrollbarProps {
  children: React.ReactNode;
}

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbHeight, setThumbHeight] = useState(100);
  const [thumbTop, setThumbTop] = useState(0);

  const updateThumb = () => {
    if (!contentRef.current) return;
    const content = contentRef.current;
    const ratio = content.clientHeight / content.scrollHeight;
    const newThumbHeight = Math.max(ratio * content.clientHeight * 0.92, 60);
    setThumbHeight(newThumbHeight);

    const maxScroll = content.scrollHeight - content.clientHeight;
    const scrollRatio = Math.min(content.scrollTop / maxScroll, 1);
    const trackHeight = content.clientHeight;
    const newThumbTop = Math.min(scrollRatio * (trackHeight - newThumbHeight), trackHeight - newThumbHeight);
    setThumbTop(newThumbTop);
  };

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    updateThumb();
    content.addEventListener('scroll', updateThumb);
    window.addEventListener('resize', updateThumb);

    // Use ResizeObserver for dynamic content
    let resizeObserver: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        updateThumb();
      });
      resizeObserver.observe(content);
    }

    return () => {
      content.removeEventListener('scroll', updateThumb);
      window.removeEventListener('resize', updateThumb);
      if (resizeObserver) resizeObserver.disconnect();
    };
    // eslint-disable-next-line
  }, [children]);

  return (
    <div className="custom-scrollbar-container" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <div 
        className="custom-scrollbar-track" 
        style={{ 
          position: 'absolute',
          top: 0,
          right: 0,
          width: '24px',
          height: '100%',
          background: 'transparent'
        }}
      >
        <div 
          ref={thumbRef}
          className="custom-scrollbar-thumb"
          style={{ 
            position: 'absolute',
            right: 0,
            width: '24px',
            height: `${thumbHeight}px`,
            top: `${thumbTop}px`,
            background: '#5c6bc0',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-200 text-xs font-semibold tracking-wider transform -rotate-90 whitespace-nowrap">
              NIST CSF 2.0 FRAMEWORK
            </span>
          </div>
        </div>
      </div>
      <div 
        ref={contentRef}
        className="custom-scrollbar-content"
        style={{ 
          height: '100%',
          overflowY: 'auto',
          paddingRight: '24px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>
      <style>{`
        .custom-scrollbar-content::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default CustomScrollbar; 