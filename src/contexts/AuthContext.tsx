/**
 * AuthContext.tsx
 * AuthProvider コンポーネントのみをエクスポート
 * （型 / Context オブジェクトは authContextDef.ts に分離）
 */
import { useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/lib/auth';
import {
  onAuthStateChange,
  signInWithGoogle as _signIn,
  signOut as _signOut,
  isSupabaseConfigured,
} from '@/lib/auth';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsubscribe = onAuthStateChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle: _signIn,
      signOut: _signOut,
      isConfigured: isSupabaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
