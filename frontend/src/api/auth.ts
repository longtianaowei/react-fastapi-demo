import request from "@/utils/request";

export interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

export async function login(email: string, password: string) {
  const tokens = await request.post<TokenData>("/auth/login", { email, password });
  request.setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export function me() {
  return request.get<CurrentUser>("/auth/me");
}

export async function logout() {
  const refreshToken = window.localStorage.getItem("refresh_token");

  try {
    if (refreshToken) {
      await request.post<null>("/auth/logout", { refresh_token: refreshToken });
    }
  } finally {
    request.clearTokens();
  }
}
