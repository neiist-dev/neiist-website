import { NextRequest, NextResponse } from 'next/server';

// Routes requiring authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/thesismaster',
  '/mag',
  '/collab'
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
const collabRoutes = ['/collab'];
const memberRoutes = ['/thesismaster'];

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

    // Admin can access everything
    if (isAdmin) {
      return NextResponse.next();
    }

    // Admin routes: only admins can access
    if (adminRoutes.some(r => path.startsWith(r)) && !isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Collab routes: only collabs and admins can access
    if (collabRoutes.some(r => path.startsWith(r)) && !isCollab) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // For collaborators: can access /collab + everything members can access
    if (isCollab && !isAdmin) {
      const canAccessCollabRoute = collabRoutes.some(r => path.startsWith(r));
      const canAccessMemberRoute = memberRoutes.some(r => path.startsWith(r));
      
      if (!isPublicRoute && !canAccessCollabRoute && !canAccessMemberRoute) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // For regular members: only allow public routes and /thesismaster
    if (isMember && !isCollab && !isAdmin) {
      const canAccessMemberRoute = memberRoutes.some(r => path.startsWith(r));

      if (!isPublicRoute && !canAccessMemberRoute) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // For non-members who are authenticated but not collab/admin
    if (!isMember && !isCollab && !isAdmin) {
      if (!isPublicRoute) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'
  ],
};