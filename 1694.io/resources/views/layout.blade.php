<!doctype html>
<html>


<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="{{ asset('images/apple-touch-icon.png') }}" type="image/x-icon">
    <meta name="description" content="CIP 1694 is a Cardano Improvement Proposal to reason about An On-Chain Decentralized Governance Mechanism for Cardano Voltaire era." />
    <title> CIP 1694 - An On-Chain Decentralized Governance Mechanism for Voltaire</title>
    @vite(['resources/css/app.css','resources/js/app.js', 'resources/js/custom.js'])
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js"></script>
</head>


<body class="box-border h-full p-0 m-0 bg-zinc-50 dark:bg-blue-800">


    <div class="flex justify-center insert-0 sm:px-8">
        <div class="flex w-full bg-white border-gray-200 border-l-1 border-r-1 max-w-7xl lg:px-8" id="semi-body">
                {{--render our views--}}
                @yield("content")
        </div>
    </div>
</body>
</html>