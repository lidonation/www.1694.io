import { Container } from '@/components/Container'

export function SimpleLayout({ title, intro, children }) {
  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          {intro}
        </p>
      </header>
      <div className='flex flex-col gap-16 mt-16 sm:mt-20'>
        <div className="">{children}</div>

        {/* <aside className='flex flex-col gap-4 text-zinc-800 dark:text-zinc-100 shrink-0 w-80'>
          <div className='px-4 py-8 text-right border-y rounded-2xl border-zinc-300 dark:border-zinc-600'>
            <h2 className='border-none'>Diagrams</h2>
            <div className='mt-4'>
              <nav>
                <ul className='flex flex-col gap-4'>
                  <li className='list-none'>
                    <a target='_blank' href={cipNutShellImage.src} className='text-teal-500' rel="noreferrer">CIP-1694 IN A NUTSHELL</a>                    
                  </li>
                  </ul>
              </nav>
            </div>
          </div>          
        </aside> */}
      </div>
    </Container>
  )
}