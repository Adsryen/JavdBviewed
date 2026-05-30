export interface JavdbSearchResult {
  href: string;
  title: string;
}

export interface JavdbDetailMetadata {
  releaseDate?: string;
  tags: string[];
  javdbImage?: string;
}

export interface CloudflareVerificationResult {
  success: boolean;
  error?: string;
  html?: string;
}
