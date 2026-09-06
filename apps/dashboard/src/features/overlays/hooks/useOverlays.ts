import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OverlayDefinition, OverlayRuntimeState } from "@overlay/schema";
import { apiClient } from "../../../api/client";

const CREATOR_ID = "qal1215";

export function useOverlays() {
  return useQuery({
    queryKey: ["creator", CREATOR_ID, "overlays"],
    queryFn: () => apiClient.get<OverlayDefinition[]>(`/api/admin/creator/${CREATOR_ID}/overlays`),
  });
}

export function useOverlay(overlayId: string) {
  return useQuery({
    queryKey: ["creator", CREATOR_ID, "overlays", overlayId],
    queryFn: () => apiClient.get<OverlayRuntimeState>(`/api/admin/creator/${CREATOR_ID}/overlays/${overlayId}`),
    enabled: !!overlayId,
  });
}

export function useCreateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; width?: number; height?: number }) =>
      apiClient.post<{ id: string }>(`/api/admin/creator/${CREATOR_ID}/overlays`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "overlays"] });
    },
  });
}

export function useUpdateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OverlayDefinition> }) =>
      apiClient.patch(`/api/admin/creator/${CREATOR_ID}/overlays/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "overlays"] });
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "overlays", variables.id] });
    },
  });
}

export function useDeleteOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (overlayId: string) =>
      apiClient.delete(`/api/admin/creator/${CREATOR_ID}/overlays/${overlayId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "overlays"] });
    },
  });
}

export function useDuplicateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (overlayId: string) =>
      apiClient.post<{ id: string }>(`/api/admin/creator/${CREATOR_ID}/overlays/${overlayId}/duplicate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "overlays"] });
    },
  });
}

export function useActivateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (overlayId: string) =>
      apiClient.post<{ success: boolean }>(`/api/admin/creator/${CREATOR_ID}/overlays/${overlayId}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "overlays"] });
    },
  });
}

export function useDeactivateOverlay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (overlayId: string) =>
      apiClient.post<{ success: boolean }>(`/api/admin/creator/${CREATOR_ID}/overlays/${overlayId}/deactivate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "overlays"] });
    },
  });
}
