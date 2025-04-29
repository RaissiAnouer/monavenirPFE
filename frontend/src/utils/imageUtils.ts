/**
 * Utility function to get the full URL for an image
 * @param imagePath The image path from the server
 * @returns The full URL for the image
 */
export const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return getPlaceholderImage();

  // If the path already includes the base URL, return it as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // If the path starts with /uploads, prepend the API base URL
  if (imagePath.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}${imagePath}`;
  }

  // If none of the above conditions match, return placeholder
  return getPlaceholderImage();
};

/**
 * Returns a base64 encoded placeholder image
 * @returns A data URL for a placeholder image
 */
export const getPlaceholderImage = (): string => {
  return '/placeholder-course.jpg'; // Make sure this placeholder image exists in your public folder
};

/**
 * Utility function to fix any resource URL (images, videos, documents)
 * @param url The resource URL from the server
 * @returns The fixed URL
 */
export const fixResourceUrl = (url: string): string => {
  if (!url) return '';
  
  // If it's already an absolute URL, return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative URL, prepend the API base URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
  // Ensure there's no double slash between baseUrl and url
  const baseWithoutTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const urlWithoutLeadingSlash = url.startsWith('/') ? url.slice(1) : url;
  
  return `${baseWithoutTrailingSlash}/${urlWithoutLeadingSlash}`;
}; 