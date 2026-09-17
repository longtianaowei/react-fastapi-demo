import request from "@/utils/request";

export interface TokenData {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  roles?: string[];
  permissions?: string[];
}

export async function login(email: string, password: string) {
  const tokens = await request.post<TokenData>("/auth/login", { email, password });
  request.setTokens(tokens.access_token);
  return tokens;
}

export function me() {
  return request.get<CurrentUser>("/auth/me");
}

export async function restoreSession() {
  const tokens = await request.post<TokenData>("/auth/refresh");
  request.setTokens(tokens.access_token);
  return me();
}

export async function logout() {
  try {
    await request.post<null>("/auth/logout");
  } finally {
    request.clearTokens();
  }
}
