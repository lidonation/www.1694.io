<?php

namespace App\Livewire;

use Livewire\Component;

class Workshops2 extends Component
{
    public function render()
    {
        $data = [
         
            [
                'name' => 'Abu Dhabi',
                'link' => 'https://forms.gle/1HuKu2hB5FScg4Fm9',
                'locationDescription' => 'Abu Dhabi - Creative Hub (Cornish)',
                'locationAddress' => '309 Al Meena St - Al Zahiyah - Abu Dhabi - United Arab Emirates',
                'startDateTime' => '2023-06-25T16:00:00+04:00',
                'endDateTime' => '2023-06-25T20:00:00+04:00',
                'locationLatLng' => [24.4539, 54.3773]
            ],
            [
                'name' => 'Accra',
                'link' => 'https://www.meetup.com/cardano-blockchain-accra/events/293689905/',
                'locationDescription' => 'TBD',
                'locationAddress' => 'TBD',
                'startDateTime' => '2023-06-24T09:00:00+00:00',
                'endDateTime' => '2023-06-24T16:00:00+00:00',
                'locationLatLng' => [5.6037, -0.1870]
            ],
            [
                'name' => 'Bogotá',
                'link' => 'https://www.eventbrite.com/e/taller-de-gobernanza-cip-1694-tickets-639570842607',
                'locationDescription' => 'College of Higher Administration Studies - CESA',
                'locationAddress' => '5a-57 Diagonal 35 Bogotá, Bogotá 110311 Colombia',
                'startDateTime' => '2023-05-27T08:00:00-05:00',
                'endDateTime' => '2023-05-27T18:00:00-05:00',
                'locationLatLng' => [4.7100, -74.0721]
            ],
            [
                'name' => 'Chicago',
                'link' => 'https://docs.google.com/forms/d/e/1FAIpQLSd_s6Kex6eeo8VBZOubwFfY_dMXsNnkqkDDzf6lyo77SLjVBw/viewform',
                'locationDescription' => 'Hilton Garden Inn Chicago OHare Airport',
                'locationAddress' => '2930 S River Rd, Des Plaines, IL 60018',
                'startDateTime' => '2023-05-27T09:00:00-05:00',
                'endDateTime' => '2023-05-27T16:00:00-05:00',
                'locationLatLng' => [41.8781, -87.6298]
            ],
            [
                'name' => 'Fukuoka',
                'link' => 'https://www.meetup.com/cardano-kyushu-okinawa/events/293559858/',
                'locationDescription' => 'Office New Gaea Hakata Station 3F',
                'locationAddress' => '1-chōme-12 Hakataekihigashi, Hakata Ward, Fukuoka, 812-0013, Japan',
                'startDateTime' => '2023-06-10T10:00:00+09:00',
                'endDateTime' => '2023-06-10T17:00:00+09:00',
                'locationLatLng' => [33.5904, 130.4017]
            ],
            [
                'name' => 'Johannesburg',
                'link' => 'https://www.meetup.com/cardano-blockchain-johannesburg-sa/events/293523683/',
                'locationDescription' => 'UNISA Conference Centre',
                'locationAddress' => '2 Vinton Rd· Johannesburg South',
                'startDateTime' => '2023-05-25T08:00:00+02:00',
                'endDateTime' => '2023-05-25T15:00:00+02:00',
                'locationLatLng' => [-26.2041, 28.0473]
            ],
            [
                'name' => 'Kyoto',
                'link' => 'https://www.meetup.com/cardano-blockchain-kansai/events/293559859/',
                'locationDescription' => 'Kyoto Chuo Gakuin, Building 2, Room 282',
                'locationAddress' => 'Japan, 〒600-8236 Kyoto, Shimogyo Ward, Nishiaburanokōjichō, 27',
                'startDateTime' => '2023-05-27T10:00:00+09:00',
                'endDateTime' => '2023-05-27T16:00:00+09:00',
                'locationLatLng' => [35.0116, 135.7681]
            ],
            [
                'name' => 'Minneapolis',
                'link' => 'https://www.eventbrite.com/e/cip-1694-governance-workshop-tickets-655290169537',
                'locationDescription' => 'Coco Working: 4th Floor Grain Exchange Building',
                'locationAddress' => '400 South 4th Street, Minneapolis, MN, 55415',
                'startDateTime' => '2023-06-23T10:00:00-05:00',
                'endDateTime' => '2023-06-23T17:00:00-05:00',
                'locationLatLng' => [44.9778, -93.2650]
            ],
            [
                'name' => 'Monterey',
                'link' => 'https://www.meetup.com/buffy-bot-publishing/events/293198753/',
                'locationDescription' => 'Monterey Marriott',
                'locationAddress' => '350 Calle Principal, Monterey, CA',
                'startDateTime' => '2023-05-28T12:00:00-07:00',
                'endDateTime' => '2023-05-28T18:30:00-07:00',
                'locationLatLng' => [36.6002, -121.8947]
            ],
            [
                'name' => 'Philadelphia',
                'link' => 'https://www.meetup.com/phillyada/events/293744781/',
                'locationDescription' => 'Blockspace Philly',
                'locationAddress' => '21 S 11th Street, 4th FL · Philadelphia, PA',
                'startDateTime' => '2023-06-17T12:00:00+04:00',
                'endDateTime' => '2023-06-17T17:20:00+04:00',
                'locationLatLng' => [39.9526, -75.1652]
            ],
            [
                'name' => 'Seoul',
                'link' => 'https://www.meetup.com/cardano-blockchain-korea/events/293558264/',
                'locationDescription' => 'Belgium',
                'locationAddress' => '37.508747, 127.057526',
                'startDateTime' => '2023-06-24T10:00:00+09:00',
                'endDateTime' => '2023-06-24T18:20:00+09:00',
                'locationLatLng' => [37.5665, 126.9780]
            ],
            [
                'name' => 'Vancouver',
                'link' => 'https://www.meetup.com/cardano-blockchain-vancouver-community/events/293698824/',
                'locationDescription' => 'Cascades Casino Delta',
                'locationAddress' => '6005 BC-17A, Delta, BC V4K 5B8, Canada',
                'startDateTime' => '2023-06-03T10:00:00+00:00',
                'endDateTime' => '2023-06-03T17:16:00+00:00',
                'locationLatLng' => [49.2827, -123.1207]
            ],
            [
                'name' => 'Worcester',
                'link' => 'https://www.meetup.com/gimbalabs-worcester/events/293145623/',
                'locationDescription' => 'Courtyard by Marriott',
                'locationAddress' => '72 Grove St, Worcester, MA 01605',
                'startDateTime' => '2023-06-08T09:00:00+04:00',
                'endDateTime' => '2023-06-08T18:00:00+04:00',
                'locationLatLng' => [42.2626, -71.8023]
            ],
        ];
    

        return view('livewire.workshops2' ,["data" => $data]);
    }
}
