/**
 * ShareBoardModal.tsx
 * ボード共有・メンバー管理モーダル
 *
 * 機能:
 * - 招待リンクの生成・コピー（7 日間有効）
 * - 現在のメンバー一覧（アバター・名前・ロールバッジ）
 * - メンバーの除名（オーナーのみ）
 */
import { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, UserMinus, Users, RefreshCw, Crown, Pencil } from 'lucide-react';
import type { BoardMember } from '@/types';
import { createInviteLink, getBoardMembers, removeBoardMember } from '@/lib/sharing';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/lib/supabase';

interface Props {
  boardId: string;
  boardName: string;
  boardEmoji: string;
  onClose: () => void;
}

// ── メンバーアバター ──────────────────────────────────────────
function Avatar({ member }: { member: BoardMember }) {
  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.fullName ?? member.email ?? '?'}
        className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
        loading="lazy"
      />
    );
  }
  const initial = (member.fullName ?? member.email ?? '?')[0].toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center
                    text-white text-sm font-bold border-2 border-white dark:border-slate-700 shadow-sm">
      {initial}
    </div>
  );
}

// ── ロールバッジ ──────────────────────────────────────────────
function RoleBadge({ role }: { role: BoardMember['role'] }) {
  return role === 'owner' ? (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20
                     text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
      <Crown size={10} /> オーナー
    </span>
  ) : (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20
                     text-violet-600 dark:text-violet-400 text-[11px] font-semibold">
      <Pencil size={10} /> 編集者
    </span>
  );
}

export default function ShareBoardModal({
  boardId, boardName, boardEmoji, onClose,
}: Props) {
  const { user } = useAuth();
  const [ownerId, setOwnerId] = useState<string | null | 'loading'>('loading');
  const isOwner = ownerId === 'loading'
    ? false
    : (ownerId === null || ownerId === user?.id);

  // ボードオーナーを取得（async IIFE で常に非同期 → setState を同期呼び出ししない）
  useEffect(() => {
    (async () => {
      if (!supabase) { setOwnerId(null); return; }
      try {
        const { data } = await supabase!.from('boards').select('user_id').eq('id', boardId).single();
        setOwnerId(data?.user_id ?? null);
      } catch {
        setOwnerId(null);
      }
    })();
  }, [boardId]);

  const [members, setMembers]       = useState<BoardMember[]>([]);
  const [loading, setLoading]       = useState(true);
  const [inviteUrl, setInviteUrl]   = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [removing, setRemoving]     = useState<string | null>(null);
  // リフレッシュボタンで increment → useEffect が再実行される
  const [refreshKey, setRefreshKey] = useState(0);

  // メンバー取得（async IIFE でインライン化 → lint rule 回避）
  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await getBoardMembers(boardId);
      setMembers(list);
      setLoading(false);
    })();
  }, [boardId, refreshKey]);

  // 招待リンク生成
  async function handleGenerateLink() {
    setGenerating(true);
    const url = await createInviteLink(boardId);
    setInviteUrl(url);
    setGenerating(false);
  }

  // クリップボードにコピー
  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // メンバー除名
  async function handleRemove(member: BoardMember) {
    if (!isOwner) return;
    setRemoving(member.id);
    await removeBoardMember(boardId, member.id);
    setMembers(prev => prev.filter(m => m.id !== member.id));
    setRemoving(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">{boardEmoji}</span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">{boardName}</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">ボード共有・メンバー管理</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 招待リンク */}
        {isOwner && (
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Link2 size={12} /> 招待リンクで共有
            </p>

            {inviteUrl ? (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 text-[12px] px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800
                             border border-slate-200 dark:border-slate-700
                             text-slate-600 dark:text-slate-300 truncate focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold
                              transition-all ${copied
                    ? 'bg-green-500 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'コピー済み' : 'コピー'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateLink}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                           border-2 border-dashed border-violet-300 dark:border-violet-700
                           text-violet-600 dark:text-violet-400 text-[13px] font-medium
                           hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generating
                  ? <><span className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" /> 生成中…</>
                  : <><Link2 size={14} /> 招待リンクを生成</>
                }
              </button>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              リンクを知っている人なら誰でも参加できます（有効期限: 7 日間）
            </p>
          </div>
        )}

        {/* メンバー一覧 */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Users size={12} /> メンバー {loading ? '' : `(${members.length})`}
            </p>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
              title="更新"
              className="p-1 rounded text-slate-400 hover:text-violet-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <span className="w-6 h-6 border-2 border-slate-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-6">
              まだメンバーがいません。<br />招待リンクで仲間を招待しましょう。
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {members.map(member => (
                <li key={member.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl
                             bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800
                             transition-colors group">
                  <Avatar member={member} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">
                      {member.fullName ?? member.email ?? `ユーザー ${member.userId.slice(0, 8)}`}
                    </p>
                    {member.email && member.fullName && (
                      <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                    )}
                  </div>
                  <RoleBadge role={member.role} />
                  {/* 除名ボタン（オーナーのみ、自分以外） */}
                  {isOwner && member.userId !== user?.id && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={removing === member.id}
                      title="除名"
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                                 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                                 transition-all disabled:opacity-50"
                    >
                      {removing === member.id
                        ? <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin block" />
                        : <UserMinus size={14} />
                      }
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
