import { getJwtToken } from "../lib/get-jwt";

export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

export interface ImageKitUploadResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  size: number;
  filePath: string;
}

export type ImageKitFolder =
  | "/watchlist-app/posters"
  | "/watchlist-app/backdrops";

/**
 * Request ImageKit upload authentication parameters from the backend.
 * Uses the authenticated Neon Auth JWT retrieved via neon.auth.getSession().
 */
export async function getImageKitAuthParams(): Promise<ImageKitAuthResponse> {
  const jwt = await getJwtToken();
  if (!jwt) {
    throw new Error("User must be authenticated to upload images.");
  }

  const response = await fetch("/api/imagekit-auth", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to get upload authorization (HTTP ${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Use fallback error message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Upload an image directly from the browser to ImageKit.
 * Strictly uses frontend-safe credentials; never touches private keys.
 */
export async function uploadImageToImageKit(
  file: File,
  folder: ImageKitFolder = "/watchlist-app/posters",
): Promise<ImageKitUploadResult> {
  const authParams = await getImageKitAuthParams();

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "fileName",
    `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
  );
  formData.append("publicKey", authParams.publicKey);
  formData.append("signature", authParams.signature);
  formData.append("expire", String(authParams.expire));
  formData.append("token", authParams.token);
  formData.append("folder", folder);

  const uploadResponse = await fetch(
    "https://upload.imagekit.io/api/v1/files/upload",
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    let errorMessage = `Image upload failed (HTTP ${uploadResponse.status})`;
    try {
      const errorData = await uploadResponse.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Use fallback
    }
    throw new Error(errorMessage);
  }

  return uploadResponse.json();
}

/**
 * Delete a single image from ImageKit via the secure serverless backend.
 * Uses authenticated Neon Auth JWT and requires verified show ownership.
 */
export async function deleteImageFromImageKit(
  fileId: string,
  showId?: string,
): Promise<{ success: boolean; fileId: string; status?: string }> {
  const trimmed = fileId ? fileId.trim() : "";
  if (!trimmed) {
    return { success: true, fileId: "" };
  }

  const jwt = await getJwtToken();
  if (!jwt) {
    throw new Error("User must be authenticated to delete images.");
  }

  const payload: { fileId: string; showId?: string } = { fileId: trimmed };
  if (showId) {
    payload.showId = showId;
  }

  const response = await fetch("/api/imagekit-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Failed to delete image (HTTP ${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) {
        errorMessage = data.error;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  return result;
}

/**
 * Delete multiple images from ImageKit in a single serverless batch call.
 * Uses authenticated Neon Auth JWT and requires verified show ownership.
 */
export async function deleteImagesFromImageKit(
  fileIds: (string | undefined | null)[],
  showId?: string,
): Promise<{ success: boolean; count: number }> {
  const validIds = fileIds
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    .map((id) => id.trim());

  if (validIds.length === 0) {
    return { success: true, count: 0 };
  }

  const jwt = await getJwtToken();
  if (!jwt) {
    throw new Error("User must be authenticated to delete images.");
  }

  const payload: { fileIds: string[]; showId?: string } = { fileIds: validIds };
  if (showId) {
    payload.showId = showId;
  }

  const response = await fetch("/api/imagekit-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Failed to delete images (HTTP ${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) {
        errorMessage = data.error;
      }
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
