import {
  createContext,
  useContext,
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
  // Start with loading=false since we have no async init yet
  // When real auth is added, initialize to true and set false in callback
  const [loading] = useState(false);

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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
