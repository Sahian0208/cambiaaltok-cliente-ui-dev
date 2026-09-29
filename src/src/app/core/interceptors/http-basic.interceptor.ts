import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';

export const httpBasicInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const omitRequests = [
    '/.well-known/openid-configuration',
    '/.well-known/jwks',
    '/connect/userinfo',
    '/connect/token',
  ];

  const oauthAllowedRequest = omitRequests.some((path) =>
    request.url.includes(path),
  );

  if (oauthAllowedRequest) {
    return next(request);
  }

  const token = sessionStorage.getItem('current_token');

  if (!token) {
    return next(request);
  }

  const authRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authRequest);
};
