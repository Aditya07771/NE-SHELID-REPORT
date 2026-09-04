import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/sync';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        console.log('[Network] System came ONLINE. Triggering auto-sync...');
        syncManager.syncAllPending();
      };

      const handleOffline = () => {
        setIsOnline(false);
        console.log('[Network] System went OFFLINE.');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return isOnline;
}
