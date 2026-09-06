import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AlertPreset } from "@overlay/schema";
import { apiClient } from "../../../api/client";

const CREATOR_ID = "qal1215";

export interface AlertRow {
  id: string;
  creator_id: string;
  name: string;
  preset: AlertPreset;
  created_at: string;
  updated_at: string;
}

export function useAlerts() {
  return useQuery({
    queryKey: ["creator", CREATOR_ID, "alerts"],
    queryFn: () => apiClient.get<AlertRow[]>(`/api/admin/creator/${CREATOR_ID}/alerts`),
  });
}

export function useAlert(alertId: string) {
  return useQuery({
    queryKey: ["creator", CREATOR_ID, "alerts", alertId],
    queryFn: () => apiClient.get<AlertRow>(`/api/admin/creator/${CREATOR_ID}/alerts/${alertId}`),
    enabled: !!alertId,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; preset?: Partial<AlertPreset> }) =>
      apiClient.post<{ id: string }>(`/api/admin/creator/${CREATOR_ID}/alerts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "alerts"] });
    },
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; preset?: Partial<AlertPreset> } }) =>
      apiClient.patch(`/api/admin/creator/${CREATOR_ID}/alerts/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "alerts", variables.id] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) =>
      apiClient.delete(`/api/admin/creator/${CREATOR_ID}/alerts/${alertId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "alerts"] });
    },
  });
}
