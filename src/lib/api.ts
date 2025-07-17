export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await getErrorMsg(res));
  return res.json();
}

export async function apiPost<T>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMsg(res));
  return res.json();
}

export async function apiPut<T>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await getErrorMsg(res));
  return res.json();
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(await getErrorMsg(res));
  return res.json();
}

async function getErrorMsg(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.message || 'Erreur inconnue';
  } catch {
    return res.statusText || 'Erreur inconnue';
  }
} 