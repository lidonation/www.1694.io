'use client';
import QueryProvider from './queryClientProvider';
import { GlobalNotificationsProvider } from './globalNotificationContext';
import { GlobalProvider } from './globalContext';
import { AuthProvider } from './authContext';
import { useEffect, useRef } from 'react';
import { initializeAuthentication } from '../auth/initAuth';

function AuthInitializer({ children }) {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      initializeAuthentication();
      isInitialized.current = true;
    }
  }, []);

  return <>{children}</>;
}

export function AppContextProvider({ children }) {
  return (
    <QueryProvider>
      <GlobalNotificationsProvider>
        <AuthProvider>
          <AuthInitializer>
            <GlobalProvider>{children}</GlobalProvider>
          </AuthInitializer>
        </AuthProvider>
      </GlobalNotificationsProvider>
    </QueryProvider>
  );
}
