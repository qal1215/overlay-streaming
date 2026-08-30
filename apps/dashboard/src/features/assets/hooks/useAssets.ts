import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import type { AssetDefinition } from "@overlay/schema";

const CREATOR_ID = "default_creator";

export function useAssets(type?: string) {
  return useQuery({
    queryKey: ["creator", CREATOR_ID, "assets", type],
    queryFn: () => {
      let url = `/api/admin/creator/${CREATOR_ID}/assets`;
      if (type && type !== "all") {
        url += `?type=${type}`;
      }
      return apiClient.get<AssetDefinition[]>(url);
    },
  });
}

export function useUploadAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
      metadata,
    }: {
      file: File;
      onProgress?: (progress: number) => void;
      metadata?: { width?: number; height?: number; duration?: number };
    }) => {
      return new Promise<AssetDefinition>((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        if (metadata?.width)
          formData.append("width", metadata.width.toString());
        if (metadata?.height)
          formData.append("height", metadata.height.toString());
        if (metadata?.duration)
          formData.append("duration", metadata.duration.toString());

        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `http://localhost:8787/api/admin/creator/${CREATOR_ID}/assets`,
        );

        if (onProgress) {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded * 100) / e.total);
              onProgress(progress);
            }
          });
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            let err = "Upload failed";
            try {
              err = JSON.parse(xhr.responseText).error || err;
            } catch (e) {}
            reject(new Error(err));
          }
        };

        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["creator", CREATOR_ID, "assets"],
      });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assetId: string) =>
      apiClient.delete(`/api/admin/creator/${CREATOR_ID}/assets/${assetId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["creator", CREATOR_ID, "assets"],
      });
    },
  });
}
