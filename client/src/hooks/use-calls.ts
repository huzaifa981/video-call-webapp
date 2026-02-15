import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Call, InsertCall } from "@shared/schema";

export function useCalls() {
  return useQuery<Call[]>({
    queryKey: ["/api/calls"],
    queryFn: async () => {
      const res = await fetch("/api/calls", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch calls");
      return await res.json();
    },
  });
}

export function useCreateCall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertCall) => {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create call record");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
    },
  });
}
