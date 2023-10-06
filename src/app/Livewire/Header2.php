<?php

namespace App\Livewire;

use Livewire\Component;

class Header2 extends Component
{
    public function render()
    {

        $data = [[
            "heading" => "IOG is partnering with community members in 20 locations around the globe.",
            "description" => " Given importance of CIP 1694 ,achieveing broad consensus is vital as Cardano looks to the future.To that end ,IOG have joined with the community to finance and put 20 workshops around the globe communating with three workshops in Zug(Switzerland),Tokyo (Japan), and Edinburgh(Scotland) during June and July, co-hosted by the Cardano Foundation,EMURGO,and IOG."
        ]];
        return view('livewire.header2', ["data" => $data]);
    }
}
