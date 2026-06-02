import { getDrepLastTabKey } from '@/lib/localStorage';
import { useRouter } from 'next/navigation';

export const useDRepNavigator = () => {
  const router = useRouter();

  const navigateToDRepWithLastTab = (resolvedDrepId: string | undefined) => {
    if (!resolvedDrepId) return;

    const drepTabStorageKey = getDrepLastTabKey(resolvedDrepId);
    const lastVisitedTab = localStorage.getItem(drepTabStorageKey) || 'profile';

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('DREP_LAST_TAB_') && key !== drepTabStorageKey) {
        localStorage.removeItem(key);
      }
    });

    localStorage.setItem(drepTabStorageKey, lastVisitedTab);

    const targetRoute =
      lastVisitedTab === 'profile'
        ? `/dreps/${resolvedDrepId}`
        : `/dreps/${resolvedDrepId}/${lastVisitedTab}`;

    router.push(targetRoute);
  };

  return navigateToDRepWithLastTab;
};
