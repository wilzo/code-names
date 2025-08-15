// Serviço de autenticação
export interface User {
  id: string;
  email: string;
  nome?: string;
}

export interface LoginResponse {
  token: string;
  usuario: User;
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch("http://localhost:3001/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch (jsonError) {
      console.error("Erro ao parsear resposta JSON:", jsonError);
      throw new Error("Erro de comunicação com o servidor");
    }

    if (error.requiresEmailConfirmation) {
      throw new Error(
        "Email não confirmado. Verifique sua caixa de entrada e confirme o email antes de fazer login."
      );
    }

    throw new Error(error.error || "Erro ao fazer login");
  }

  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    console.error("Erro ao parsear resposta de sucesso:", jsonError);
    throw new Error("Erro de comunicação com o servidor");
  }

  return data;
};

export const logout = (): void => {
  try {
    localStorage.removeItem("supabase.auth.token");
    localStorage.removeItem("user");
    localStorage.removeItem("session");
    localStorage.removeItem("refreshToken");

    window.location.href = "/login";

    console.log("Logout realizado com sucesso");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    window.location.href = "/login";
  }
};

export const isAuthenticated = (): boolean => {
  try {
    const token = localStorage.getItem("supabase.auth.token");
    const user = localStorage.getItem("user");

    return !!(token && user);
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return false;
  }
};

export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem("supabase.auth.token");
  } catch (error) {
    console.error("Erro ao obter token:", error);
    return null;
  }
};

export const isTokenExpired = (): boolean => {
  try {
    const token = getToken();
    if (!token) return true;

    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    return payload.exp < currentTime;
  } catch (error) {
    console.error("Erro ao verificar expiração do token:", error);
    return true;
  }
};

export const refreshSession = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    return false;
  } catch (error) {
    console.error("Erro ao renovar sessão:", error);
    return false;
  }
};
