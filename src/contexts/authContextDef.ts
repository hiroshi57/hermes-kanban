/**
 * authContextDef.ts
 * AuthContext の型定義と createContext 宣言
 * （react-refresh/only-export-components 対応のため AuthContext.tsx から分離）
 */
import { createContext } from 'react';

export interface AuthContextValue {
  user: import('@/lib/auth').User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
