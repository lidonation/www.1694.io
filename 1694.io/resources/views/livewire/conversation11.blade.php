<div class="mt-9">
@foreach($data as $dataitem)
    <a href="https://github.com/michael-liesenfelt" target="_blank" class="flex items-center mb-6">
    <img src="{{ asset($dataitem['img']) }}" alt="Image 2" class="w-12 h-12 rounded-full">
        <h1 class="ml-4">{{$dataitem['name']}}</h1>
    </a>
    <hr>
    <p class="mt-5 max-w-xs sm:max-w-2xl">
     {{$dataitem['text']}}
    </p>



    <div class="flex items-center  mt-6">
        <p class="text-zinc-400 text-sm">
            {{$dataitem["time"]}}
        </p>
        <a href="{{$dataitem['link']}}" target="_blank" class="ml-3 text-sm hover:bg-gray-100 p-1">View on Github</a>
    </div>
@endforeach
</div>