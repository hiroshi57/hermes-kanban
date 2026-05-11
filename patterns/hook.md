# Pattern: カスタムフック

## 使用場面
コンポーネントから状態ロジックを分離するとき

## テンプレート

```ts
import { useState, useCallback, useEffect } from 'react';

/**
 * useHookName
 * - 1行の説明
 */
export function useHookName(param: string) {
  const [state, setState] = useState<string>('');

  // 副作用
  useEffect(() => {
    // 処理
    return () => {
      // クリーンアップ
    };
  }, [param]);

  // メモ化されたハンドラ
  const handleAction = useCallback(() => {
    setState(prev => prev + param);
  }, [param]);

  return { state, handleAction } as const;
}
```

## ルール
- フック名は `use` プレフィックス
- 戻り値は `as const` でタプルまたはオブジェクト
- 副作用はクリーンアップ関数を返す
- 依存配列は省略しない
