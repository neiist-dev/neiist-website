import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  requiredStatus?: string[];
  redirectTo?: string;
}

export function useAuthRedirect({
  requireAuth = true,
  requiredStatus = [],
  redirectTo = '/api/auth/login'
}: UseAuthRedirectOptions = {}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(redirectTo);
        return;
      }

      if (user && requiredStatus.length > 0 && !requiredStatus.includes(user.status)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, router, requireAuth, requiredStatus, redirectTo]);

  return { user, loading, isAuthorized: !loading && (!requireAuth || !!user) };
}
