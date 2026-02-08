const CALLBACK_URL_KEY = "kineDao_auth_callback";

/**
 * Get callback URL from URL params or sessionStorage
 * @returns The callback URL or null if not found
 */
export function getCallbackURL(): string | null {
  // First, try to get from URL params
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const callbackFromParams = params.get("callback");

    if (callbackFromParams) {
      return decodeURIComponent(callbackFromParams);
    }

    // Fallback to sessionStorage
    try {
      return sessionStorage.getItem(CALLBACK_URL_KEY);
    } catch {
      // Session storage not available (private mode, etc.)
      return null;
    }
  }

  return null;
}

/**
 * Store callback URL in sessionStorage
 * @param url - The URL to store
 */
export function setCallbackURL(url: string): void {
  if (typeof window !== "undefined") {
    try {
      // Validate URL is same origin
      const urlObj = new URL(url, window.location.origin);
      if (urlObj.origin === window.location.origin) {
        sessionStorage.setItem(CALLBACK_URL_KEY, url);
      }
    } catch {
      // Invalid URL, ignore
    }
  }
}

/**
 * Clear callback URL from sessionStorage
 */
export function clearCallbackURL(): void {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(CALLBACK_URL_KEY);
    } catch {
      // Session storage not available
    }
  }
}

/**
 * Smart redirect after successful login
 * Uses callback URL if available, otherwise uses default path
 * @param defaultPath - Default path to redirect to if no callback URL
 */
export function redirectWithCallback(defaultPath: string = "/"): void {
  if (typeof window !== "undefined") {
    const callbackURL = getCallbackURL();

    if (callbackURL) {
      // Validate callback URL to prevent infinite loops and external redirects
      try {
        const urlObj = new URL(callbackURL, window.location.origin);

        // Prevent redirecting back to login or auth pages
        if (
          urlObj.pathname === "/login" ||
          urlObj.pathname.startsWith("/auth")
        ) {
          window.location.href = defaultPath;
        } else if (urlObj.origin === window.location.origin) {
          window.location.href = callbackURL;
        } else {
          window.location.href = defaultPath;
        }
      } catch {
        window.location.href = defaultPath;
      } finally {
        clearCallbackURL();
      }
    } else {
      window.location.href = defaultPath;
    }
  }
}

/**
 * Check if a route requires authentication
 * @param path - The path to check
 * @returns True if the route is protected
 */
export function isProtectedRoute(path: string): boolean {
  const protectedPaths = [
    "/dashboard",
    "/profile",
    "/orders",
    "/account",
    // Add more protected routes as needed
  ];

  return protectedPaths.some((protectedPath) =>
    path.startsWith(protectedPath)
  );
}

/**
 * Get current path without query params
 * @returns Current pathname
 */
export function getCurrentPath(): string {
  if (typeof window !== "undefined") {
    return window.location.pathname;
  }
  return "/";
}
