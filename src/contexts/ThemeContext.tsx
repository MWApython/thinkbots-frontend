import React, { createContext, useContext } from 'react';
const ThemeContext = createContext({});
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
export const useTheme = () => useContext(ThemeContext); 