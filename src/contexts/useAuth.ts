/**
 * useAuth.ts
 * AuthContext を消費するフック
 */
import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './authContextDef';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth は <AuthProvider> の内側で呼んでください');
  return ctx;
}
