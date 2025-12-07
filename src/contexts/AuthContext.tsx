import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type User = {
  id: string;
  name: string;
  role: "operator" | "supervisor" | "admin";
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Pretend to load a session from storage / API
  useEffect(() => {
    // In future: call real backend /localStorage here
    setLoading(false);
  }, []);

  async function loginAsDemo() {
    setUser({
      id: "demo-operator",
      name: "Demo Operator",
      role: "operator",
    });
  }

  async function logout() {
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      loginAsDemo,
      logout,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
