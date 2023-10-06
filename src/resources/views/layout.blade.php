<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="{{ asset('images/apple-touch-icon.png') }}" type="image/x-icon">
    <meta name="description" content="CIP 1694 is a Cardano Improvement Proposal to reason about An On-Chain Decentralized Governance Mechanism for Cardano Voltaire era." />
    <title> CIP 1694 - An On-Chain Decentralized Governance Mechanism for Voltaire</title>
    @vite('resources/css/app.css')
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js"></script>
</head>

<body class="flex flex-col h-full bg-zinc-50 dark:bg-black" x-data="{'darkMode' :false }" x-init="
darkMode = JSON.parse(localStorage.getItem('darkMode'));
$watch('darkMode' , value => localStorage.setItem('darkMode', JSON.stringify(value)))">
    <div :class="{'dark' : darkMode === true}" class="overflow-hidden">

        <div class="flex justify-center insert-0 sm:px-8  dark:bg-black dark:text-gray-300">
            @yield("content")
        </div>
    </div>
</body>
</html>