import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  // 304 Not Modified is OK - browser will use cached response
  if (!res.ok && res.status !== 304) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Helper to serialize query key into a URL with query parameters
function serializeQueryKey(queryKey: readonly unknown[]): string {
  if (queryKey.length === 0) return "/";
  
  // First element should be the base URL string
  const baseUrl = String(queryKey[0]);
  
  // If there's only one element or no additional params, return as is
  if (queryKey.length === 1) return baseUrl;
  
  // Check if there are object params to serialize
  const params = new URLSearchParams();
  for (let i = 1; i < queryKey.length; i++) {
    const item = queryKey[i];
    
    // If it's a plain object, add its entries as query params
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.entries(item).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle arrays by appending as comma-separated string (backend parses this)
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.append(key, value.join(','));
            }
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
  }
  
  // Append query params if any
  const paramString = params.toString();
  if (paramString) {
    return baseUrl.includes('?') 
      ? `${baseUrl}&${paramString}` 
      : `${baseUrl}?${paramString}`;
  }
  
  return baseUrl;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = serializeQueryKey(queryKey);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - allow refetch for fresh data
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
