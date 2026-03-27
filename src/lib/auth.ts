import { Buffer } from 'node:buffer';
import { ApiError } from './api';

export interface AdminUser {
  email: string;
  identityProvider: string;
  roles: string[];
  userId: string;
}

interface ClientPrincipal {
  identityProvider?: string;
  userDetails?: string;
  userId?: string;
  userRoles?: string[];
}

interface AdminAuthResult {
  authDisabled: boolean;
  message?: string;
  status: 200 | 401 | 403 | 500;
  user: AdminUser | null;
}

const DEFAULT_LOGIN_PATH = '/.auth/login/aad';

function isAuthDisabled(): boolean {
  return import.meta.env.AUTH_DISABLED?.toLowerCase() === 'true';
}

function getAllowedAdminEmails(): Set<string> {
  const rawEmails = import.meta.env.ADMIN_EMAILS ?? '';
  const emails = rawEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set(emails);
}

function decodeClientPrincipal(value: string): ClientPrincipal | null {
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf-8');
    return JSON.parse(decoded) as ClientPrincipal;
  } catch {
    return null;
  }
}

function getRequestEmail(request: Request, principal: ClientPrincipal | null): string {
  const headerEmail = request.headers.get('x-ms-client-principal-name');

  return (headerEmail ?? principal?.userDetails ?? '').trim().toLowerCase();
}

function buildLocalAdminUser(): AdminUser {
  return {
    email: 'local-admin@sinverguenza.dev',
    identityProvider: 'local-dev',
    roles: ['authenticated', 'admin'],
    userId: 'local-admin',
  };
}

export function getAdminAuthResult(request: Request): AdminAuthResult {
  if (isAuthDisabled()) {
    return {
      authDisabled: true,
      status: 200,
      user: buildLocalAdminUser(),
    };
  }

  const allowedEmails = getAllowedAdminEmails();

  if (allowedEmails.size === 0) {
    return {
      authDisabled: false,
      message: 'ADMIN_EMAILS is required when auth is enabled.',
      status: 500,
      user: null,
    };
  }

  const principalHeader = request.headers.get('x-ms-client-principal');
  const principal = principalHeader
    ? decodeClientPrincipal(principalHeader)
    : null;
  const email = getRequestEmail(request, principal);

  if (!email) {
    return {
      authDisabled: false,
      message: 'Authentication required.',
      status: 401,
      user: null,
    };
  }

  if (!allowedEmails.has(email)) {
    return {
      authDisabled: false,
      message: 'Your account is not authorized for the admin dashboard.',
      status: 403,
      user: null,
    };
  }

  return {
    authDisabled: false,
    status: 200,
    user: {
      email,
      identityProvider: principal?.identityProvider ?? 'unknown',
      roles: principal?.userRoles ?? ['authenticated'],
      userId: principal?.userId ?? email,
    },
  };
}

export function requireAdminRequest(request: Request): AdminUser {
  const result = getAdminAuthResult(request);

  if (result.status !== 200 || !result.user) {
    throw new ApiError(result.status, result.message ?? 'Forbidden.');
  }

  return result.user;
}

export function buildAzureLoginPath(currentPath: string): string {
  const redirectUri = encodeURIComponent(currentPath);
  return `${DEFAULT_LOGIN_PATH}?post_login_redirect_uri=${redirectUri}`;
}
