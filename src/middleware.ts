import { NextRequest, NextResponse } from 'next/server';

// Routes requiring authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/admin',
  '/members',
  '/collaborators',
  '/thesismaster',
  '/mag'
];

// Public routes - accessible to all users
const publicRoutes = [
  '/',
  '/home',
  '/about',
  '/studented',
  '/user'
];

const adminRoutes = ['/admin'];
const collabRoutes = ['/collaborators'];
const memberRoutes = ['/members'];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  const accessToken = req.cookies.get('accessToken')?.value;
  const isAuthenticated = !!accessToken;

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/api/auth/login', req.url));
  }

  if (isAuthenticated && isProtectedRoute) {
    const userDataCookie = req.cookies.get('userData')?.value;
    if (!userDataCookie) {
      return NextResponse.next();
    }

    let userData;
    try {
      userData = JSON.parse(userDataCookie);
    } catch {
      return NextResponse.next();
    }

    const isAdmin = userData.isAdmin;
    const isCollab = userData.isCollab || userData.isAdmin;
    const isMember = ['Member', 'Collaborator', 'Admin'].includes(userData.status);

    // Admin routes: only admins can access
    if (adminRoutes.some(r => path.startsWith(r)) && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Admin can access everything else
    if (isAdmin) {
      return NextResponse.next();
    }

    // Check collaborator routes
    if (collabRoutes.some(r => path.startsWith(r)) && !isCollab) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Check member routes
    if (memberRoutes.some(r => path.startsWith(r)) && !isMember) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Regular users can access their profile and public pages
    if (!isCollab && !path.startsWith('/user') && !isPublicRoute && !path.startsWith('/profile')) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'
  ],
};