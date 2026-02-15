import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
    refetchInterval: 5000, // Poll for online status updates
  });
}

export function useUserById(id: number) {
  return useQuery<User>({
    queryKey: ["/api/users", id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    enabled: !!id,
  });
}
