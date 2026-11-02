import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";

import {
  fetchCurrentSession,
  logoutAccount,
  updateCsrfToken,
  type AuthSession,
} from "../../lib/api.js";

const authQueryKey = ["auth-session"] as const;
const AuthContext = createContext<{
  session: AuthSession | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  logout: () => Promise<void>;
}>({
  session: null,
  isLoading: true,
  error: null,
  refresh: () => undefined,
  logout: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentSession,
    retry: false,
    staleTime: 60_000,
  });
  const session = query.data ?? null;
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    updateCsrfToken(session?.csrfToken ?? null);
  }, [session?.csrfToken]);

  useEffect(() => {
    const currentUserId = session?.user.id ?? null;
    if (previousUserId.current && previousUserId.current !== currentUserId) {
      queryClient.removeQueries({ queryKey: ["cv-documents"] });
      queryClient.removeQueries({ queryKey: ["cv-document"] });
    }
    previousUserId.current = currentUserId;
  }, [queryClient, session?.user.id]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: authQueryKey });
  };

  async function logout() {
    await logoutAccount();
    queryClient.setQueryData(authQueryKey, null);
    queryClient.removeQueries({ queryKey: ["cv-documents"] });
    queryClient.removeQueries({ queryKey: ["cv-document"] });
  }

  const error =
    query.error && "status" in query.error && query.error.status === 401
      ? null
      : (query.error ?? null);

  return (
    <AuthContext.Provider
      value={{ session, isLoading: query.isPending, error, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
