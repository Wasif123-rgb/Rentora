import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiRequest } from "../services/api";

export type UserRole = "tenant" | "manager";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => void;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
    passwordConfirmation: string,
    role: UserRole
  ) => Promise<User>;
  logout: () => Promise<void>;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user: User;
  errors?: Record<string, string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /*
   * Restore authentication after browser refresh.
   */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest<{ success: boolean; user: User }>("/user")
      .then((response) => {
        setUser(response.user);

        localStorage.setItem(
          "auth_user",
          JSON.stringify(response.user)
        );
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /*
   * Normal email/password login.
   */
  async function login(
    email: string,
    password: string
  ): Promise<User> {
    const response = await apiRequest<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.token) {
      throw {
        status: 500,
        data: {
          message: "Authentication token was not returned.",
        },
      };
    }

    localStorage.setItem("auth_token", response.token);

    localStorage.setItem(
      "auth_user",
      JSON.stringify(response.user)
    );

    setUser(response.user);

    return response.user;
  }

  /*
   * Start Google OAuth authentication.
   *
   * The browser is redirected to Laravel.
   * Laravel then redirects to Google.
   */
  function loginWithGoogle(): void {
    window.location.href =
      "/api/auth/google";
  }

  /*
   * Register using Laravel API.
   */
  async function register(
    name: string,
    email: string,
    phone: string,
    password: string,
    passwordConfirmation: string,
    role: UserRole
  ): Promise<User> {
    const response = await apiRequest<AuthResponse>("/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation,
        role,
      }),
    });

    return response.user;
  }

  /*
   * Logout from Laravel and clear local authentication.
   */
  async function logout(): Promise<void> {
    try {
      await apiRequest("/logout", {
        method: "POST",
      });
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}