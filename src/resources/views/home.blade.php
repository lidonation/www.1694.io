@extends('layout')
@section('content')

<div class="flex w-full max-w-7xl lg:px-8">
  <div class="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20">
    <div class="mt-1 ">

      @livewire('navbar')

      <br>
      <br>

      @livewire('header')

      <div class="mt-16 sm:mt-20">
        @livewire("Slantedimages")
      </div>
      @livewire("Main")
      <hr class="mt-20">

      <div>
        @livewire('footer')
      </div>
    </div>
  </div>
</div>

@endsection