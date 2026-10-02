const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}

let accessToken: string | null = null;

function csrfToken(): string {
  if (typeof document === 'undefined') return '';
  const cookie = document.cookie.split('; ').find((part) => part.startsWith('bncc_csrf='));
  return cookie ? decodeURIComponent(cookie.slice('bncc_csrf='.length)) : '';
}

function store(response: AuthResponse): AuthResponse {
  accessToken = response.accessToken;
  return response;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Não foi possível entrar. Confira as credenciais.');
  return store((await response.json()) as AuthResponse);
}

export async function refresh(): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRF-Token': csrfToken() },
  });
  if (!response.ok) {
    clearAccessToken();
    throw new Error('Sessão expirada. Entre novamente.');
  }
  return store((await response.json()) as AuthResponse);
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': csrfToken() },
    });
  } finally {
    clearAccessToken();
  }
}
