import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as api from './api/client';
interface AuthContextValue {
  authenticated: boolean;
  demo: boolean;
  userName: string;
  signIn: (name: string, password: string) => Promise<void>;
  enterDemo: () => void;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
function tokenUser() {
  try {
    const part = api.session()?.accessToken.split('.')[1];
    if (!part) return '';
    const bytes = Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
      c.charCodeAt(0),
    );
    return JSON.parse(new TextDecoder().decode(bytes)).unique_name || '';
  } catch {
    return '';
  }
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(!!api.session());
  const [demo, setDemo] = useState(false);
  const [userName, setUserName] = useState(tokenUser);
  useEffect(() => {
    const reset = () => {
      setAuthenticated(false);
      setUserName('');
    };
    window.addEventListener('admin1669:signout', reset);
    return () => window.removeEventListener('admin1669:signout', reset);
  }, []);
  return (
    <AuthContext.Provider
      value={{
        authenticated,
        demo,
        userName,
        signIn: async (name, password) => {
          await api.login(name, password);
          setUserName(name);
          setDemo(false);
          setAuthenticated(true);
        },
        enterDemo: () => {
          setDemo(true);
          setUserName('کاربر نمایشی');
          setAuthenticated(true);
        },
        signOut: async () => {
          const wasDemo = demo;
          setDemo(false);
          setAuthenticated(false);
          setUserName('');
          if (!wasDemo) await api.logout();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('Missing AuthProvider');
  return value;
}
