import type { AlertDefinition } from "@overlay/schema";

const API_BASE = "http://localhost:8787/api/admin/creator/default_creator/alerts";

export async function fetchAlerts(): Promise<AlertDefinition[]> {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function fetchAlert(alertId: string): Promise<AlertDefinition> {
  const res = await fetch(`${API_BASE}/${alertId}`);
  if (!res.ok) throw new Error("Failed to fetch alert");
  return res.json();
}

export async function createAlert(data: Partial<AlertDefinition>): Promise<{ id: string }> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create alert");
  return res.json();
}

export async function updateAlert({ id, data }: { id: string; data: Partial<AlertDefinition> }): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update alert");
}

export async function deleteAlert(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete alert");
}
