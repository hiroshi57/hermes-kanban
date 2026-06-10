# Pattern: React コンポーネント

## 使用場面
新しい UI コンポーネントを作成するとき

## テンプレート

```tsx
import type { FC } from 'react';

// Props 型はコンポーネントファイル内に定義
interface Props {
  // 必須 prop
  title: string;
  // オプション prop（? を付ける）
  onClose?: () => void;
}

/**
 * ComponentName
 * - 1行の説明
 * - 主な責務を箇条書き
 */
const ComponentName: FC<Props> = ({ title, onClose }) => {
  return (
    <div className="...">
      <h2 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
        {title}
      </h2>
    </div>
  );
};

export default ComponentName;
```

## ルール
- `FC<Props>` 型を使う
- Tailwind CSS のみでスタイル
- イベントハンドラは `on*` プレフィックス
- アイコンは `lucide-react` から import
- ダークモード: `dark:` バリアントを必ず追加
