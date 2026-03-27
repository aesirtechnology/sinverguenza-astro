import { defineMiddleware } from 'astro:middleware';
import { buildAzureLoginPath, getAdminAuthResult } from './lib/auth';

export const onRequest = defineMiddleware((context, next) => {
  context.locals.adminUser = null;
  context.locals.authDisabled = false;

  const pathname = context.url.pathname;

  if (!pathname.startsWith('/admin')) {
    return next();
  }

  const result = getAdminAuthResult(context.request);

  context.locals.adminUser = result.user;
  context.locals.authDisabled = result.authDisabled;

  if (result.status === 200) {
    return next();
  }

  if (result.status === 401) {
    const loginPath = buildAzureLoginPath(
      `${pathname}${context.url.search}`,
    );

    return Response.redirect(new URL(loginPath, context.url), 302);
  }

  return new Response(result.message ?? 'Unauthorized.', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
    status: result.status,
  });
});
