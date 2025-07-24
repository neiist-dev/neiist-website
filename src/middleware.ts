import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/user';

const publicRoutes = ['/', '/home', '/about-us', '/blog'];
const guestRoutes = ['/profile', '/my-orders'];
const memberRoutes = ['/orders'];
const coordRoutes = ['/team'];
const adminRoutes = ['/admin'];

const protectedRoutes = [
  ...guestRoutes,
  ...memberRoutes,
  ...coordRoutes,
  ...adminRoutes,
];

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'
  ],
};

function canAccess(path: string, roles: UserRole[]) {
  if (path === '/' || publicRoutes.slice(1).some(r => path.startsWith(r))) {
    return true;
  }
  if (adminRoutes.some(r => path.startsWith(r))) {
    return roles.includes(UserRole.ADMIN);
  } else if (coordRoutes.some(r => path.startsWith(r))) {
    return roles.some(role => [UserRole.ADMIN, UserRole.COORDINATOR].includes(role));
  } else if (memberRoutes.some(r => path.startsWith(r))) {
    return roles.some(role => [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER].includes(role));
  } else if (guestRoutes.some(r => path.startsWith(r))) {
    return roles.some(role => [UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER, UserRole.GUEST].includes(role));
  }
  return false;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const accessToken = req.cookies.get('accessToken')?.value;
  const isAuthenticated = !!accessToken;

  if (!isAuthenticated && protectedRoutes.some(r => path.startsWith(r))) {
    return NextResponse.redirect(new URL('/api/auth/login', req.url));
  }

  if (isAuthenticated) {
    const userDataCookie = req.cookies.get('userData')?.value;
    let userData;
    try {
      userData = userDataCookie ? JSON.parse(userDataCookie) : null;
    } catch {
      userData = null;
    }
    const roles = userData?.roles || [UserRole.GUEST];

    if (!canAccess(path, roles)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
}
