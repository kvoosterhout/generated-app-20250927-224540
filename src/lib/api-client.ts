import { ApiResponse } from "@shared/types";
import { useAuth } from "@/hooks/useAuth";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuth.getState().token;
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    useAuth.getState().logout();
    throw new Error('Unauthorized');
  }
  const json = (await res.json()) as ApiResponse<T>;
  if (json.success) {
    if (json.data === undefined) {
      // This can happen for successful DELETE requests that return no data
      return null as T;
    }
    return json.data;
  } else {
    // This is a type guard for the failure case
    const errorResponse = json as { success: false; error: string };
    throw new Error(errorResponse.error || 'Request failed');
  }
}