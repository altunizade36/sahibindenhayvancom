import { useQuery } from "@tanstack/react-query";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar: string | null;
  city: string | null;
  bio: string | null;
  isVerified: boolean;
}

export function useUser() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
