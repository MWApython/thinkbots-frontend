import React, { createContext, useContext, useState } from 'react';

interface ChatbotContextType {
  prefill: string;
  setPrefill: (val: string) => void;
}

const ChatbotContext = createContext<ChatbotContextType>({ prefill: '', setPrefill: () => {} });

export const useChatbot = () => useContext(ChatbotContext);

export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefill, setPrefill] = useState('');
  return (
    <ChatbotContext.Provider value={{ prefill, setPrefill }}>
      {children}
    </ChatbotContext.Provider>
  );
}; 