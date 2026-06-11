import type { AppState } from '@/types';

// ─── 共通タグ定義 ──────────────────────────────────────────────
const T = {
  // ユニット
  u1:     { id: 'u1',     label: '第1U',     color: '#6366f1' },
  u2:     { id: 'u2',     label: '第2U',     color: '#f97316' },
  u3:     { id: 'u3',     label: '第3U',     color: '#06b6d4' },
  assoc:  { id: 'assoc',  label: 'アソシ',   color: '#a78bfa' },
  reS:    { id: 'reS',    label: '不動産S',  color: '#10b981' },
  cf:     { id: 'cf',     label: 'CF金融',   color: '#0ea5e9' },
  // NPSランク
  rs:     { id: 'rs',     label: 'ランクS',  color: '#f59e0b' },
  ra:     { id: 'ra',     label: 'ランクA',  color: '#6366f1' },
  rb:     { id: 'rb',     label: 'ランクB',  color: '#3b82f6' },
  rc:     { id: 'rc',     label: 'ランクC',  color: '#64748b' },
  rd:     { id: 'rd',     label: 'ランクD',  color: '#94a3b8' },
  re:     { id: 're',     label: 'ランクE',  color: '#cbd5e1' },
  // 業種
  fin:    { id: 'fin',    label: '金融',     color: '#0ea5e9' },
  ins:    { id: 'ins',    label: '保険',     color: '#38bdf8' },
  re2:    { id: 're2',    label: '不動産',   color: '#10b981' },
  car:    { id: 'car',    label: '自動車',   color: '#f59e0b' },
  med:    { id: 'med',    label: '医療',     color: '#ef4444' },
  edu:    { id: 'edu',    label: '教育',     color: '#8b5cf6' },
  hr:     { id: 'hr',     label: '人材',     color: '#ec4899' },
  food:   { id: 'food',   label: '食品',     color: '#84cc16' },
  travel: { id: 'travel', label: '旅行',     color: '#f97316' },
  it:     { id: 'it',     label: 'IT/SaaS',  color: '#6366f1' },
  retail: { id: 'retail', label: '小売',     color: '#a78bfa' },
  btob:   { id: 'btob',   label: 'BtoB',    color: '#475569' },
  // 施策
  ad:     { id: 'ad',     label: '広告',     color: '#6366f1' },
  seo:    { id: 'seo',    label: 'SEO',      color: '#f59e0b' },
  cro:    { id: 'cro',    label: 'CRO',      color: '#ef4444' },
  ma:     { id: 'ma',     label: 'DX/MA',    color: '#8b5cf6' },
  llmo:   { id: 'llmo',   label: 'LLMO',     color: '#06b6d4' },
  res:    { id: 'res',    label: '調査',     color: '#22d3ee' },
  award:  { id: 'award',  label: '受賞',     color: '#f59e0b' },
  pr:     { id: 'pr',     label: 'SNS/PR',   color: '#a78bfa' },
  web:    { id: 'web',    label: 'Web制作',  color: '#10b981' },
  // KB タスク
  kbu:    { id: 'kbu',    label: 'KB更新',   color: '#6366f1' },
  pdf:    { id: 'pdf',    label: 'PDF処理',  color: '#f59e0b' },
  drive:  { id: 'drive',  label: 'Drive整備', color: '#ef4444' },
  cmd:    { id: 'cmd',    label: 'コマンド', color: '#8b5cf6' },
  play:   { id: 'play',   label: 'PB整備',  color: '#10b981' },
  // ステータス
  active: { id: 'active', label: '課金中',   color: '#ef4444' },
  dnf:    { id: 'dnf',    label: 'Drive未整備', color: '#6b7280' },
} as const;

// card ID 衝突を避けるため接頭辞付きヘルパー
const c = (id: string, title: string, description: string, priority: 'high' | 'mid' | 'low', assignee: string, tags: (keyof typeof T)[], checklist: {text: string; done: boolean}[] = []) => ({
  id,
  title,
  description,
  priority: priority === 'high' ? '高' : priority === 'mid' ? '中' : '低',
  assignee,
  dueDate: null as string | null,
  tags: tags.map(k => T[k]),
  createdAt: '2026-06-11',
  checklist: checklist.map((item, i) => ({ id: `${id}-cl${i}`, ...item, done: item.done })),
  comments: [],
  archived: false,
} as const);

const BOARD_ID = 'board-1';

export const initialAppState: AppState = {
  activeBoardId: BOARD_ID,
  boardOrder: [BOARD_ID, 'b-u1s', 'b-u1abc', 'b-u2', 'b-u3', 'b-reS-cf', 'b-cases', 'b-services', 'b-playbook', 'b-tasks'],
  activityLog: [],
  boards: {

    // ── 0. メインプロジェクト（デモ用） ─────────────────────────
    [BOARD_ID]: {
      id: BOARD_ID, name: 'メインプロジェクト', emoji: '🚀', createdAt: '2026-05-11',
      cards: {
        'card-1': { id: 'card-1', title: 'ログイン画面のUI改善', description: 'レスポンシブ対応とアクセシビリティの向上', priority: '高', assignee: '田中 太郎', dueDate: '2026-05-15', tags: [{ id: 't1', label: 'フロントエンド', color: '#6366f1' }], createdAt: '2026-05-01', checklist: [], comments: [], archived: false },
        'card-2': { id: 'card-2', title: 'APIレート制限の実装', description: '不正アクセス対策としてレート制限を追加する', priority: '高', assignee: '佐藤 花子', dueDate: '2026-05-20', tags: [{ id: 't2', label: 'バックエンド', color: '#10b981' }], createdAt: '2026-05-02', checklist: [], comments: [], archived: false },
        'card-3': { id: 'card-3', title: 'ダッシュボードのパフォーマンス最適化', description: 'データ取得の遅延を改善し、初期表示を高速化する', priority: '中', assignee: '鈴木 一郎', dueDate: '2026-05-25', tags: [{ id: 't3', label: 'パフォーマンス', color: '#f59e0b' }], createdAt: '2026-05-03', checklist: [{ id: 'cl-1', text: 'React.memo を適用', done: true }, { id: 'cl-2', text: 'Bundle サイズを計測', done: false }, { id: 'cl-3', text: 'Lazy load を設定', done: false }], comments: [], archived: false },
        'card-4': { id: 'card-4', title: 'ユーザー権限管理機能', description: 'ロールベースのアクセス制御を実装する', priority: '高', assignee: '山田 美咲', dueDate: '2026-05-18', tags: [{ id: 't2', label: 'バックエンド', color: '#10b981' }, { id: 't4', label: 'セキュリティ', color: '#ef4444' }], createdAt: '2026-05-04', checklist: [], comments: [], archived: false },
        'card-5': { id: 'card-5', title: 'テスト自動化の整備', description: 'CI/CDパイプラインにE2Eテストを追加する', priority: '中', assignee: '伊藤 健二', dueDate: '2026-06-01', tags: [{ id: 't5', label: 'テスト', color: '#8b5cf6' }], createdAt: '2026-05-05', checklist: [], comments: [], archived: false },
        'card-6': { id: 'card-6', title: 'ドキュメントの更新', description: 'APIドキュメントとReadmeを最新状態に更新する', priority: '低', assignee: '中村 愛', dueDate: '2026-05-30', tags: [{ id: 't6', label: 'ドキュメント', color: '#64748b' }], createdAt: '2026-05-06', checklist: [], comments: [], archived: false },
      },
      columns: {
        'col-todo':       { id: 'col-todo',       title: '未着手',    color: '#6b7280', cardIds: ['card-1','card-2'] },
        'col-inprogress': { id: 'col-inprogress', title: '進行中',    color: '#3b82f6', cardIds: ['card-3','card-4'] },
        'col-review':     { id: 'col-review',     title: 'レビュー中', color: '#f59e0b', cardIds: ['card-5'] },
        'col-done':       { id: 'col-done',       title: '完了',      color: '#10b981', cardIds: ['card-6'] },
      },
      columnOrder: ['col-todo','col-inprogress','col-review','col-done'],
    },

    // ── 1. 第1ユニット ランクS ──────────────────────────────────
    'b-u1s': {
      id: 'b-u1s', name: '第1U ランクS', emoji: '⭐', createdAt: '2026-06-11',
      cards: {
        // ─ 衣笠T
        'u1s-01': c('u1s-01','相川メディカルマネージメント','直：役員 / 担当：衣笠・大植・中山・西島','high','衣笠 志保',['u1','rs','med']),
        'u1s-02': c('u1s-02','ソニー損害保険','直：役員 / 担当：衣笠','high','衣笠 志保',['u1','rs','ins']),
        // ─ 吉田T
        'u1s-03': c('u1s-03','Amazon','代理：電通デジタル / 担当：吉田・新宮','high','吉田',['u1','rs']),
        'u1s-04': c('u1s-04','LIFULL','直：役員 / 担当：吉田・岩本公典','high','吉田',['u1','rs','re2']),
        'u1s-05': c('u1s-05','積水ハウス','直：紹介 / 担当：吉田','high','吉田',['u1','rs','re2']),
        // ─ 西村T
        'u1s-06': c('u1s-06','アニコム損害保険','直：顧問 / 担当：渋谷','high','渋谷',['u1','rs','ins']),
        'u1s-07': c('u1s-07','ライフフォワード','直：クライアント紹介 / 担当：渋谷','high','渋谷',['u1','rs']),
        'u1s-08': c('u1s-08','三菱地所ハウスネット','代理：ソナー / 担当：宮嶋・新宮・木村達輝','high','宮嶋 裕太',['u1','rs','re2']),
        'u1s-09': c('u1s-09','静岡銀行','代理：電通東日本 / 担当：宮嶋・阿部志帆','high','宮嶋 裕太',['u1','rs','fin']),
        // ─ 栗原T
        'u1s-10': c('u1s-10','ホワイトエッセンス','直：Inquiry / 担当：栗原','high','栗原',['u1','rs']),
        'u1s-11': c('u1s-11','パーソルテンプスタッフ','直：紹介 / 担当：栗原・中山佳祐','high','栗原',['u1','rs','hr']),
        'u1s-12': c('u1s-12','第一三共ヘルスケアダイレクト','直：紹介 / 担当：栗原','high','栗原',['u1','rs','med']),
        // ─ 新宮T
        'u1s-13': c('u1s-13','リロバケーションズ','直：Sharing Innovations / 担当：新宮','high','新宮',['u1','rs']),
        // ─ 大植T
        'u1s-14': c('u1s-14','IBJ','直：紹介 / 担当：大植・西島','high','大植 直人',['u1','rs']),
        'u1s-15': c('u1s-15','セコム','直：ビービット / 担当：大植','high','大植 直人',['u1','rs']),
        // ─ 三木T
        'u1s-16': c('u1s-16','ジャストシステム','直：掘り起こし / 担当：三木','high','三木',['u1','rs','it']),
        // ─ 野口T
        'u1s-17': c('u1s-17','積水ハウス不動産HD','直：不動産S / 担当：野口','high','野口 太豪',['u1','rs','re2']),
      },
      columns: {
        'u1s-衣笠': { id: 'u1s-衣笠', title: '衣笠T', color: '#6366f1', cardIds: ['u1s-01','u1s-02'] },
        'u1s-吉田':  { id: 'u1s-吉田',  title: '吉田T',  color: '#6366f1', cardIds: ['u1s-03','u1s-04','u1s-05'] },
        'u1s-西村':  { id: 'u1s-西村',  title: '西村T',  color: '#6366f1', cardIds: ['u1s-06','u1s-07','u1s-08','u1s-09'] },
        'u1s-栗原':  { id: 'u1s-栗原',  title: '栗原・新宮・大植T', color: '#6366f1', cardIds: ['u1s-10','u1s-11','u1s-12','u1s-13','u1s-14','u1s-15'] },
        'u1s-others':{ id: 'u1s-others',title: '三木・野口T', color: '#6366f1', cardIds: ['u1s-16','u1s-17'] },
      },
      columnOrder: ['u1s-衣笠','u1s-吉田','u1s-西村','u1s-栗原','u1s-others'],
    },

    // ── 2. 第1ユニット ランクA〜D ──────────────────────────────
    'b-u1abc': {
      id: 'b-u1abc', name: '第1U ランクA〜D', emoji: '🏢', createdAt: '2026-06-11',
      cards: {
        // ランクA
        'u1a-01': c('u1a-01','TKP','直：役員 / 担当：新宮','mid','新宮',['u1','ra']),
        'u1a-02': c('u1a-02','パーソルクロステクノロジー','代理：役員 / 担当：中山佳祐','mid','中山佳祐',['u1','ra','hr']),
        'u1a-03': c('u1a-03','マースジャパンリミテッド','代理：ビーコン / 担当：野口','mid','野口 太豪',['u1','ra']),
        'u1a-04': c('u1a-04','公文教育研究会','直：ビービット / 担当：松田真鈴','mid','松田真鈴',['u1','ra','edu']),
        'u1a-05': c('u1a-05','学生情報センター','直：顧問（西尾） / 担当：吉田','mid','吉田',['u1','ra','edu']),
        'u1a-06': c('u1a-06','日本教育財団','代理：朝日広告社 / 担当：吉田','mid','吉田',['u1','ra','edu']),
        // ランクB
        'u1b-01': c('u1b-01','Z会','直：セールスフォース / 担当：三木','mid','三木',['u1','rb','edu']),
        'u1b-02': c('u1b-02','アクア','直：紹介 / 担当：栗原','mid','栗原',['u1','rb']),
        'u1b-03': c('u1b-03','タスカジ','直：顧問 / 担当：新宮','mid','新宮',['u1','rb']),
        'u1b-04': c('u1b-04','トライグループ','直：Inquiry / 担当：大植','mid','大植 直人',['u1','rb','edu']),
        'u1b-05': c('u1b-05','ビースタイルメディア','直：Inquiry / 担当：松田真鈴','mid','松田真鈴',['u1','rb','hr']),
        'u1b-06': c('u1b-06','旭化成ホームズ','直：Inquiry / 担当：吉田','mid','吉田',['u1','rb','re2']),
        'u1b-07': c('u1b-07','FWD生命保険','直：紹介 / 担当：吉田','mid','吉田',['u1','rb','ins']),
        'u1b-08': c('u1b-08','FANCL','代理：共同印刷 / 担当：栗原','mid','栗原',['u1','rb']),
        'u1b-09': c('u1b-09','沢井製薬','直：Inquiry / 担当：栗原','mid','栗原',['u1','rb','med']),
        'u1b-10': c('u1b-10','IDEA','直：紹介 / 担当：宮嶋','mid','宮嶋 裕太',['u1','rb']),
        'u1b-11': c('u1b-11','Kenvue Inc.','代理：ビーコン / 担当：野口','mid','野口 太豪',['u1','rb']),
        // ランクC
        'u1c-01': c('u1c-01','朝日広告社','直：朝日広告社 / 担当：吉田','low','吉田',['u1','rc']),
        'u1c-02': c('u1c-02','日本中央競馬会','代理：SCデジタル / 担当：新宮','low','新宮',['u1','rc']),
        'u1c-03': c('u1c-03','コナミスポーツ','代理：朝日広告社 / 担当：新宮','low','新宮',['u1','rc']),
        'u1c-04': c('u1c-04','エンワールド・ジャパン','直：Sharing Innovations / 担当：栗原','low','栗原',['u1','rc','hr']),
        // ランクD
        'u1d-01': c('u1d-01','AQUA','代理：オリコム / 担当：栗原','low','栗原',['u1','rd']),
        'u1d-02': c('u1d-02','HITOWAケアサービス','直：リヴァンプ / 担当：新宮','low','新宮',['u1','rd']),
        'u1d-03': c('u1d-03','クラシエ製薬','代理：朝日広告社 / 担当：吉田','low','吉田',['u1','rd','med']),
        'u1d-04': c('u1d-04','サンワカンパニー','直：元クライアント転職先 / 担当：宮嶋','low','宮嶋 裕太',['u1','rd','re2']),
        'u1d-05': c('u1d-05','京王不動産','代理：京王エージェンシー / 担当：吉田','low','吉田',['u1','rd','re2']),
        'u1d-06': c('u1d-06','健幸ライフ','直：掘り起こし / 担当：新宮','low','新宮',['u1','rd']),
        'u1d-07': c('u1d-07','持田ヘルスケア','代理：朝日広告社 / 担当：新宮','low','新宮',['u1','rd','med']),
        'u1d-08': c('u1d-08','スワロフスキー・ジャパン','代理：ビーコン / 担当：新宮','low','新宮',['u1','rd']),
        'u1d-09': c('u1d-09','ウエラカンパニーグループ','代理：ビーコン / 担当：新宮','low','新宮',['u1','rd']),
        'u1d-10': c('u1d-10','NTTテクノクロス','直：問合せ / 担当：大植','low','大植 直人',['u1','rd','it']),
        // 木村T
        'u1km-01': c('u1km-01','三菱地所ハウスネット（木村T）','代理：ソナー / 担当：木村達輝','mid','木村達輝',['u1','rc','re2']),
        'u1km-02': c('u1km-02','大東建託パートナーズ','代理：ADK / 担当：木村達輝','mid','木村達輝',['u1','rb','re2']),
        'u1km-03': c('u1km-03','積水ハウス不動産（木村T）','直：不動産S / 担当：木村達輝','mid','木村達輝',['u1','rb','re2']),
        'u1km-04': c('u1km-04','住友商事','代理：SCデジタル / 担当：木村達輝','mid','木村達輝',['u1','rb']),
        'u1km-05': c('u1km-05','明治（木村T）','代理：東急エージェンシー / 担当：木村達輝','mid','木村達輝',['u1','rb']),
        'u1km-06': c('u1km-06','リアルゲイト','直：不動産S / 担当：木村達輝','mid','木村達輝',['u1','rb','re2']),
        'u1km-07': c('u1km-07','イトーキ','代理：ピース / 担当：木村達輝','mid','木村達輝',['u1','rb']),
        // 年永T
        'u1nt-01': c('u1nt-01','西武フィットネス（年永T）','代理：朝日広告社 / 担当：年永実 💴課金中','high','年永実',['u1','ra','active']),
        'u1nt-02': c('u1nt-02','マイナビ（年永T）','直：Inquiry / 担当：年永実','mid','年永実',['u1','rb','hr']),
        'u1nt-03': c('u1nt-03','Braze','直：役員 / 担当：年永実','mid','年永実',['u1','rc','it']),
        'u1nt-04': c('u1nt-04','大王製紙','代理：SCデジタル / 担当：年永実','mid','年永実',['u1','rc']),
        'u1nt-05': c('u1nt-05','アライアンス・バーンスタイン','直：SORASOL / 担当：年永実','mid','年永実',['u1','rc','fin']),
        'u1nt-06': c('u1nt-06','アットホーム','直：役員 / 担当：年永実','mid','年永実',['u1','rb','re2']),
        // 吉田拓哉T
        'u1yt-01': c('u1yt-01','タカラトミー','直：役員 / 担当：吉田拓哉','mid','吉田拓哉',['u1','rb','retail']),
        'u1yt-02': c('u1yt-02','第四北越銀行（吉田拓哉）','代理：電通東日本 / 担当：吉田拓哉','mid','吉田拓哉',['u1','rb','fin']),
        'u1yt-03': c('u1yt-03','青山商事','直：顧問 / 担当：吉田拓哉','mid','吉田拓哉',['u1','rb','retail']),
        'u1yt-04': c('u1yt-04','コメ兵','直：役員 / 担当：吉田拓哉','low','吉田拓哉',['u1','rd','retail']),
        'u1yt-05': c('u1yt-05','ヤマハ','代理：電通東日本 / 担当：吉田拓哉','low','吉田拓哉',['u1','rd']),
      },
      columns: {
        'u1abc-a': { id: 'u1abc-a', title: 'ランクA（6社）', color: '#6366f1', cardIds: ['u1a-01','u1a-02','u1a-03','u1a-04','u1a-05','u1a-06'] },
        'u1abc-b': { id: 'u1abc-b', title: 'ランクB（11社）', color: '#3b82f6', cardIds: ['u1b-01','u1b-02','u1b-03','u1b-04','u1b-05','u1b-06','u1b-07','u1b-08','u1b-09','u1b-10','u1b-11'] },
        'u1abc-c': { id: 'u1abc-c', title: 'ランクC・木村T', color: '#64748b', cardIds: ['u1c-01','u1c-02','u1c-03','u1c-04','u1km-01','u1km-02','u1km-03','u1km-04','u1km-05','u1km-06','u1km-07','u1nt-01','u1nt-02','u1nt-03','u1nt-04','u1nt-05','u1nt-06','u1yt-01','u1yt-02','u1yt-03'] },
        'u1abc-d': { id: 'u1abc-d', title: 'ランクD（要フォロー）', color: '#94a3b8', cardIds: ['u1d-01','u1d-02','u1d-03','u1d-04','u1d-05','u1d-06','u1d-07','u1d-08','u1d-09','u1d-10','u1yt-04','u1yt-05'] },
      },
      columnOrder: ['u1abc-a','u1abc-b','u1abc-c','u1abc-d'],
    },

    // ── 3. 第2ユニット ─────────────────────────────────────────
    'b-u2': {
      id: 'b-u2', name: '第2U 案件管理', emoji: '🏢', createdAt: '2026-06-11',
      cards: {
        // ランクS
        'u2s-01': c('u2s-01','UTグループ','直：役員 / 担当：太田','high','太田',['u2','rs','hr']),
        'u2s-02': c('u2s-02','ヨシケイ開発','直：架電 / 担当：竹平・角田・中翔吾','high','竹平圭初',['u2','rs','food']),
        'u2s-03': c('u2s-03','中部電力ミライズコネクト','代理：ADK / 担当：中翔吾','high','中翔吾',['u2','rs']),
        'u2s-04': c('u2s-04','住友三井オートサービス','代理：SCデジタル / 担当：太田・杉原','high','太田',['u2','rs','car']),
        // ランクA
        'u2a-01': c('u2a-01','ふくおかFG','代理：電通九州 / 担当：穴井','mid','穴井',['u2','ra','fin']),
        'u2a-02': c('u2a-02','セブンイレブンジャパン','直：7&iHD / 担当：太田','mid','太田',['u2','ra','retail']),
        // ランクB
        'u2b-01': c('u2b-01','UTエイム','直：役員 / 担当：今村樹','mid','今村樹',['u2','rb','hr']),
        'u2b-02': c('u2b-02','キャムコム','直：Inquiry / 担当：穴井','mid','穴井',['u2','rb','hr']),
        'u2b-03': c('u2b-03','セシール','直：紹介 / 担当：阿部志帆','mid','阿部志帆',['u2','rb','retail']),
        'u2b-04': c('u2b-04','ニチレイフーズ','直：紹介 / 担当：中翔吾','mid','中翔吾',['u2','rb','food']),
        'u2b-05': c('u2b-05','ビデオリサーチ','直：紹介 / 担当：穴井・竹平','mid','穴井',['u2','rb']),
        'u2b-06': c('u2b-06','西宮敬愛会病院','直：Inquiry / 担当：阿部志帆','mid','阿部志帆',['u2','rb','med']),
        // ランクC
        'u2c-01': c('u2c-01','エトワール海渡','直：役員 / 担当：今村樹','mid','今村樹',['u2','rc','retail']),
        'u2c-02': c('u2c-02','明治（第2U）','代理：東急エージェンシー / 担当：杉原','mid','杉原',['u2','rc']),
        'u2c-03': c('u2c-03','スパイス','直：問い合わせ / 担当：木村達輝','mid','木村達輝',['u2','rc']),
        'u2c-04': c('u2c-04','トラストガーデン','直：Inquiry / 担当：木村達輝','mid','木村達輝',['u2','rc','med']),
        'u2c-05': c('u2c-05','シンエイ','代理：Sizebook / 担当：穴井','low','穴井',['u2','rc']),
        // ランクD
        'u2d-01': c('u2d-01','N-Vision','直：問合せ / 担当：今村樹','low','今村樹',['u2','rd']),
        'u2d-02': c('u2d-02','イトーキ（第2U）','代理：ピース / 担当：今村樹','low','今村樹',['u2','rd']),
        'u2d-03': c('u2d-03','セコムトラストシステムズ','直：紹介 / 担当：今村樹','low','今村樹',['u2','rd']),
        'u2d-04': c('u2d-04','メディオン・リサーチ','直：アダム / 担当：今村樹','low','今村樹',['u2','rd']),
        'u2d-05': c('u2d-05','大東建託パートナーズ（第2U）','代理：ADK / 担当：木村達輝','low','木村達輝',['u2','rd','re2']),
        // 年永T（第2U）/ 木村T（第2U）
        'u2nt-01': c('u2nt-01','西武フィットネス 💴','代理：朝日広告社 / 担当：年永実','high','年永実',['u2','rc','active']),
        'u2km-01': c('u2km-01','KG情報','直：Inquiry / 担当：木村達輝','mid','木村達輝',['u2','rb']),
        'u2km-02': c('u2km-02','アデコ','直：Inquiry / 担当：木村達輝','mid','木村達輝',['u2','rb','hr']),
        'u2km-03': c('u2km-03','ハウスメイトパートナーズ','代理：ADK / 担当：木村達輝','mid','木村達輝',['u2','rb','re2']),
        // 第2U 特殊
        'u2x-01': c('u2x-01','KDDI（第2U・恒川）','代理：スーパーシップ / 担当：恒川涼至','mid','恒川涼至',['u2','rb','it']),
        'u2x-02': c('u2x-02','JA共済（第2U・恒川）','代理：ADK / 担当：恒川涼至','mid','恒川涼至',['u2','rc','ins']),
        'u2x-03': c('u2x-03','ALLCONECT','直：ナーチャリング架電 / 担当：穴井・竹平','low','穴井',['u2','rd','it']),
        'u2x-04': c('u2x-04','第四北越銀行（第2U）','代理：電通東日本 / 担当：今村樹','mid','今村樹',['u2','rb','fin']),
        'u2x-05': c('u2x-05','三井住友信託銀行','代理：朝日広告社 / 担当：角田誠之助','mid','角田誠之助',['u2','rb','fin']),
      },
      columns: {
        'u2-s':  { id: 'u2-s',  title: 'ランクS（4社）', color: '#f59e0b', cardIds: ['u2s-01','u2s-02','u2s-03','u2s-04'] },
        'u2-a':  { id: 'u2-a',  title: 'ランクA（2社）', color: '#6366f1', cardIds: ['u2a-01','u2a-02'] },
        'u2-b':  { id: 'u2-b',  title: 'ランクB',       color: '#3b82f6', cardIds: ['u2b-01','u2b-02','u2b-03','u2b-04','u2b-05','u2b-06','u2km-01','u2km-02','u2km-03','u2x-01','u2x-04','u2x-05'] },
        'u2-cd': { id: 'u2-cd', title: 'ランクC〜D',    color: '#64748b', cardIds: ['u2c-01','u2c-02','u2c-03','u2c-04','u2c-05','u2nt-01','u2d-01','u2d-02','u2d-03','u2d-04','u2d-05','u2x-02','u2x-03'] },
      },
      columnOrder: ['u2-s','u2-a','u2-b','u2-cd'],
    },

    // ── 4. 第3ユニット ─────────────────────────────────────────
    'b-u3': {
      id: 'b-u3', name: '第3U 案件管理', emoji: '🏢', createdAt: '2026-06-11',
      cards: {
        // ランクS
        'u3s-01': c('u3s-01','Amazon（第3U）','代理：電通デジタル / 担当：岩本','high','岩本公典',['u3','rs']),
        'u3s-02': c('u3s-02','セコム（第3U）','直：ビービット / 担当：西山修斗','high','西山修斗',['u3','rs']),
        'u3s-03': c('u3s-03','ファナティクス・ジャパン','直：Inquiry / 担当：岩本・中翔吾・西山','high','岩本公典',['u3','rs','retail']),
        'u3s-04': c('u3s-04','早稲田アカデミー','代理：ADK / 担当：角田','high','角田誠之助',['u3','rs','edu']),
        'u3s-05': c('u3s-05','第四北越銀行（第3U）','代理：電通東日本 / 担当：吉田拓哉','high','吉田拓哉',['u3','rs','fin']),
        'u3s-06': c('u3s-06','LIFULL（第3U）','直：役員 / 担当：岩本','high','岩本公典',['u3','rs','re2']),
        // ランクA
        'u3a-01': c('u3a-01','マイナビ（第3U ランクA）','直：役員 / 担当：吉田拓哉','mid','吉田拓哉',['u3','ra','hr']),
        'u3a-02': c('u3a-02','ヤマダデンキ','直：役員 / 担当：岩本','mid','岩本公典',['u3','ra','retail']),
        // ランクB（20社）
        'u3b-01': c('u3b-01','KDDI（第3U）','代理：スーパーシップ / 担当：田中萌愛','mid','田中萌愛',['u3','rb','it']),
        'u3b-02': c('u3b-02','SOMPOケア','直：知人紹介 / 担当：西山','mid','西山修斗',['u3','rb','med']),
        'u3b-03': c('u3b-03','アイデム（第3U）','代理：sizebook / 担当：今村樹','mid','今村樹',['u3','rb','hr']),
        'u3b-04': c('u3b-04','アイン薬局','直：TOPPAN / 担当：三谷将平','mid','三谷将平',['u3','rb','med']),
        'u3b-05': c('u3b-05','アットホーム（第3U）','直：役員 / 担当：年永実','mid','年永実',['u3','rb','re2']),
        'u3b-06': c('u3b-06','アルフレッサ','直：紹介 / 担当：岩本','mid','岩本公典',['u3','rb','med']),
        'u3b-07': c('u3b-07','コメ兵（第3U）','直：役員 / 担当：吉田拓哉','mid','吉田拓哉',['u3','rb','retail']),
        'u3b-08': c('u3b-08','シオノギヘルスケア','代理：ADK / 担当：穴井','mid','穴井',['u3','rb','med']),
        'u3b-09': c('u3b-09','ジンズ','直：役員 / 担当：岩本','mid','岩本公典',['u3','rb','retail']),
        'u3b-10': c('u3b-10','タカラトミー（第3U）','直：役員 / 担当：吉田拓哉','mid','吉田拓哉',['u3','rb','retail']),
        'u3b-11': c('u3b-11','テックオーシャン','直：紹介 / 担当：角田','mid','角田誠之助',['u3','rb','it']),
        'u3b-12': c('u3b-12','ハルメク','直：紹介 / 担当：中翔吾・西山','mid','中翔吾',['u3','rb']),
        'u3b-13': c('u3b-13','マイナビ（第3U ランクB）','直：Inquiry / 担当：西山・杉原','mid','西山修斗',['u3','rb','hr']),
        'u3b-14': c('u3b-14','リクルートMSL','直：紹介 / 担当：野瀬','mid','野瀬',['u3','rb','hr']),
        'u3b-15': c('u3b-15','全国生活協同組合連合会','代理：博報堂 / 担当：吉田拓哉','mid','吉田拓哉',['u3','rb']),
        'u3b-16': c('u3b-16','東急リバブル','直：役員 / 担当：中翔吾','mid','中翔吾',['u3','rb','re2']),
        'u3b-17': c('u3b-17','英進館','直：Inquiry / 担当：年永実','mid','年永実',['u3','rb','edu']),
        'u3b-18': c('u3b-18','青山商事（第3U）','直：顧問 / 担当：吉田拓哉','mid','吉田拓哉',['u3','rb','retail']),
        'u3b-19': c('u3b-19','中央コンタクト','直：問い合わせ / 担当：吉田拓哉','mid','吉田拓哉',['u3','rb']),
        'u3b-20': c('u3b-20','朝日中央綜合法律事務所','直：Inquiry / 担当：花岡恭世','mid','花岡恭世',['u3','rb']),
        // ランクC（20社）
        'u3c-01': c('u3c-01','Braze（第3U）','直：役員 / 担当：年永実','low','年永実',['u3','rc','it']),
        'u3c-02': c('u3c-02','ONECOMPATH','直：Inquiry / 担当：松田真鈴','low','松田真鈴',['u3','rc','it']),
        'u3c-03': c('u3c-03','アデコ（第3U）','直：Inquiry / 担当：木村達輝','low','木村達輝',['u3','rc','hr']),
        'u3c-04': c('u3c-04','ウイル・コーポレーション','直：Inquiry / 担当：年永実','low','年永実',['u3','rc']),
        'u3c-05': c('u3c-05','セイバン','直：イルグルム / 担当：土屋','low','土屋',['u3','rc']),
        'u3c-06': c('u3c-06','マイナビワークス','直：紹介 / 担当：年永実','low','年永実',['u3','rc','hr']),
        'u3c-07': c('u3c-07','宣伝会議','直：紹介 / 担当：年永実','low','年永実',['u3','rc']),
        'u3c-08': c('u3c-08','富士薬品','直：アウトバウンド / 担当：西山','low','西山修斗',['u3','rc','med']),
        'u3c-09': c('u3c-09','日本交通','直：ビービット / 担当：西山','low','西山修斗',['u3','rc']),
        'u3c-10': c('u3c-10','西武フィットネス（第3U）','代理：朝日広告社 / 担当：年永実','low','年永実',['u3','rc','active']),
        'u3c-11': c('u3c-11','大和アセットマネジメント','直：紹介 / 担当：角田','low','角田誠之助',['u3','rc','fin']),
        'u3c-12': c('u3c-12','ほけんの窓口グループ','直：CF / 担当：年永実','low','年永実',['u3','rc','ins']),
        // ランクD抜粋（読売G 💴 含む）
        'u3d-01': c('u3d-01','読売ジャイアンツ 💴','担当：岩本公典 / 課金中','high','岩本公典',['u3','rd','active']),
        'u3d-02': c('u3d-02','ENEOSウイング','直：DORIRU / 担当：吉田拓哉','low','吉田拓哉',['u3','rd','car']),
        'u3d-03': c('u3d-03','堀江薬局','直：知人紹介 / 担当：松田真鈴','low','松田真鈴',['u3','rd','med']),
        'u3d-04': c('u3d-04','武蔵コーポレーション','直：セールスフォース / 担当：松田真鈴','low','松田真鈴',['u3','rd','re2']),
        'u3d-05': c('u3d-05','船場','直：セールスフォース / 担当：松田真鈴','low','松田真鈴',['u3','rd']),
        'u3d-06': c('u3d-06','MRT','直：今木さん / 担当：岩本','low','岩本公典',['u3','rd','med']),
        'u3d-07': c('u3d-07','SHIFT AI','担当：岩本公典','low','岩本公典',['u3','rd','it']),
        'u3d-08': c('u3d-08','三井住友F&L','直：紹介 / 担当：岩本','low','岩本公典',['u3','rd','fin']),
        // ランクE
        'u3e-01': c('u3e-01','アストラゼネカ','代理：電通アイソバー / 担当：第3U','low','—',['u3','re','med']),
        'u3e-02': c('u3e-02','インターファクトリー','直：ビービット / 担当：三谷将平','low','三谷将平',['u3','re','it']),
        'u3e-03': c('u3e-03','読売新聞社','直：紹介 / 担当：第3U','low','—',['u3','re']),
      },
      columns: {
        'u3-s':  { id: 'u3-s',  title: 'ランクS（6社）', color: '#f59e0b', cardIds: ['u3s-01','u3s-02','u3s-03','u3s-04','u3s-05','u3s-06'] },
        'u3-a':  { id: 'u3-a',  title: 'ランクA（2社）', color: '#6366f1', cardIds: ['u3a-01','u3a-02'] },
        'u3-b':  { id: 'u3-b',  title: 'ランクB（20社）', color: '#3b82f6', cardIds: ['u3b-01','u3b-02','u3b-03','u3b-04','u3b-05','u3b-06','u3b-07','u3b-08','u3b-09','u3b-10','u3b-11','u3b-12','u3b-13','u3b-14','u3b-15','u3b-16','u3b-17','u3b-18','u3b-19','u3b-20'] },
        'u3-cd': { id: 'u3-cd', title: 'ランクC〜E', color: '#64748b', cardIds: ['u3c-01','u3c-02','u3c-03','u3c-04','u3c-05','u3c-06','u3c-07','u3c-08','u3c-09','u3c-10','u3c-11','u3c-12','u3d-01','u3d-02','u3d-03','u3d-04','u3d-05','u3d-06','u3d-07','u3d-08','u3e-01','u3e-02','u3e-03'] },
      },
      columnOrder: ['u3-s','u3-a','u3-b','u3-cd'],
    },

    // ── 5. アソシエイト / 不動産S / CF ─────────────────────────
    'b-reS-cf': {
      id: 'b-reS-cf', name: 'アソシ・不動産S・CF', emoji: '🏦', createdAt: '2026-06-11',
      cards: {
        // アソシエイト
        'as-01': c('as-01','JAバンク','代理：ADK / 担当：野瀬','high','野瀬',['assoc','rs','fin']),
        'as-02': c('as-02','リンクアカデミー','直：役員 / 担当：野瀬','high','野瀬',['assoc','rs','edu']),
        'as-03': c('as-03','イーリバースドットコム','直：セールスフォース / 担当：野瀬','mid','野瀬',['assoc','ra','it']),
        'as-04': c('as-04','OSK','直：Inquiry / 担当：野瀬','mid','野瀬',['assoc','rb']),
        'as-05': c('as-05','ネオファースト生命保険','直：DAC / 担当：三谷将平','mid','三谷将平',['assoc','rb','ins']),
        'as-06': c('as-06','KDDI（アソシ）','代理：スーパーシップ / 担当：田中萌愛','mid','田中萌愛',['assoc','rb','it']),
        'as-07': c('as-07','ZWEI','直：Inquiry / 担当：野瀬','mid','野瀬',['assoc','rb']),
        'as-08': c('as-08','リクルートMSL（アソシ）','直：紹介 / 担当：野瀬','mid','野瀬',['assoc','rb','hr']),
        'as-09': c('as-09','イトーキ（アソシ）','担当：花岡恭世','low','花岡恭世',['assoc','rd']),
        'as-10': c('as-10','マイナビクリエイター','担当：花岡恭世','low','花岡恭世',['assoc','rd','hr']),
        'as-11': c('as-11','JICA Magazine','CEメディアハウス経由 / 担当：花岡恭世','low','花岡恭世',['assoc','rd']),
        // 不動産S
        'res-01': c('res-01','一建設','直：不動産S / 担当：宮嶋・松田真鈴','high','宮嶋 裕太',['reS','rs','re2']),
        'res-02': c('res-02','大京（THE LIONS）','直・代理 / 不動産S担当','high','—',['reS','rs','re2']),
        'res-03': c('res-03','秀光ビルド','直：不動産S','high','—',['reS','rs','re2']),
        'res-04': c('res-04','LIFULL（不動産S）','直：不動産S','mid','—',['reS','ra','re2']),
        'res-05': c('res-05','オリックス自動車','直：不動産S','mid','—',['reS','ra','car']),
        'res-06': c('res-06','小田急不動産','直：不動産S','mid','—',['reS','ra','re2']),
        'res-07': c('res-07','FJネクスト','不動産S担当','mid','—',['reS','rb','re2']),
        'res-08': c('res-08','大和地所レジデンス','不動産S担当','mid','—',['reS','rb','re2']),
        'res-09': c('res-09','東急（不動産S）','不動産S担当','mid','—',['reS','rb','re2']),
        'res-10': c('res-10','リアルゲイト（不動産S）','直：不動産S / 担当：木村達輝','mid','木村達輝',['reS','rb','re2']),
        'res-11': c('res-11','積水ハウス不動産東京','不動産S担当','low','—',['reS','rd','re2']),
        // CF（金融特化チーム）
        'cf-01': c('cf-01','三井住友DSアセマネ','RFP受領（2025年4月）Webアンケート+デプス調査+アクセス分析提案','high','—',['cf','rs','fin']),
        'cf-02': c('cf-02','三菱UFJアセットマネジメント','CFチーム担当','mid','—',['cf','ra','fin']),
        'cf-03': c('cf-03','富国生命保険','CFチーム担当 / オウンドメディア制作・運用','mid','—',['cf','ra','ins']),
        'cf-04': c('cf-04','損害保険ジャパン','CFチーム担当','mid','—',['cf','ra','ins']),
        'cf-05': c('cf-05','日新火災海上保険','CFチーム担当','mid','—',['cf','ra','ins']),
        'cf-06': c('cf-06','ETERNAL','CFチーム担当','mid','—',['cf','rb','fin']),
        'cf-07': c('cf-07','SMBCコンシューマーファイナンス','CFチーム担当','mid','—',['cf','rb','fin']),
        'cf-08': c('cf-08','アムンディ・ジャパン','CFチーム担当','mid','—',['cf','rb','fin']),
      },
      columns: {
        'rsc-assoc': { id: 'rsc-assoc', title: 'アソシエイト', color: '#a78bfa', cardIds: ['as-01','as-02','as-03','as-04','as-05','as-06','as-07','as-08','as-09','as-10','as-11'] },
        'rsc-res':   { id: 'rsc-res',   title: '不動産S',    color: '#10b981', cardIds: ['res-01','res-02','res-03','res-04','res-05','res-06','res-07','res-08','res-09','res-10','res-11'] },
        'rsc-cf':    { id: 'rsc-cf',    title: 'CF金融特化', color: '#0ea5e9', cardIds: ['cf-01','cf-02','cf-03','cf-04','cf-05','cf-06','cf-07','cf-08'] },
      },
      columnOrder: ['rsc-assoc','rsc-res','rsc-cf'],
    },

    // ── 6. 事例・実績ボード ────────────────────────────────────
    'b-cases': {
      id: 'b-cases', name: 'DI 事例・実績', emoji: '📊', createdAt: '2026-06-11',
      cards: {
        // 受賞
        'cas-aw1': c('cas-aw1','Pinterest PinPro Award 2025','Best SMB Partner受賞（国内3社のみ）2026年2月','high','',['award']),
        'cas-aw2': c('cas-aw2','Meta Agency First Awards 2025','Best SMB Partner受賞（国内3社のみ）2025年11月','high','',['award']),
        'cas-aw3': c('cas-aw3','JICDAQ認証取得','デジタル広告品質認証機構 2025年10月','mid','',['award']),
        'cas-aw4': c('cas-aw4','三井住友トラストHD 統合報告書','日経統合報告書アワード2023 優秀賞受賞','mid','',['award','fin']),
        // 広告・CRO
        'cas-ad1': c('cas-ad1','ソニーネットワーク（Facebook広告）','Facebook広告リード獲得・ABテスト・LP改善 → 獲得効率6倍','high','',['ad']),
        'cas-ad2': c('cas-ad2','リロバケーションズ（広告×MA）','広告運用×クリエイティブPDCA×MA → CPO昨対比41%削減','high','',['ad','ma']),
        'cas-ad3': c('cas-ad3','Pinterest広告（匿名）','Pinterest広告運用 → 他媒体比CPA50%抑制','high','',['ad']),
        'cas-ad4': c('cas-ad4','Yahoo!ディスプレイ（匿名）','最適化 → コンバージョン単価17%改善','mid','',['ad']),
        'cas-ad5': c('cas-ad5','バナークリエイティブ改善（匿名）','CTR約120%成果改善','high','',['ad','cro']),
        'cas-ad6': c('cas-ad6','セコム（法人広告・継続）','SS106%・AED104%・安否確認130% 目標達成（2024年度）','high','',['ad']),
        // CRO・Web改善
        'cas-cr1': c('cas-cr1','住宅建築系 LPファーストビュー','ABテスト → CVR約2.3倍・離脱率約10%抑制','high','',['cro','re2']),
        'cas-cr2': c('cas-cr2','BtoBクラウドサービス 月次LP改修','CVR185%・CV数193%','high','',['cro','btob']),
        'cas-cr3': c('cas-cr3','BtoBサービスサイトリニューアル','CVR155%・CV数106%','high','',['cro','btob']),
        'cas-cr4': c('cas-cr4','介護/不動産系 エリア検索機能追加','一覧ページ遷移率407%改善・見学予約完了率404%改善','high','',['cro','re2']),
        // SEO・コンテンツ
        'cas-se1': c('cas-se1','大手銀行 SEO','SEO×コンテンツ → 広告換算約632万円/月の自然検索流入','high','',['seo','fin']),
        'cas-se2': c('cas-se2','大手金融機関 確定拠出年金','コンテンツ戦略・内部最適化 → 確定拠出年金KWで1位・流入437%UP','high','',['seo','fin']),
        'cas-se3': c('cas-se3','BtoB SaaS（コンテンツ）','3ヶ月500本制作 → セッション20倍','high','',['seo','btob']),
        'cas-se4': c('cas-se4','不動産情報サイト','SEO×コンテンツ → 流入10倍','high','',['seo','re2']),
        'cas-se5': c('cas-se5','一般財団法人（品質試験）','リニューアル後継続SEOコンサル → 7ヶ月で流入3.5倍','mid','',['seo']),
        'cas-se6': c('cas-se6','人材系企業','5ヶ月で最高4位・流入2倍','mid','',['seo','hr']),
        'cas-se7': c('cas-se7','三井住友銀行 Money Viva','「新NISA 改悪」Google検索4位','mid','',['seo','fin']),
        // DX・MA
        'cas-dx1': c('cas-dx1','Sharing Innovations（DX）','エンゲージメント強化DX施策 → 売上前年比107.2%','high','',['ma','btob']),
        'cas-dx2': c('cas-dx2','不動産投資会社（MA）','資料請求後ナーチャリング改善 → 成約率大幅UP','high','',['ma','re2']),
        // 調査
        'cas-rs1': c('cas-rs1','アップルオートネットワーク','Webアンケート（n=4,000・6エリア）→ SESS22%減・CV18%減の原因特定','high','',['res','car']),
        'cas-rs2': c('cas-rs2','KUMON 調査','n=20,117スクリーニング・n=1,000本調査（Rakuten Insight）→ 先生ブランド力効果測定','high','',['res','edu']),
        'cas-rs3': c('cas-rs3','セコムTS 調査','デプスインタビュー+Webアンケート（20,000ss）→ 購買プロセス把握・サイト改修根拠','high','',['res','btob']),
        'cas-rs4': c('cas-rs4','ヨシケイ 動画広告調査','Instagram動画広告の認知/利用意向/行動への影響調査（n=150）','mid','',['res','food']),
        'cas-rs5': c('cas-rs5','Nimway（座席管理SaaS）','定量調査（n=692）+覆面競合調査（10社）→ ポジショニングマップ作成','mid','',['res','btob']),
        'cas-rs6': c('cas-rs6','らかんスタジオ','GI+Webアンケート+1ON1 → 継続顧客化戦略・24ヶ月ROI約400%','mid','',['res']),
        'cas-rs7': c('cas-rs7','CIIC 建設業界調査','5社競合分析・ポジショニングマップ作成（2024年2月）','mid','',['res','btob']),
        'cas-rs8': c('cas-rs8','SMDAM Webアンケート調査','RFP受領（2025年4月）→ ①Webアクセス分析②アンケート③デプスの3手法提案','mid','',['res','fin']),
        // LLMO
        'cas-ll1': c('cas-ll1','SBI損害保険（LLMO）','LLMO・AI Overview対策 → ChatGPT/Geminiでの言及率改善（2025年7月）','high','',['llmo','ins']),
        'cas-ll2': c('cas-ll2','ROBOT PAYMENT（LLMO）','AI提案書生成ツール活用・Forté.AIによるLLMO分析（2025年）','mid','',['llmo','btob']),
        // 旅行・ホテル
        'cas-tr1': c('cas-tr1','ロイヤルパークHR','コロナ禍旅行意欲喚起・動画広告（YouTube・SNS）予算1,600万円（2020年7月）','mid','',['ad','travel']),
        'cas-tr2': c('cas-tr2','日本国際旅行','広告・SEO・ソーシャル（ソーシャル358%成長・動画257%成長）（2021年10月）','mid','',['ad','seo','travel']),
        'cas-tr3': c('cas-tr3','双日パラオ','サイト制作・SNS運用・Web広告3軸 → 旅行者数増加施策（2022年8月）','mid','',['ad','web','travel']),
        'cas-tr4': c('cas-tr4','ヒューリックホテル（ビューホテル）','Webサイトリニューアル全工程 → 受注確定（2023年9月〜2024年3月契約締結）','high','',['web','travel'],[{text:'サイト評価レポート提出',done:true},{text:'アクセシビリティ試験',done:true},{text:'RFP受領',done:true},{text:'プレゼン',done:true},{text:'契約締結',done:true}]),
        // PR
        'cas-pr1': c('cas-pr1','日本損害保険協会 PRキャンペーン','防火標語PR → 広告換算平均3,179万円（朝日新聞・ORICON等）','mid','',['pr','ins']),
      },
      columns: {
        'cas-award': { id: 'cas-award', title: '受賞・認定',     color: '#f59e0b', cardIds: ['cas-aw1','cas-aw2','cas-aw3','cas-aw4'] },
        'cas-ad':    { id: 'cas-ad',    title: '広告・CRO',      color: '#6366f1', cardIds: ['cas-ad1','cas-ad2','cas-ad3','cas-ad4','cas-ad5','cas-ad6','cas-cr1','cas-cr2','cas-cr3','cas-cr4'] },
        'cas-seo':   { id: 'cas-seo',   title: 'SEO・コンテンツ', color: '#f59e0b', cardIds: ['cas-se1','cas-se2','cas-se3','cas-se4','cas-se5','cas-se6','cas-se7'] },
        'cas-dxres': { id: 'cas-dxres', title: 'DX・調査',       color: '#8b5cf6', cardIds: ['cas-dx1','cas-dx2','cas-rs1','cas-rs2','cas-rs3','cas-rs4','cas-rs5','cas-rs6','cas-rs7','cas-rs8'] },
        'cas-llmo':  { id: 'cas-llmo',  title: 'LLMO・AI',       color: '#06b6d4', cardIds: ['cas-ll1','cas-ll2'] },
        'cas-other': { id: 'cas-other', title: '旅行・PR・Web制作', color: '#10b981', cardIds: ['cas-tr1','cas-tr2','cas-tr3','cas-tr4','cas-pr1'] },
      },
      columnOrder: ['cas-award','cas-ad','cas-seo','cas-dxres','cas-llmo','cas-other'],
    },

    // ── 7. サービス・強み・競合 ──────────────────────────────────
    'b-services': {
      id: 'b-services', name: 'DI サービス・強み', emoji: '💡', createdAt: '2026-06-11',
      cards: {
        // サービス
        'sv-01': c('sv-01','デジタルマーケティングコンサル（全体戦略）','戦略立案から実行まで一貫。フルファネルワンストップ支援','high','',['ad']),
        'sv-02': c('sv-02','運用型広告','Google・Meta・Yahoo!・X・TikTok・Pinterest・LINE等20媒体以上','high','',['ad']),
        'sv-03': c('sv-03','SEO・コンテンツマーケティング','コンテンツSEO・内部最適化・KW戦略立案','high','',['seo']),
        'sv-04': c('sv-04','LLMO（LLM言及率最適化）','ChatGPT・Gemini・Claude等AIでの言及率改善。Forté.AI活用','high','',['llmo','seo']),
        'sv-05': c('sv-05','CRO・LPO・EFO','ABテスト・ファーストビュー改修・フォーム最適化','high','',['cro']),
        'sv-06': c('sv-06','MA・DXコンサルティング','Salesforce/MA導入・BI構築・GA4・Looker Studio','high','',['ma']),
        'sv-07': c('sv-07','SNS運用・PR','Instagram/TikTok/LINE・インフルエンサー・PRキャンペーン','mid','',['pr']),
        'sv-08': c('sv-08','Webサイト制作・リニューアル','UI/UX設計・CMS開発・アクセシビリティ対応','mid','',['web']),
        'sv-09': c('sv-09','CMO代行・インハウス支援','マーケティング担当代行・AD内製化支援','mid','',['ad']),
        'sv-10': c('sv-10','調査・リサーチ（定量・定性）','Webアンケート・GI・デプスインタビュー・競合調査。350万円〜','mid','',['res']),
        'sv-11': c('sv-11','Forté.AI プラットフォーム','2026年1月全社導入。業務1,500時間以上削減。外販はコンサル経由','high','',['llmo','ma'],[{text:'LLMO Research Lite実装',done:true},{text:'利用社数200社突破',done:true},{text:'社内全社導入',done:true},{text:'対外提供開始',done:true}]),
        'sv-12': c('sv-12','ライバルマーケティング','競合サイト訪問者へのターゲティング広告。保険・証券・金融に特に有効','mid','',['ad','fin']),
        'sv-13': c('sv-13','タテファク（縦型ショート動画）','TikTok Shop対応・縦型動画専門チーム','mid','',['pr']),
        'sv-14': c('sv-14','Liny（LINE活用支援）','Liny販売代理店。3,500社実績','mid','',['ma']),
        'sv-15': c('sv-15','薬機法チェッカー・医師監修','医師500名超・ライター1,000名超の対応体制','mid','',['med']),
        'sv-16': c('sv-16','事業承継コンサルティング','累計10社以上の支援実績','low','',['btob']),
        // 強み・差別化
        'str-01': c('str-01','Google Premier Partner（上位3%）','Googleの最上位パートナー資格。特殊アカウント機能を保有','high','',['ad']),
        'str-02': c('str-02','Yahoo!特別認定パートナー 10期連続','金融系KWでの特殊機能利用可能。業界唯一','high','',['ad','fin']),
        'str-03': c('str-03','Meta Business Partner','Facebook/Instagramの公式パートナー','mid','',['ad']),
        'str-04': c('str-04','顧客満足度約83%・継続率9割強','直近3年事業成長率164%。広告業界TOP10・SEO TOP5','high','',['ad','seo']),
        // 競合比較
        'comp-01': c('comp-01','vs ソウルドアウト','中堅企業向けで競合。DIはフルファネル・AI対応で差別化','mid','',['ad']),
        'comp-02': c('comp-02','vs フルスピード','SEO・コンテンツ領域で競合。DIは広告＋制作も一社完結','mid','',['seo']),
        'comp-03': c('comp-03','vs メンバーズ','DX・MA領域で競合。DIは広告・SEOとの統合提案が強み','mid','',['ma']),
        'comp-04': c('comp-04','vs アタラ','広告運用特化。DIはワンストップ・業界特化チームで差別化','mid','',['ad']),
        'comp-05': c('comp-05','vs 電通デジタル','大企業向け。DIはミッドマーケット特化・スピード感が強み','mid','',['ad']),
        'comp-06': c('comp-06','vs シナジーマーケティング','MA・CRM領域で競合。DIは実行まで含むコンサルが強み','mid','',['ma']),
        // 業界別提案ポイント
        'ind-01': c('ind-01','金融業界 提案ポイント','SEO・ライバルマーケ・LLMO / Yahoo!特別認定で金融KW特殊機能利用可','high','',['fin','seo','llmo']),
        'ind-02': c('ind-02','不動産業界 提案ポイント','P-MAX・Meta学習精度活用 / 「今が最高値」「近隣成約事例」の具体数字訴求','high','',['re2','ad','cro']),
        'ind-03': c('ind-03','自動車業界 提案ポイント','SEO+調査（なぜ選ばれないか定量化）+CRO / 地域別キャンペーン設計','mid','',['car','seo','res']),
        'ind-04': c('ind-04','旅行・ホテル業界 提案ポイント','動画広告（YouTube・SNS）+サイト制作 / OTA補完ポジションで提案','mid','',['travel','ad','web']),
      },
      columns: {
        'sv-main':  { id: 'sv-main',  title: 'サービス一覧',  color: '#6366f1', cardIds: ['sv-01','sv-02','sv-03','sv-04','sv-05','sv-06','sv-07','sv-08','sv-09','sv-10','sv-11','sv-12','sv-13','sv-14','sv-15','sv-16'] },
        'sv-str':   { id: 'sv-str',   title: '強み・パートナー', color: '#f59e0b', cardIds: ['str-01','str-02','str-03','str-04'] },
        'sv-comp':  { id: 'sv-comp',  title: '競合比較',      color: '#ef4444', cardIds: ['comp-01','comp-02','comp-03','comp-04','comp-05','comp-06'] },
        'sv-ind':   { id: 'sv-ind',   title: '業界別提案ポイント', color: '#10b981', cardIds: ['ind-01','ind-02','ind-03','ind-04'] },
      },
      columnOrder: ['sv-main','sv-str','sv-comp','sv-ind'],
    },

    // ── 8. 営業・運用プレイブック ──────────────────────────────
    'b-playbook': {
      id: 'b-playbook', name: 'DI プレイブック', emoji: '📖', createdAt: '2026-06-11',
      cards: {
        // 営業プロセス
        'pb-s1': c('pb-s1','Step1 リード獲得','セミナー/ウェビナー・Inquiry・紹介・グループクロスセルが主要ソース','mid','',['play']),
        'pb-s2': c('pb-s2','Step2 ヒアリング（BANT）','Budget・Authority・Need・Timeline を30分で確認。仮説3つを事前準備','high','',['play'],[{text:'クライアント事業・競合調査',done:false},{text:'仮説3つ準備',done:false},{text:'関連事例1〜2件手元に',done:false}]),
        'pb-s3': c('pb-s3','Step3 提案書作成','ヒアリング後3営業日以内。構成：エグサマ→課題→推奨サービス→期待効果→実行プラン→費用','high','',['play'],[{text:'エグゼクティブサマリー',done:false},{text:'課題整理',done:false},{text:'推奨サービス選定',done:false},{text,'期待効果試算',done:false},{text:'上長レビュー',done:false}]),
        'pb-s4': c('pb-s4','Step4 クロージング','提案後3営業日以内にフォロー。価格交渉は上長相談後回答','mid','',['play']),
        'pb-s5': c('pb-s5','Step5 受注・契約','口頭確認後、発注書・契約書を必ず取得。法務・上長確認必須','high','',['play']),
        'pb-s6': c('pb-s6','Step6 キックオフ','受注後2週間以内。KPI・担当者・連絡体制・スケジュールを確認','mid','',['play']),
        // 反論切り返し
        'pb-r1': c('pb-r1','反論：今の代理店がいるので','「今の施策で課題はありますか？セカンドオピニオンとして見てみませんか」','mid','',['play']),
        'pb-r2': c('pb-r2','反論：予算がない','「どの規模からでも始められます。まず診断だけでも」','mid','',['play']),
        'pb-r3': c('pb-r3','反論：社内でできます','「インハウス支援という選択肢もあります。一緒に内製化しましょう」','mid','',['play']),
        'pb-r4': c('pb-r4','反論：提案が高い','「ROIで考えると…（実績数値を提示）」','mid','',['play']),
        // 広告運用日次〜月次
        'pb-ad1': c('pb-ad1','広告運用 日次チェック','主要KPI（CPA・ROAS・消化額）・異常値・予算ペース・品質スコアを確認','high','',['ad'],[{text:'主要KPI確認',done:false},{text:'異常値アラート確認',done:false},{text:'予算ペース確認',done:false},{text:'品質スコア確認',done:false}]),
        'pb-ad2': c('pb-ad2','広告運用 週次チェック','週次レポート・クリエイティブパフォーマンス・KW最適化・入札戦略見直し','mid','',['ad'],[{text:'週次レポート作成',done:false},{text:'クリエイティブパフォーマンス確認',done:false},{text:'KW最適化',done:false},{text:'入札戦略見直し',done:false}]),
        'pb-ad3': c('pb-ad3','広告運用 月次業務','/client-report コマンド活用。予算達成確認・翌月調整提案・競合広告状況調査','mid','',['ad'],[{text:'月次レポート作成（/client-report）',done:false},{text:'予算達成確認・翌月調整提案',done:false},{text:'クリエイティブローテーション更新',done:false},{text:'競合広告状況調査',done:false}]),
        // 媒体別
        'pb-med1': c('pb-med1','Google広告 管理ポイント','検索語句レポート定期確認・除外KW追加・品質スコア改善','mid','',['ad']),
        'pb-med2': c('pb-med2','Meta広告 管理ポイント','クリエイティブ疲弊確認（フリークエンシー）・オーディエンスオーバーラップ確認','mid','',['ad']),
        'pb-med3': c('pb-med3','Yahoo!広告 管理ポイント','スマート入札の学習状況確認。金融KWはYahoo!特別認定機能を活用','mid','',['ad','fin']),
        // 納品チェックリスト
        'pb-chk1': c('pb-chk1','納品前チェックリスト（16項目）','公開前の最終確認。SEO・表示速度・クロス、ブラウザ・フォームテスト等','high','',['web','seo'],[{text:'タイトル/メタディスクリプション設定',done:false},{text:'canonical設定',done:false},{text:'noindex確認',done:false},{text:'サイトマップ送信',done:false},{text:'表示速度計測',done:false},{text:'フォームテスト',done:false},{text:'クロスブラウザ確認',done:false},{text:'モバイル確認',done:false}]),
        'pb-chk2': c('pb-chk2','リニューアル時SEOチェックリスト','旧URL→新URLリダイレクト確認・インデックス状況・順位モニタリング設定','high','',['web','seo']),
        // 定例MTG型
        'pb-mtg': c('pb-mtg','定例MTGの型（6:2:2）','6割：提案（改善施策・次月計画） / 2割：数値報告 / 2割：クリエイティブ確認','high','',['play']),
      },
      columns: {
        'pb-sales':  { id: 'pb-sales',  title: '営業プロセス',   color: '#6366f1', cardIds: ['pb-s1','pb-s2','pb-s3','pb-s4','pb-s5','pb-s6','pb-r1','pb-r2','pb-r3','pb-r4'] },
        'pb-adops':  { id: 'pb-adops',  title: '広告運用オペレーション', color: '#f59e0b', cardIds: ['pb-ad1','pb-ad2','pb-ad3','pb-med1','pb-med2','pb-med3'] },
        'pb-delivery':{ id: 'pb-delivery', title: '納品・MTG',    color: '#10b981', cardIds: ['pb-chk1','pb-chk2','pb-mtg'] },
      },
      columnOrder: ['pb-sales','pb-adops','pb-delivery'],
    },

    // ── 9. KB タスク管理 ─────────────────────────────────────
    'b-tasks': {
      id: 'b-tasks', name: 'DI KB タスク', emoji: '📋', createdAt: '2026-06-11',
      cards: {
        // 要追記（口頭ヒアリング待ち）
        'tk-01': c('tk-01','創業の経緯・失敗と成功（history.md）','代表インタビュー待ち。創業動機・最初の顧客・転換点・失敗談','high','滝沢 裕',['kbu']),
        'tk-02': c('tk-02','今期数値目標・3年後ビジョン（goals.md）','経営層合意待ち。売上・人数・クライアント数の定量目標・重点投資領域','high','滝沢 裕',['kbu']),
        'tk-03': c('tk-03','営業の失注パターン（sales-playbook.md）','営業責任者ヒアリング待ち。価格負け・競合負け・内製化パターンと対策','high','滝沢 裕',['kbu']),
        'tk-04': c('tk-04','clients_archive.md 新規作成','契約終了クライアントの社名・終了時期・理由を整備。退職者情報含む可能性あり権限確認要','mid','滝沢 裕',['kbu']),
        'tk-05': c('tk-05','未処理PDF：市場調査説明資料（会社名不明）','【〇〇様】_市場調査の説明資料_20250605.pdf を確認・KB反映','mid','滝沢 裕',['pdf']),
        // 進行中
        'tk-06': c('tk-06','提案書作成ガイド.md 最終化','滝沢作成のDIサービス提案書作成ガイドのQA・最終レビュー','high','滝沢 裕',['play']),
        'tk-07': c('tk-07','/client-report コマンドの実案件テスト','実クライアントで動作確認。出力品質の評価と改善','mid','滝沢 裕',['cmd']),
        'tk-08': c('tk-08','Drive未整備フォルダ 移管依頼','clients.md の ❌ NOT_FOUND フォルダを各担当者に確認・整備依頼','high','滝沢 裕',['drive'],[{text:'第1ユニットに依頼',done:false},{text:'第2ユニットに依頼',done:false},{text:'第3ユニットに依頼',done:false},{text:'アソシエイトに依頼',done:false}]),
        'tk-09': c('tk-09','KUMON 提案フォロー確認（2025年6月）','求人サイト向けデジタルMKTコンサルティング提案（350万円〜）の進捗確認','mid','滝沢 裕',['kbu','edu']),
        'tk-10': c('tk-10','プロパティエージェント 提案進捗確認','フルファネル提案（広告+SEO+CRO+DX）の現状確認','mid','滝沢 裕',['kbu','re2']),
        // 完了
        'tk-11': c('tk-11','clients.md 整備（スプレッドシートCSV）','約200件をユニット別・チーム別・NPSランク別に整理完了','mid','滝沢 裕',['kbu']),
        'tk-12': c('tk-12','競合調査 8社分 追加（positioning/competitive-advantages）','ソウルドアウト/フルスピード/メンバーズ等の比較表追加完了（2026-06-11）','mid','滝沢 裕',['kbu']),
        'tk-13': c('tk-13','tool-guide.md 社内ツール全確定','Chatwork/Salesforce/ChatGPT/Gemini/FastAsk/Figmaを全確定・整備完了','mid','滝沢 裕',['kbu']),
        'tk-14': c('tk-14','forte-ai-llmo.md 価格プラン反映','STANDARD 60万/月・BUSINESS 100万/月・KPI設計・ロードマップ追記完了','mid','滝沢 裕',['kbu']),
        'tk-15': c('tk-15','cases.md 新規15案件追加（2026-06-01）','KUMON・ヒューリックホテル・セコムTSS・ヨシケイ等15案件追加完了','mid','滝沢 裕',['kbu']),
        'tk-16': c('tk-16','team-members.md / org-structure.md 整備','スプレッドシートCSVより約60名超・ユニット体制を整備完了（2026-06-11）','mid','滝沢 裕',['kbu']),
        'tk-17': c('tk-17','重複ファイル6ペア解消（2026-05-29）','正規版に統合・旧版削除。パス参照バグも修正完了','low','滝沢 裕',['kbu']),
      },
      columns: {
        'tk-waiting': { id: 'tk-waiting', title: '要追記（口頭情報待ち）', color: '#ef4444', cardIds: ['tk-01','tk-02','tk-03','tk-04','tk-05'] },
        'tk-doing':   { id: 'tk-doing',   title: '進行中',               color: '#3b82f6', cardIds: ['tk-06','tk-07','tk-08','tk-09','tk-10'] },
        'tk-done':    { id: 'tk-done',    title: '完了',                 color: '#10b981', cardIds: ['tk-11','tk-12','tk-13','tk-14','tk-15','tk-16','tk-17'] },
      },
      columnOrder: ['tk-waiting','tk-doing','tk-done'],
    },
  },
};

/** localStorage に保存された古い形式の Card を現行型に正規化する */
export function normalizeCard(raw: Record<string, unknown>): import('@/types').Card {
  return {
    id:          String(raw['id'] ?? ''),
    title:       String(raw['title'] ?? ''),
    description: String(raw['description'] ?? ''),
    priority:    (raw['priority'] as import('@/types').Priority) ?? '中',
    assignee:    String(raw['assignee'] ?? ''),
    dueDate:     (raw['dueDate'] as string | null) ?? null,
    tags:        Array.isArray(raw['tags']) ? (raw['tags'] as import('@/types').Tag[]) : [],
    createdAt:   String(raw['createdAt'] ?? new Date().toISOString().slice(0, 10)),
    checklist:   Array.isArray(raw['checklist']) ? (raw['checklist'] as import('@/types').ChecklistItem[]) : [],
    comments:    Array.isArray(raw['comments'])  ? (raw['comments']  as import('@/types').Comment[]) : [],
    archived:    Boolean(raw['archived'] ?? false),
  };
}

/** AppState 全体を正規化（旧バージョン互換 + 新ボード自動マージ） */
export function normalizeAppState(raw: Record<string, unknown>): AppState {
  const base = raw as AppState;
  const boards: AppState['boards'] = {};
  for (const [bid, board] of Object.entries(base.boards ?? {})) {
    const cards: AppState['boards'][string]['cards'] = {};
    for (const [cid, card] of Object.entries(board.cards ?? {})) {
      cards[cid] = normalizeCard(card as Record<string, unknown>);
    }
    boards[bid] = { ...board, cards };
  }
  // initialAppState に新ボードが追加されたとき自動マージ
  for (const [bid, board] of Object.entries(initialAppState.boards)) {
    if (!boards[bid]) boards[bid] = board;
  }
  const existingOrder: string[] = Array.isArray(base.boardOrder) ? base.boardOrder : [];
  const mergedOrder = [
    ...existingOrder,
    ...initialAppState.boardOrder.filter(id => !existingOrder.includes(id)),
  ];
  return {
    ...base,
    boards,
    boardOrder: mergedOrder,
    activityLog: Array.isArray(base.activityLog) ? base.activityLog : [],
  };
}
