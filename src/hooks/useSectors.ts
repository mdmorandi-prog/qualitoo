import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Sector {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  grid_row: number | null;
  grid_col: number | null;
  is_active: boolean;
  sort_order: number;
}

let cache: Sector[] | null = null;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(fn => fn());

export const invalidateSectorsCache = () => {
  cache = null;
  notify();
};

async function fetchSectors(): Promise<Sector[]> {
  const { data, error } = await supabase
    .from("sectors")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) {
    console.error("Failed to load sectors", error);
    return [];
  }
  return (data ?? []) as Sector[];
}

/**
 * Returns sectors from the central table. Includes cache + refetch.
 * Pass `activeOnly` to filter out disabled sectors (default true).
 */
export function useSectors(activeOnly = true) {
  const [sectors, setSectors] = useState<Sector[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchSectors();
    cache = data;
    setSectors(data);
    setLoading(false);
    notify();
  }, []);

  useEffect(() => {
    if (cache === null) {
      load();
    } else {
      setSectors(cache);
    }
    const listener = () => setSectors(cache ?? []);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, [load]);

  const filtered = activeOnly ? sectors.filter(s => s.is_active) : sectors;
  return { sectors: filtered, allSectors: sectors, loading, refetch: load };
}
