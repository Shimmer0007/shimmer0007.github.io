const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function encodePostSlug(slug: string): string {
  return slug
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

/** Build a deployment-aware path for a post, including nested content IDs. */
export function getPostUrl(slug: string): string {
  return `${baseUrl}posts/${encodePostSlug(slug)}/`;
}

/** Build the static JSON endpoint used to load a post body on demand. */
export function getPostContentUrl(slug: string): string {
  return `${baseUrl}post-content/${encodePostSlug(slug)}.json`;
}

export function getHomeUrl(): string {
  return baseUrl;
}

/** Open a post inside the interactive ShimmerOS reader. */
export function getPostInOsUrl(slug: string): string {
  return `${baseUrl}?post=${encodeURIComponent(slug)}`;
}
