// =============================================================
// Supabase Realtime フック — EoM ダッシュボード用
// =============================================================
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  EomAgent, EomRun, EomAuction, EomWealthEvent,
  AgentRow, RunRow, AuctionRow, WealthEventRow,
} from './types';
import {
  agentFromRow, runFromRow, auctionFromRow, wealthEventFromRow,
} from './types';

// ── エージェント一覧 ──────────────────────────────────────────
export function useAgents(): { agents: EomAgent[]; loading: boolean } {
  const [agents, setAgents]   = useState<EomAgent[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    // 初回取得
    supabase
      .from('eom_agents')
      .select('*')
      .order('wealth', { ascending: false })
      .then(({ data }) => {
        setAgents(((data ?? []) as AgentRow[]).map(agentFromRow));
        setLoading(false);
      });

    // Realtime 購読
    const channel = supabase
      .channel('eom_agents_changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'eom_agents',
      }, payload => {
        if (payload.eventType === 'DELETE') {
          setAgents(prev => prev.filter(a => a.id !== (payload.old as AgentRow).id));
        } else {
          const updated = agentFromRow(payload.new as AgentRow);
          setAgents(prev => {
            const idx = prev.findIndex(a => a.id === updated.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next.sort((a, b) => b.wealth - a.wealth);
            }
            return [updated, ...prev].sort((a, b) => b.wealth - a.wealth);
          });
        }
      })
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, []);

  return { agents, loading };
}

// ── ラン一覧 ─────────────────────────────────────────────────
export function useRuns(limit = 20): { runs: EomRun[]; loading: boolean } {
  const [runs, setRuns]       = useState<EomRun[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    supabase
      .from('eom_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        setRuns(((data ?? []) as RunRow[]).map(runFromRow));
        setLoading(false);
      });

    const channel = supabase
      .channel('eom_runs_changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'eom_runs',
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setRuns(prev => [runFromRow(payload.new as RunRow), ...prev].slice(0, limit));
        } else if (payload.eventType === 'UPDATE') {
          const updated = runFromRow(payload.new as RunRow);
          setRuns(prev => prev.map(r => r.id === updated.id ? updated : r));
        }
      })
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, [limit]);

  return { runs, loading };
}

// ── オークション一覧 ─────────────────────────────────────────
export function useAuctions(limit = 30): { auctions: EomAuction[]; loading: boolean } {
  const [auctions, setAuctions] = useState<EomAuction[]>([]);
  const [loading, setLoading]   = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    supabase
      .from('eom_auctions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        setAuctions(((data ?? []) as AuctionRow[]).map(auctionFromRow));
        setLoading(false);
      });

    const channel = supabase
      .channel('eom_auctions_changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'eom_auctions',
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setAuctions(prev =>
            [auctionFromRow(payload.new as AuctionRow), ...prev].slice(0, limit)
          );
        } else if (payload.eventType === 'UPDATE') {
          const updated = auctionFromRow(payload.new as AuctionRow);
          setAuctions(prev => prev.map(a => a.id === updated.id ? updated : a));
        }
      })
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, [limit]);

  return { auctions, loading };
}

// ── 富変動イベント ─────────────────────────────────────────────
export function useWealthHistory(
  agentId?: string,
  limit = 100,
): { events: EomWealthEvent[]; loading: boolean } {
  const [events, setEvents]   = useState<EomWealthEvent[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    let query = supabase
      .from('eom_wealth_events')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (agentId) query = query.eq('agent_id', agentId);

    query.then(({ data }) => {
      setEvents(((data ?? []) as WealthEventRow[]).map(wealthEventFromRow));
      setLoading(false);
    });

    const filter = agentId
      ? `agent_id=eq.${agentId}`
      : undefined;

    const channel = supabase
      .channel('eom_wealth_changes')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'eom_wealth_events',
        ...(filter ? { filter } : {}),
      }, payload => {
        setEvents(prev =>
          [...prev, wealthEventFromRow(payload.new as WealthEventRow)].slice(-limit)
        );
      })
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, [agentId, limit]);

  return { events, loading };
}
