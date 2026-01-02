import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as db from '../services/db';

export type TagColorsMap = Record<string, string>;

interface TagColorsContextValue {
  tagColors: TagColorsMap;
  getTagColor: (tag: string) => string;
  setTagColor: (tag: string, color: string) => void;
  replaceTagColors: (next: TagColorsMap) => void;
  refreshTagColors: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'geohunt_tag_colors';
const DEFAULT_TAG_COLOR = '#64748b';

const normalizeTagColors = (input: TagColorsMap): TagColorsMap => {
  const next: TagColorsMap = {};
  for (const [rawKey, rawVal] of Object.entries(input || {})) {
    const key = `${rawKey || ''}`.trim().toLowerCase();
    const val = `${rawVal || ''}`.trim();
    if (!key || !val) continue;
    next[key] = val;
  }
  return next;
};

const safeReadLocalTagColors = (): TagColorsMap => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) return {};

  try {
    return normalizeTagColors(JSON.parse(stored));
  } catch {
    return {};
  }
};

const safeWriteLocalTagColors = (tagColors: TagColorsMap) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tagColors));
  } catch {
    // ignore
  }
};

const TagColorsContext = createContext<TagColorsContextValue | null>(null);

export const useTagColors = (): TagColorsContextValue => {
  const ctx = useContext(TagColorsContext);
  if (!ctx) throw new Error('useTagColors must be used within <TagColorsProvider />');
  return ctx;
};

export const TagColorsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tagColors, setTagColors] = useState<TagColorsMap>({});

  const persistEverywhere = useCallback((next: TagColorsMap) => {
    setTagColors(next);
    safeWriteLocalTagColors(next);

    db.saveTagColors(next).catch((e) => {
      console.warn('[TagColors] Failed to persist tag colors to database', e);
    });
  }, []);

  const refreshTagColors = useCallback(async () => {
    const localColors = safeReadLocalTagColors();
    setTagColors(localColors);

    const remoteColors = normalizeTagColors(await db.fetchTagColors());

    // Remote is the source of truth; keep any local-only keys for safety.
    const merged: TagColorsMap = { ...localColors, ...remoteColors };

    setTagColors(merged);
    safeWriteLocalTagColors(merged);
  }, []);

  useEffect(() => {
    refreshTagColors().catch(() => {
      // ignore
    });
  }, [refreshTagColors]);

  const getTagColor = useCallback(
    (tag: string) => {
      const key = `${tag || ''}`.trim().toLowerCase();
      return tagColors[key] || DEFAULT_TAG_COLOR;
    },
    [tagColors]
  );

  const setTagColor = useCallback(
    (tag: string, color: string) => {
      const key = `${tag || ''}`.trim().toLowerCase();
      if (!key) return;

      const next = { ...tagColors, [key]: color };
      persistEverywhere(next);
    },
    [persistEverywhere, tagColors]
  );

  const replaceTagColors = useCallback(
    (nextMap: TagColorsMap) => {
      persistEverywhere(normalizeTagColors(nextMap));
    },
    [persistEverywhere]
  );

  const value = useMemo<TagColorsContextValue>(
    () => ({ tagColors, getTagColor, setTagColor, replaceTagColors, refreshTagColors }),
    [tagColors, getTagColor, setTagColor, replaceTagColors, refreshTagColors]
  );

  return <TagColorsContext.Provider value={value}>{children}</TagColorsContext.Provider>;
};
