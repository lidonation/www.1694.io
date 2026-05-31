import { getDrepLastTabKey } from '@/lib/localStorage';
import { convertHexToCIP129 } from '@/lib';
import { useRouter } from 'next/navigation';

export const useDRepNavigator = () => {
  const router = useRouter();

  const navigateToDRepWithLastTab = (
    hasScript: boolean | undefined,
    chainId: string | undefined,
  ) => {
    const resolvedDrepId = convertHexToCIP129(hasScript, chainId);
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
