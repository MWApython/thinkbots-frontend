import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';

interface User extends FirebaseUser {
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async (firebaseUser: FirebaseUser) => {
    try {
      const idTokenResult = await firebaseUser.getIdTokenResult();
      // Check for admin claim in the token
      const isAdmin = Boolean(idTokenResult.claims.admin);
      console.log('Admin status:', isAdmin, 'Claims:', idTokenResult.claims);
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        localStorage.setItem('token', idToken);
        
        const adminStatus = await checkAdminStatus(firebaseUser);
        setIsAdmin(adminStatus);
        setUser({
          ...firebaseUser,
          isAdmin: adminStatus
        });
      } else {
        setUser(null);
        setToken(null);
        setIsAdmin(false);
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      setToken(idToken);
      localStorage.setItem('token', idToken);
      
      const adminStatus = await checkAdminStatus(userCredential.user);
      setIsAdmin(adminStatus);
      setUser({
        ...userCredential.user,
        isAdmin: adminStatus
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
      setIsAdmin(false);
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, resetPassword, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 