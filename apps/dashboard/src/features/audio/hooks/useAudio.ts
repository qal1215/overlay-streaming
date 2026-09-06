import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, API_URL } from "../../../api/client";

const CREATOR_ID = "qal1215";

export interface AudioRow {
  id: string;
  creator_id: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
}

export function useAudioAssets() {
  return useQuery({
    queryKey: ["creator", CREATOR_ID, "audio"],
    queryFn: () => apiClient.get<AudioRow[]>(`/api/admin/creator/${CREATOR_ID}/audio`),
  });
}

export function useUploadAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`${API_URL}/api/admin/creator/${CREATOR_ID}/audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload audio");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "audio"] });
    },
  });
}

export function useDeleteAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (audioId: string) =>
      apiClient.delete(`/api/admin/creator/${CREATOR_ID}/audio/${audioId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator", CREATOR_ID, "audio"] });
    },
  });
}
