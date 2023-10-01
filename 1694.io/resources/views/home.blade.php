@extends('layout')
@section('content')

<div class="mt-1 " id="semi-body">
  @livewire('navbar')
  <br>
  <br>
  @livewire('header')
  @livewire("Slantedimages")
  @livewire("Main ")
  <hr class="mt-20">
  <div class="container">
    @livewire('footer')
  </div>

</div>



@endsection