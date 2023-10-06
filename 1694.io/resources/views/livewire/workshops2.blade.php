<div>
    <section aria-labelledby=":r0:" class="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        <div class="grid items-baseline max-w-3xl grid-cols-1 gap-y-8 md:grid-cols-4">
            <h2 id=":r0:" class="text-sm font-semibold border-none text-zinc-800 dark:text-zinc-100">Workshops</h2>
            <div class="md:col-span-3">
                <div class="space-y-16">
                    <p class="text-sm text-center text-zinc-400 dark:text-zinc-500">Attend a Workshop</p>
                    <div class="flex flex-row flex-wrap justify-center gap-4">

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal')">
                                    <span @click="showModal = true" rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Abu Dhabi</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal1')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Accra</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal2')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Bogotá</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal3')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Chicago</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal4')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Fukuoka</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal5')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Johannesburg</span>
                                </button>
                            </button>
                        </div>


                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal6')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Kyoto</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal7')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Minneapolis</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal8')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Monterey</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal9')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Philadelphia</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal10')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Seoul</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal11')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Vancouver</span>
                                </button>
                            </button>
                        </div>

                        <div x-data="{ showModal: false }">
                            <button @click="showModal = true">
                                <button x-on:click="$dispatch('open-modal12')">
                                    <span rel="noreferrer" class="text-sm font-semibold cursor-pointer text-rose-400 xl:text-xl dark:text-rose-200 hover:text-rose-600 dark:hover:text-rose-500">Worcester</span>
                                </button>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>


        <!-- modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal.window="show = true" x-on:close-modal1.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[0]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[0]['locationDescription']}}</p>
                                <p class="text-base">{{$data[0]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[0]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[0]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[0]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                        <iframe class="w-96 " src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1815.955960476179!2d54.376902!3d24.453841!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5e69833eb007ab%3A0x375b82bb236043fa!2sAL%20FARHAN%20AUTO%20REPAIR%20LLC!5e0!3m2!1sen!2sus!4v1696420233585!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal1')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>


        <!--Accra modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal1.window="show = true" x-on:close-modal2.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[1]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[1]['locationDescription']}}</p>
                                <p class="text-base">{{$data[1]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[1]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[1]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[1]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96" sm:hidden md:hidden lg:block">
                    <iframe class="w-96 " src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d496.3437564125492!2d-0.18673469578409768!3d5.60389286112269!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9baf247f45f5%3A0x9905074f65343b9f!2sTouchlily!5e0!3m2!1sen!2sus!4v1696420456871!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal2')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Bogotá modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal2.window="show = true" x-on:close-modal3.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[2]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[2]['locationDescription']}}</p>
                                <p class="text-base">{{$data[2]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[2]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[2]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[2]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe class="w-96" src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7952.689971678453!2d-74.0721!3d4.710000000000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f852b904ee333%3A0xdabcd17c75285b8e!2sAV.%20Suba%20-%20CL%20126!5e0!3m2!1sen!2sus!4v1696421103712!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal3')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Chicago modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal3.window="show = true" x-on:close-modal4.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[3]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[3]['locationDescription']}}</p>
                                <p class="text-base">{{$data[3]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[3]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[3]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[3]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe class="w-96 " src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d5941.372164095384!2d-87.6298!3d41.8781!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880e2cbcd979499b%3A0xb7bf5ad59aa7af70!2sJackson!5e0!3m2!1sen!2sus!4v1696421298047!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal4')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Fukuoka modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal4.window="show = true" x-on:close-modal5.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[4]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[4]['locationDescription']}}</p>
                                <p class="text-base">{{$data[4]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[4]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[4]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[4]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe class="w-96 " src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3323.5750149204896!2d130.401721!3d33.590382!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35419191db04b0f3%3A0x244f3bd70542c2cd!2sLawson%20Fukuoka%20City%20Hall!5e0!3m2!1sen!2sus!4v1696421467622!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal5')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Johannesburg modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal5.window="show = true" x-on:close-modal6.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[5]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[5]['locationDescription']}}</p>
                                <p class="text-base">{{$data[5]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[5]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[5]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[5]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe class="w-96" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3579.7687450329536!2d28.0486201!3d-26.20419999999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e950e9be87feaab%3A0xdaf68595889f89a1!2sA1%20Fashion!5e0!3m2!1sen!2sus!4v1696421623007!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal6')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Kyoto modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal6.window="show = true" x-on:close-modal7.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[6]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[6]['locationDescription']}}</p>
                                <p class="text-base">{{$data[6]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[6]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[6]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[6]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe class="w-96"  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1633.9023038186367!2d135.768159!3d35.011596!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6001088d901efcc1%3A0x3a3362a1bd150594!2sKyoto%20City%20Hall!5e0!3m2!1sen!2sus!4v1696421725577!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal7')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Minneapolis modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal7.window="show = true" x-on:close-modal8.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[7]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[7]['locationDescription']}}</p>
                                <p class="text-base">{{$data[7]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[7]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[7]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[7]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe class="w-96" src="https://www.google.com/maps/embed?pb=!1m10!1m8!1m3!1d352.78998075867116!2d-93.26497049569984!3d44.97781328139857!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1696421905152!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal8')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Monterey modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal8.window="show = true" x-on:close-modal9.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[8]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[8]['locationDescription']}}</p>
                                <p class="text-base">{{$data[8]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[8]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[8]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[8]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe class="w-96" src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1601.5449458749167!2d-121.894672!3d36.60014400000001!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808de423c8375df9%3A0xf0988a63e7dfecc2!2sThe%20Crown%20%26%20Anchor!5e0!3m2!1sen!2sus!4v1696422001104!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal9')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Philadelphia modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal9.window="show = true" x-on:close-modal10.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[9]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[9]['locationDescription']}}</p>
                                <p class="text-base">{{$data[9]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[9]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[9]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[9]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe  class="w-96"  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d6116.99753968271!2d-75.1652!3d39.9526!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c6c62e3080a457%3A0xff1171f7338c2c22!2s15th%20St%20Trolley%20Station!5e0!3m2!1sen!2sus!4v1696422166385!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal10')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Seoul modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal10.window="show = true" x-on:close-modal11.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[10]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[10]['locationDescription']}}</p>
                                <p class="text-base">{{$data[10]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[10]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[10]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[10]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe  class="w-96" src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1581.2567146108552!2d126.97797900000002!3d37.566526!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca2f332cb082b%3A0xe92b70ac420cf0a8!2sSeoul%20City%20Hall!5e0!3m2!1sen!2sus!4v1696422250768!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal11')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Vancouver modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal11.window="show = true" x-on:close-modal12.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40  dark:opacity-40 dark:bg-black"></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded  m-auto fixed inset-0 max-w-3xl " style="max-height: 500px;">


                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[11]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[11]['locationDescription']}}</p>
                                <p class="text-base">{{$data[11]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[11]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[11]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[11]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                    <iframe class="w-96 " src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d5205.3347184251625!2d-123.1207!3d49.2827!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x5486717f13178bd3%3A0x76419e09d6226ad5!2sVancouver%20City%20Centre!5e0!3m2!1sen!2sus!4v1696422467317!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>

                <button x-on:click="$dispatch('close-modal12')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>
        </div>

        <!--Worcester modal -->
        <div x-data="{ show: false }" x-show="show" x-on:open-modal12.window="show = true" x-on:close-modal13.window="show = false" x-on:keydown.escape.window="show = false" class="fixed z-50 inset-0 ">
            <div x-on:click="show = false" class="fixed inset-0 bg-gray-300 opacity-40 dark:opacity-40 dark:bg-gray-800/90 "></div>
            <div class="bg-white dark:bg-black dark:text-slate-200 rounded m-auto fixed inset-0 max-w-3xl sm:align-center sm:max-w-xl lg:max-w-3xl md:pt-3 sm:h-30" style="max-height: 500px;">
                <div class="flex ">
                    <div class="w-96  flex flex-col justify-center items-center text-center sm:mx-auto">
                        <h1 class="text-xl font-bold mb-4">{{$data[12]['name']}}</h1>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-building text-2xl"></i>
                            </div>
                            <div>
                                <p class="text-base">{{$data[12]['locationDescription']}}</p>
                                <p class="text-base">{{$data[12]['locationAddress']}}</p>
                            </div>
                        </div>
                        <br>

                        <div class="flex items-center mb-2">
                            <div class="mr-2">
                                <i class="fas fa-bell text-2xl"></i>
                            </div>

                            <div>
                                <p class="text-base">Start Date & Time: {{$data[12]['startDateTime']}}</p>
                                <p class="text-base">End Date & Time: {{$data[12]['endDateTime']}}</p>
                            </div>
                        </div>
                        <a href="{{$data[12]['link']}}" target="_blank">
                            <button class="bg-black dark:bg-red-200 dark:hover:bg-black dark:text-slate-200 hover:bg-red-200 px-10 md:px-4 py-5 text-white text-lg rounded">
                                view Workshop details
                            </button>
                        </a>
                    </div>

                    <div class="w-96 sm:hidden md:hidden lg:block">
                        <iframe class="w-96 " src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2952.7138490248108!2d-71.802418!3d42.263283!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e406669f0fa803%3A0xee0bf6a67c910722!2sWorcester%20City%20Hall!5e0!3m2!1sen!2sus!4v1696389771246!5m2!1sen!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                    </div>
                </div>
                <button x-on:click="$dispatch('close-modal13')" class="w-full px-6 py-2 sm:mt-5 md:mt-4  bg-black dark:bg-red-400 text-white rounded-md hover:bg-red-400">Close</button>
            </div>

        </div>


    </section>
</div>