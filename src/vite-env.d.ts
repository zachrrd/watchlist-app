interface ImportMetaEnv {
  readonly VITE_NEON_AUTH_URL: string;
  readonly VITE_NEON_DATA_API_URL: string;
  readonly VITE_IMAGEKIT_URL_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}