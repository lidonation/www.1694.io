import React from 'react'
import { BuildingOffice2Icon} from '@heroicons/react/24/outline'
import Map from './Map'

function WorkshopDetails({ workshop }) {
  const localTime = (time) => {
    const timestamp = time;
    const date = new Date(timestamp);
    const options = {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const localTimeString = date.toLocaleString(undefined, options);
    return localTimeString;
  };
  return (
    <section className="relative bg-white isolate dark:bg-black">
      <div className="grid grid-cols-1 mx-auto max-w-7xl lg:grid-cols-2">
        <section className="relative px-6 pt-24 pb-20 sm:pt-32 lg:static lg:px-8 lg:py-24">
          <div className="max-w-xl mx-auto lg:mx-0 lg:max-w-lg">
            <div className="absolute inset-y-0 left-0 w-full overflow-hidden -z-10 ring-1 ring-white/5 lg:w-1/2">
              <svg
                className="absolute inset-0 h-full w-full stroke-gray-700 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
                aria-hidden="true">
                <defs>
                  <pattern
                    id="54f88622-e7f8-4f1d-aaf9-c2f5e46dd1f2"
                    width={200}
                    height={200}
                    x="100%"
                    y={-1}
                    patternUnits="userSpaceOnUse"
                  >
                    <path d="M130 200V.5M.5 .5H200" fill="none" />
                  </pattern>
                </defs>
                <svg
                  x="100%"
                  y={-1}
                  className="overflow-visible fill-gray-800/20"
                >
                  <path d="M-470.5 0h201v201h-201Z" strokeWidth={0} />
                </svg>
                <rect
                  width="100%"
                  height="100%"
                  strokeWidth={0}
                  fill="url(#54f88622-e7f8-4f1d-aaf9-c2f5e46dd1f2)"
                />
              </svg>
              <div
                className="absolute -left-56 top-[calc(100%-13rem)] transform-gpu blur-3xl lg:left-[max(-14rem,calc(100%-59rem))] lg:top-[calc(50%-7rem)]"
                aria-hidden="true"
              >
                <div
                  className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-br from-[#80caff] to-[#4f46e5] opacity-20"
                  style={{
                    clipPath:
                      'polygon(74.1% 56.1%, 100% 38.6%, 97.5% 73.3%, 85.5% 100%, 80.7% 98.2%, 72.5% 67.7%, 60.2% 37.8%, 52.4% 32.2%, 47.5% 41.9%, 45.2% 65.8%, 27.5% 23.5%, 0.1% 35.4%, 17.9% 0.1%, 27.6% 23.5%, 76.1% 2.6%, 74.1% 56.1%)',
                  }}
                />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-black border-none dark:text-white">
              {workshop.name}
            </h2>
            
            <dl className="mt-4 space-y-4 text-base leading-7 text-black dark:text-gray-300">
              <div className="flex gap-x-4">
                <dt className="flex-none">
                  <span className="sr-only">Address</span>
                  <BuildingOffice2Icon
                    className="w-6 text-black h-7 dark:text-gray-400"
                    aria-hidden="true"
                  />
                </dt>
                <dd className='text-left'>
                  <div>
                    {workshop.locationDescription}
                  </div>
                  <div>
                    {workshop.locationAddress}
                  </div>
                </dd>
              </div>                    
              
              <div className="flex items-center gap-x-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53"
                  />
                </svg>
                <div className="flex flex-col items-start">
                  <div>Start date and time: <span>{localTime(workshop.startDateTime)}</span></div>
                  <div>End date and time: <span>{localTime(workshop.endDateTime)}</span></div>
                </div>
              </div>
          
              <div className='pt-16'>
                <a rel="noreferrer"               
                    target="_blank"
                    href={workshop.link}
                    type="button"
                    className="rounded-md bg-zinc-800 text-zinc-100 dark:bg-rose-100 py-2.5 px-3.5 text-center text-sm xl:text-xl font-semibold dark:text-zinc-600 shadow-sm w-full hover:bg-rose-100">
                    View Workshop Details
                </a>
              </div>
            </dl>
          </div>
        </section>
        <section>
          <Map location={workshop.locationLatLng}/>
        </section>
      </div>
    </section>
  )
}

export default WorkshopDetails
