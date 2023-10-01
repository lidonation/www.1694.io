<?php

namespace App\Livewire;

use Livewire\Component;

class Workshops2 extends Component
{
    public function render()
    {
        $data = [
            [
                "title" => "Workshops",
                "detail" => "Attend a Workshop"
            ]
        ];
        return view('livewire.workshops2' ,["data" => $data]);
    }
}
