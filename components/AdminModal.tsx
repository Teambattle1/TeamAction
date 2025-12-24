
import React, { useState } from 'react';
import { Game } from '../types';
import { X, Database, AlertTriangle, Terminal, Copy, Check } from 'lucide-react';

interface AdminModalProps {
  games: Game[]; // Kept for compatibility if needed, though unused for deletion now
  onClose: () => void;
  onDeleteGame: (id: string) => void; // Kept for interface compatibility but unused
  initialShowSql?: boolean;
}

const AdminModal: React.FC<AdminModalProps> = ({ onClose, initialShowSql = false }) => {
  const [showSql, setShowSql] = useState(initialShowSql);
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- COPY THIS INTO THE SUPABASE SQL EDITOR TO FIX DATABASE ISSUES

-- 1. GAMES Table
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public games access" ON public.games;
CREATE POLICY "Public games access" ON public.games FOR ALL USING (true) WITH CHECK (true);

-- 2. TEAMS Table
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    name TEXT NOT NULL,
    join_code TEXT,
    photo_url TEXT,
    members JSONB DEFAULT '[]'::jsonb, 
    score INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    captain_device_id TEXT,
    is_started BOOLEAN DEFAULT false,
    completed_point_ids TEXT[] DEFAULT '{}'
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public teams access" ON public.teams;
CREATE POLICY "Public teams access" ON public.teams FOR ALL USING (true) WITH CHECK (true);

-- MIGRATION: Ensure columns exist for TEAMS (Fixes PGRST204)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'completed_point_ids') THEN
        ALTER TABLE public.teams ADD COLUMN completed_point_ids TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'captain_device_id') THEN
        ALTER TABLE public.teams ADD COLUMN captain_device_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'is_started') THEN
        ALTER TABLE public.teams ADD COLUMN is_started BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 3. LIBRARY Table
CREATE TABLE IF NOT EXISTS public.library (
    id TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public library access" ON public.library;
CREATE POLICY "Public library access" ON public.library FOR ALL USING (true) WITH CHECK (true);

-- 4. TASK_LISTS Table
CREATE TABLE IF NOT EXISTS public.task_lists (
    id TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public task_lists access" ON public.task_lists;
CREATE POLICY "Public task_lists access" ON public.task_lists FOR ALL USING (true) WITH CHECK (true);

-- 5. ACCOUNT_USERS Table
CREATE TABLE IF NOT EXISTS public.account_users (
    id TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public account_users access" ON public.account_users;
CREATE POLICY "Public account_users access" ON public.account_users FOR ALL USING (true) WITH CHECK (true);

-- 6. ACCOUNT_INVITES Table
CREATE TABLE IF NOT EXISTS public.account_invites (
    id TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.account_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public account_invites access" ON public.account_invites;
CREATE POLICY "Public account_invites access" ON public.account_invites FOR ALL USING (true) WITH CHECK (true);

-- 7. PLAYGROUND_LIBRARY Table (GLOBAL PLAYGROUNDS)
CREATE TABLE IF NOT EXISTS public.playground_library (
    id TEXT PRIMARY KEY,
    title TEXT,
    is_global BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.playground_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public playground library access" ON public.playground_library;
CREATE POLICY "Public playground library access" ON public.playground_library FOR ALL USING (true) WITH CHECK (true);

-- MIGRATION: Ensure columns exist for PLAYGROUNDS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'playground_library' AND column_name = 'is_global') THEN
        ALTER TABLE public.playground_library ADD COLUMN is_global BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'playground_library' AND column_name = 'title') THEN
        ALTER TABLE public.playground_library ADD COLUMN title TEXT;
    END IF;
END $$;

-- 8. HIGH PERFORMANCE TAG PURGE FUNCTION
CREATE OR REPLACE FUNCTION public.purge_tag_globally(tag_to_purge TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update Library Templates
    UPDATE public.library
    SET data = jsonb_set(
        data, 
        '{tags}', 
        (SELECT jsonb_agg(x) FROM jsonb_array_elements(data->'tags') x WHERE lower(x::text) != lower('"' || tag_to_purge || '"'))
    )
    WHERE data->'tags' @> ('["' || tag_to_purge || '"]')::jsonb;

    -- Update Games Points
    UPDATE public.games
    SET data = (
        SELECT jsonb_set(
            games.data, 
            '{points}', 
            jsonb_agg(
                jsonb_set(
                    p, 
                    '{tags}', 
                    COALESCE((SELECT jsonb_agg(t) FROM jsonb_array_elements(p->'tags') t WHERE lower(t::text) != lower('"' || tag_to_purge || '"')), '[]'::jsonb)
                )
            )
        )
        FROM jsonb_array_elements(games.data->'points') p
    )
    WHERE games.data->'points' @> ('[{"tags": ["' || tag_to_purge || '"]}]')::jsonb;

    -- Update Task Lists
    UPDATE public.task_lists
    SET data = (
        SELECT jsonb_set(
            task_lists.data, 
            '{tasks}', 
            jsonb_agg(
                jsonb_set(
                    t, 
                    '{tags}', 
                    COALESCE((SELECT jsonb_agg(tag) FROM jsonb_array_elements(t->'tags') tag WHERE lower(tag::text) != lower('"' || tag_to_purge || '"')), '[]'::jsonb)
                )
            )
        )
        FROM jsonb_array_elements(task_lists.data->'tasks') t
    )
    WHERE task_lists.data->'tasks' @> ('[{"tags": ["' || tag_to_purge || '"]}]')::jsonb;
END;
$$;

-- 9. TAG RENAME FUNCTION
CREATE OR REPLACE FUNCTION public.rename_tag_globally(old_tag TEXT, new_tag TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update Library Templates
    UPDATE public.library
    SET data = jsonb_set(
        data, 
        '{tags}', 
        (
            SELECT jsonb_agg(
                CASE 
                    WHEN lower(x::text) = lower('"' || old_tag || '"') THEN to_jsonb(new_tag)
                    ELSE x 
                END
            ) 
            FROM jsonb_array_elements(data->'tags') x
        )
    )
    WHERE data->'tags' @> ('["' || old_tag || '"]')::jsonb;

    -- Update Games Points
    UPDATE public.games
    SET data = (
        SELECT jsonb_set(
            games.data, 
            '{points}', 
            jsonb_agg(
                jsonb_set(
                    p, 
                    '{tags}', 
                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                CASE 
                                    WHEN lower(t::text) = lower('"' || old_tag || '"') THEN to_jsonb(new_tag)
                                    ELSE t 
                                END
                            ) 
                            FROM jsonb_array_elements(p->'tags') t
                        ), 
                        '[]'::jsonb
                    )
                )
            )
        )
        FROM jsonb_array_elements(games.data->'points') p
    )
    WHERE games.data->'points' @> ('[{"tags": ["' || old_tag || '"]}]')::jsonb;

    -- Update Task Lists
    UPDATE public.task_lists
    SET data = (
        SELECT jsonb_set(
            task_lists.data, 
            '{tasks}', 
            jsonb_agg(
                jsonb_set(
                    t, 
                    '{tags}', 
                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                CASE 
                                    WHEN lower(tag::text) = lower('"' || old_tag || '"') THEN to_jsonb(new_tag)
                                    ELSE tag 
                                END
                            ) 
                            FROM jsonb_array_elements(t->'tags') tag
                        ), 
                        '[]'::jsonb
                    )
                )
            )
        )
        FROM jsonb_array_elements(task_lists.data->'tasks') t
    )
    WHERE task_lists.data->'tasks' @> ('[{"tags": ["' || tag_to_purge || '"]}]')::jsonb;
END;
$$;

-- 10. Enable Realtime for TEAMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'teams') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
    END IF;
END $$;

-- 11. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload config';`;

  const copyToClipboard = () => {
      navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500"/> DATABASE TOOLS
            </h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">SYSTEM MAINTENANCE & SQL</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
          
          <button 
            onClick={() => setShowSql(!showSql)}
            className="w-full p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl flex items-center justify-between text-indigo-400 hover:bg-indigo-900/40 hover:text-indigo-300 transition-all mb-4"
          >
              <div className="flex flex-col items-start">
                  <span className="text-sm font-bold uppercase flex items-center gap-2"><Terminal className="w-4 h-4" /> Setup Database Tables</span>
                  <span className="text-[10px] text-indigo-400/60 font-bold mt-1">RUN THIS IF YOU SEE SUPABASE ERRORS</span>
              </div>
              <span className="text-[10px] bg-indigo-500/20 px-2 py-1 rounded">CLICK TO VIEW SQL</span>
          </button>

          {showSql && (
              <div className="bg-black rounded-xl p-4 border border-slate-700 mb-4 relative animate-in zoom-in-95">
                  <div className="bg-amber-900/30 border border-amber-500/50 p-3 rounded-lg mb-3 flex gap-3 items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                          <p className="text-[10px] text-amber-200 font-bold uppercase mb-1">SUPABASE WARNING</p>
                          <p className="text-[10px] text-amber-100/80">
                              Supabase will warn you about "Destructive Operations". This is because the script updates security policies. 
                              <br/><strong>It is safe to click "Run this query".</strong>
                          </p>
                      </div>
                  </div>
                  <pre className="text-[10px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-60 custom-scrollbar p-2 bg-[#0d1117] rounded-lg border border-white/10">
                      {sqlCode}
                  </pre>
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600"
                    title="Copy SQL"
                  >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                      Paste this into the Supabase SQL Editor to fix any missing tables or permissions.
                  </p>
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                USE WITH CAUTION
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminModal;
