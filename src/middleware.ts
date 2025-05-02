import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('accessToken');

  if (!token) {
    const loginUrl = new URL('/api/auth/login', req.nextUrl.origin); // Redirect to login
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/user', '/thesismaster', '/admin', '/collab', '/mag']
};