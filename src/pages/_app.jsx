import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router';
import * as Fathom from 'fathom-client';

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

// import '@/styles/tailwind.css'
import '@/styles/app.scss'
import 'focus-visible'

function usePrevious(value) {
  let ref = useRef()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export default function App({ Component, pageProps, router }) {
  let previousPathname = usePrevious(router.pathname)

  useEffect(() => {
    // Initialize Fathom when the app loads
    Fathom.load('RLDTCMVP', {
      includedDomains: ['www.1694.io'],
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }
    
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
        </div>
      </div>
      <div className="relative">
        <Header />
        <main>
          <Component previousPathname={previousPathname} {...pageProps} />
        </main>
        <Footer />
      </div>
    </>
  )
}
