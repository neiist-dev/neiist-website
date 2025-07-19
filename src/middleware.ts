import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from './types/user';

const publicRoutes = ['/', '/home', '/about-us'];
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
  if (roles.includes(UserRole.ADMIN) || publicRoutes.some(r => path.startsWith(r))) {
    return true;
  } else if (guestRoutes.some(r => path.startsWith(r))) {
    return roles.some(role => [UserRole.GUEST].includes(role));
  } else if (memberRoutes.some(r => path.startsWith(r))) {
    return roles.some(role => [UserRole.MEMBER].includes(role));
  } else if (coordRoutes.some(r => path.startsWith(r))) {
    return roles.includes(UserRole.COORDINATOR);
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
    const role = userData?.role || 'guest';

    if (!canAccess(path, role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
}
