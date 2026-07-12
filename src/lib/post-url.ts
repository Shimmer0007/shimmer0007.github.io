const baseUrl = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** Build a deployment-aware path for a post, including nested content IDs. */
export function getPostUrl(slug: string): string {
  const encodedSlug = slug
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `${baseUrl}posts/${encodedSlug}/`;
}

export function getHomeUrl(): string {
  return baseUrl;
}

/** Open a post inside the interactive ShimmerOS reader. */
export function getPostInOsUrl(slug: string): string {
  return `${baseUrl}?post=${encodeURIComponent(slug)}`;
}
