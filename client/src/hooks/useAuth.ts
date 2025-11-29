import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

async function fetchUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/user", {
      credentials: "include",
    });
    
    if (res.status === 401) {
      return null;
    }
    
    if (!res.ok) {
      return null;
    }
    
    return await res.json();
  } catch {
    return null;
  }
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  };
}
