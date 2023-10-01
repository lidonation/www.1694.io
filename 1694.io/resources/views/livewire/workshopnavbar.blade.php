<!-- <div>
    <nav class="mt-6 flex items-center justify-between ">
        <div class="ml-20 ">
            <img src="{{ asset('images/apple-touch-icon.png') }}" alt="Image" class="rounded-full w-10 cursor-pointer">
        </div>

        <div class="relative">
           
            <button id="dropdownButton" class="text-blue-500 hover:text-red-500 md:hidden absolute right-0 top-0 mt-3 mr-3 flex p-3 rounded-s-full item-center ">
                <h1 class="">Menu </h1>
                <i class="fas fa-chevron-down"></i>
            </button>

           
            <div id="dropdownMenu" class="md:hidden hidden absolute right-0 mt-12 bg-white border border-gray-300 rounded-lg shadow-lg">
                <ul class="py-2 px-4 space-y-2 text-zinc-800">
                    <li>
                        <a href="/" class="block @if(request()->is('/')) text-red-500 @endif">Home</a>
                    </li>
                    <li>
                        <a href="/workshops" class="block @if(request()->is('workshops')) text-red-500 @endif">Workshops</a>
                    </li>
                   
                </ul>
            </div>
        </div>

        <div class="shadow-lg shadow-red-500 md:shadow-xl text-blue-500 border border-gray-300 rounded-full p-3 hidden md:flex bg-blue-400 ">
            <ul class="-my-2  text-base divide-y divide-zinc-100 text-zinc-800 flex dark:divide-zinc-100/5 dark:text-zinc-300">
                <li>
                    <a href="/" class="text-aqua @if(request()->is('/')) text-red-500 @endif">Home</a>
                </li>
                <li class="pl-7">
                    <a href="/workshops" class=" @if(request()->is('workshops')) text-red-500 @endif">Workshops</a>
                </li>
            </ul>
        </div>

        <div class="mr-10 rounded-full p-2  shadow-md  ">
            <img src="{{asset('images/images/logos/moon.png')}}" alt="Image 12" class="w-8 h-8 cursor-pointer rounded-full" onclick="toggleDarkMode()" id="icon">
        </div>

    </nav>
</div>

<script>
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        document.getElementById("semi-body").classList.toggle("semidark-mode");

        let icon = document.getElementById("icon")

        if (document.body.classList.contains("dark-mode")) {
            icon.src = " {{asset('images/images/logos/sun.png')}}";
        } else {
            icon.src = "{{asset('images/images/logos/moon.png')}}"
        }
    }
</script>  -->


<header class="relative z-50 flex flex-col pointer-events-none" style="height:var(--header-height);margin-bottom:var(--header-mb)">
    <div class="top-0 z-10 h-16 pt-6" style="position:var(--header-position)">
        <div class="sm:px-8 top-[var(--header-top,theme(spacing.6))] w-full" style="position:var(--header-inner-position)">
            <div class="mx-auto max-w-7xl lg:px-8">
                <div class="relative px-4 sm:px-8 lg:px-12">
                    <div class="mx-auto max-w-2xl lg:max-w-5xl">
                        <div class="relative flex gap-4">
                            <div class="flex flex-1">
                                <div class="h-10 w-10 rounded-full bg-white/90 p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:ring-white/10">
                                    <a aria-label="Home" class="pointer-events-auto" href="/">
                                        <img alt="" sizes="2.25rem" srcset="{{ asset('images/apple-touch-icon.png') }}" width="920" height="920" decoding="async" data-nimg="1" class="rounded-full bg-zinc-100 object-cover dark:bg-zinc-800 h-9 w-9" style="color: transparent;">
                                    </a>
                                </div>
                            </div>
                            <div class="flex justify-end flex-1 md:justify-center">

                                <div class="pointer-events-auto md:hidden" data-headlessui-state="">
                                    <button class="flex items-center px-4 py-2 text-sm font-medium rounded-full shadow-lg group bg-white/90 text-zinc-800 shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20" type="button" aria-expanded="false" data-headlessui-state="" id="headlessui-popover-button-:R2qb6:">Menu<svg viewBox="0 0 8 6" aria-hidden="true" class="w-2 h-auto ml-3 stroke-zinc-500 group-hover:stroke-zinc-700 dark:group-hover:stroke-zinc-400">
                                            <path d="M1.75 1.75 4 4.25l2.25-2.5" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </button>
                                </div>

                                <nav class="hidden pointer-events-auto md:block">
                                    <ul class="flex px-3 py-0 text-sm font-medium rounded-full shadow-lg bg-white/90 text-zinc-800 shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
                                        <li class="mb-0 list-none">
                                            <a class="relative block px-3 py-2 transition hover:text-teal-500 dark:hover:text-teal-400" href="/">Home</a>
                                        </li>
                                        <li class="mb-0 list-none">
                                            <a class="relative block px-3 py-2 transition text-teal-500 dark:text-teal-400" href="/workshops">Workshops
                                                <span class="absolute h-px inset-x-1 -bottom-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0"></span>
                                            </a>
                                        </li>
                                    </ul>
                                </nav>

                            </div>

                            <div class="flex justify-end md:flex-1">
                                <div class="pointer-events-auto">
                                    <button type="button" aria-label="Toggle dark mode" class="px-3 py-2 transition rounded-full shadow-lg group bg-white/90 shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:ring-white/10 dark:hover:ring-white/20">
                                        <svg viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-6 w-6 fill-zinc-100 stroke-zinc-500 transition group-hover:fill-zinc-200 group-hover:stroke-zinc-700 dark:hidden [@media(prefers-color-scheme:dark)]:fill-teal-50 [@media(prefers-color-scheme:dark)]:stroke-teal-500 [@media(prefers-color-scheme:dark)]:group-hover:fill-teal-50 [@media(prefers-color-scheme:dark)]:group-hover:stroke-teal-600">
                                            <path d="M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z"></path>
                                            <path d="M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061" fill="none">
                                            </path>
                                        </svg>
                                        <svg viewBox="0 0 24 24" aria-hidden="true" class="hidden h-6 w-6 fill-zinc-700 stroke-zinc-500 transition dark:block [@media(prefers-color-scheme:dark)]:group-hover:stroke-zinc-400 [@media_not_(prefers-color-scheme:dark)]:fill-teal-400/10 [@media_not_(prefers-color-scheme:dark)]:stroke-teal-500">
                                            <path d="M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                            </path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</header>