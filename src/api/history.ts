const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8765';

export async function fetchHistory(): Promise<HistoryEntryDTO[]> {
  const res = await fetch(`${API_URL}/api/history`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.entries || [];
}

export async function postHistory(entry: HistoryEntryDTO): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
  } catch {
    return null;
  }
}

export async function deleteHistoryEntry(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/history/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearAllHistory(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/history`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface HistoryEntryDTO {
  id?: string;
  timestamp?: number;
  chain: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summary: any;
}
