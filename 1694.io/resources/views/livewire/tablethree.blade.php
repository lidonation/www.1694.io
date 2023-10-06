<div>
    <div class="">
        <table class="w-full border border-collapse divide-y divide-gray-200">
            <thead>
                <tr>
                    <th class="px-6 py-3 bg-gray-100 border bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">Governance action type</th>
                    <th class="px-6 py-3 bg-gray-100 border bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">Enactment</th>
                </tr>
            </thead>
            <tbody>
                <!-- Row 1 -->
                <tr>
                    <td class="px-6 py-3 border">1. Motion of no-confidence</td>
                    <td class="px-6 py-3 border">Immediate</td>
                </tr>
                <!-- Row 2 -->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">2. New committee/threshold</td>
                    <td class="px-6 py-3 border">Immediate</td>
                </tr>
                <!-- Row 3 -->
                <tr>
                    <td class="px-6 py-3 border">3. Update to the Constitution</td>
                    <td class="px-6 py-3 border">Immediate</td>
                </tr>
                <!-- Row 4-->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">4. Hard-fork initiation</td>
                    <td class="px-6 py-3 border">Next epoch boundary</td>
                </tr>
                <!-- Row 5 -->
                <tr>
                    <td class="px-6 py-3 border">5. Protocol parameter changes</td>
                    <td class="px-6 py-3 border">Next epoch boundary</td>
                </tr>
                <!-- Row 6 -->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">6. Treasury withdrawal</td>
                    <td class="px-6 py-3 border">Immediate</td>
                </tr>
                <!-- Row 7 -->
                <tr>
                    <td class="px-6 py-3 border">7. Info</td>
                    <td class="px-6 py-3 border">Immediate</td>
                </tr>
            </tbody>
        </table>

    </div>
    <!-- TODO - break up the protocol parameters into those which effect the header/body validation split (so that some can be enacted immediately)? -->

    <h3 class="font-medium text-xl  mt-8">Content</h3>
    <p class="mt-6">
        Every governance action will include the following:
    </p>
    <ul class="list-disc ml-10 mt-5">
        <li class="mb-2 ">a deposit amount (recorded since the amount of the deposit is an updatable protocol parameter)</li>
        <li class="mb-2">a reward address to receive the deposit when it is repaid</li>
        <li class="mb-2">an optional anchor for any metadata that is needed to justify the action</li>
        <li class="mb-2">a hash digest value to prevent collisions with competing actions of the same type (as described earlier)</li>
    </ul>

    <!-- TODO: Provide a CBOR specification in the annexe for these new on-chain entities -->
    <p class="mt-6">
        In addition, each action will include some elements that are specific to its type:
    </p>
</div>