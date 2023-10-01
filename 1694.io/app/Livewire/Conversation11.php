<?php

namespace App\Livewire;

use Livewire\Component;

class Conversation11 extends Component


{
   
    public function render()
   
    {
        $data = [[
            "name" => "michael-liesenfelt",
            "img" => "images/images/logos/conversation2.png",
            "text" => "On the topic of pledge and leverage, would it be possible to include time duration for pledge existence? The use of time duration for a pools pledge (i.e. 10 epochs) could prevent pools from updating their pledge to increase vote impact then remove the pledge to keep their ADA in a more liquid state.",
            "time" => "2022-11-27T18:04:26Z",
            "link" => "https://github.com/cardano-foundation/CIPs/pull/380#issuecomment-1328307058"
        ]];
        return view('livewire.conversation11', ["data" => $data]);
    }
}
