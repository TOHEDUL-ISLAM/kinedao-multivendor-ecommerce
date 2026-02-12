import { env } from "@/lib/env";

const normalizeOrigin = (value: string) => value.replace(/\/+$/, "");

const toAdminPath = (path: string) => {
  if (!path) return "/admin/login";
  return path.startsWith("/") ? path : `/${path}`;
};

export const adminFrontendOrigin = env.VITE_ADMIN_FRONTEND_URL
  ? normalizeOrigin(env.VITE_ADMIN_FRONTEND_URL)
  : null;

export const getAdminPortalHref = (path: string = "/admin/login") => {
  const adminPath = toAdminPath(path);
  if (!adminFrontendOrigin) {
    return adminPath;
  }
  return `${adminFrontendOrigin}${adminPath}`;
};

export const redirectToAdminPortalIfNeeded = (path?: string) => {
  if (!adminFrontendOrigin || typeof window === "undefined") {
    return false;
  }

  const currentOrigin = normalizeOrigin(window.location.origin);
  if (currentOrigin === adminFrontendOrigin) {
    return false;
  }

  const targetPath = toAdminPath(
    path ?? `${window.location.pathname}${window.location.search}${window.location.hash}`
  );
  window.location.href = `${adminFrontendOrigin}${targetPath}`;
  return true;
};
