import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreatorConfig } from "@overlay/schema";
import { apiClient } from "../../../api/client";

const CREATOR_ID = "default_creator"; // Hardcoded for now

export function useCreatorConfig() {
  return useQuery({
    queryKey: ["creator", CREATOR_ID, "config"],
    queryFn: () => apiClient.get<CreatorConfig>(`/api/admin/creator/${CREATOR_ID}/config`),
  });
}

export function useUpdateCreatorConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<CreatorConfig>) => 
      apiClient.put(`/api/admin/creator/${CREATOR_ID}/config`, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "config"] });
    },
  });
}

export function useTestAlert() {
  return useMutation({
    mutationFn: (theme: string) => 
      apiClient.post(`/api/admin/creator/${CREATOR_ID}/test-alert`, { theme }),
  });
}
