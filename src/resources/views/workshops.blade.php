@extends('layout')
@section('content')
<div class=" left-column bg-white pl-10 pr-10 dark:bg-zinc-900 dark:ring-zinc-300/20">
  @livewire('Workshopnavbar')
  @livewire('header2')
  <hr>
  @livewire('footer')
</div>
@endsection