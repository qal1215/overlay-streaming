import type { AlertDefinition } from "@overlay/schema";

import { apiClient } from "../../../api/client";
const API_BASE = `/api/admin/creator/qal1215/alerts`;

export async function fetchAlerts(): Promise<AlertDefinition[]> {
  return apiClient.get<AlertDefinition[]>(API_BASE);
}

export async function fetchAlert(alertId: string): Promise<AlertDefinition> {
  return apiClient.get<AlertDefinition>(`${API_BASE}/${alertId}`);
}

export async function createAlert(data: Partial<AlertDefinition>): Promise<{ id: string }> {
  return apiClient.post<{ id: string }>(API_BASE, data);
}

export async function updateAlert({ id, data }: { id: string; data: Partial<AlertDefinition> }): Promise<void> {
  return apiClient.patch<void>(`${API_BASE}/${id}`, data);
}

export async function deleteAlert(id: string): Promise<void> {
  return apiClient.delete<void>(`${API_BASE}/${id}`);
}
