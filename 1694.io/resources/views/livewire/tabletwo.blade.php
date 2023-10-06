<div>
    <div class="">
        <table class="w-full border border-collapse divide-y divide-gray-200">
            <thead>
                <tr>
                    <th class="px-6 py-3 bg-gray-100 border bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">Governance action type</th>
                    <th class="px-6 py-3 bg-gray-100 border bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">CC</th>
                    <th class="px-6 py-3 bg-gray-100 border bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">DReps</th>
                    <th class="px-6 py-3 bg-gray-100 border bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">SPOs</th>
                </tr>
            </thead>
            <tbody>
                <!-- Row 1 -->
                <tr>
                    <td class="px-6 py-3 border">1.Motion of no-confidence</td>
                    <td class="px-6 py-3 border">-</td>
                    <td class="px-6 py-3 border">$P_1$</td>
                    <td class="px-6 py-3 border">$Q_1$</td>
                </tr>
                <!-- Row 2 -->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">2.<sub>a</sub>. New committee/threshold (normal state)</td>
                    <td class="px-6 py-3 border">-</td>
                    <td class="px-6 py-3 border">$P_{2a}$</td>
                    <td class="px-6 py-3 border">$Q_{2a}$</td>
                </tr>
                <!-- Row 3 -->
                <tr>
                    <td class="px-6 py-3 border">2.<sub>a</sub>. New committee/threshold (normal state)</td>
                    <td class="px-6 py-3 border">-</td>
                    <td class="px-6 py-3 border">$P_{2b}$</td>
                    <td class="px-6 py-3 border">$Q_{2b}$</td>
                </tr>
                <!-- Row 4-->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">3. Update to the Constitution</td>
                    <td class="px-6 py-3 border">✓</td>
                    <td class="px-6 py-3 border">$P_3$</td>
                    <td class="px-6 py-3 border">-</td>
                </tr>
                <!-- Row 5 -->
                <tr>
                    <td class="px-6 py-3 border">4. Hard-fork initiation</td>
                    <td class="px-6 py-3 border">✓</td>
                    <td class="px-6 py-3 border">$P_4$</td>
                    <td class="px-6 py-3 border">$Q_4$</td>
                </tr>
                <!-- Row 6 -->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">5<sub>a</sub>. Protocol parameter changes, network group</td>
                    <td class="px-6 py-3 border">✓</td>
                    <td class="px-6 py-3 border">$P_{5a}$</td>
                    <td class="px-6 py-3 border">-</td>
                </tr>
                <!-- Row 7 -->
                <tr>
                    <td class="px-6 py-3 border">5<sub>b</sub>. Protocol parameter changes, economic group</td>
                    <td class="px-6 py-3 border">✓</td>
                    <td class="px-6 py-3 border">$P_{5b}$</td>
                    <td class="px-6 py-3 border">-</td>
                </tr>

                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">5<sub>c</sub>. Protocol parameter changes, technical group</td>
                    <td class="px-6 py-3 border">✓</td>
                    <td class="px-6 py-3 border">$P_{5c}$</td>
                    <td class="px-6 py-3 border">-</td>
                </tr>

                <tr>
                    <td class="px-6 py-3 border">5<sub>d</sub>. Protocol parameter changes, governance group</td>
                    <td class="px-6 py-3 border">✓</td>
                    <td class="px-6 py-3 border">$P_{5d}$</td>
                    <td class="px-6 py-3 border">-</td>
                </tr>

                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">6. Treasury withdrawal</td>
                    <td class="px-6 py-3 border">✓</td>
                    <td class="px-6 py-3 border">$P_6$</td>
                    <td class="px-6 py-3 border">-</td>
                </tr>

                <tr>
                    <td class="px-6 py-3 border">7. Info</td>
                    <td class="px-6 py-3 border">✓</td>
                    <td class="px-6 py-3 border">$100$</td>
                    <td class="px-6 py-3 border">$100$</td>
                </tr>
            </tbody>
        </table>

    </div>

    <p class="pt-10">
        Each of these thresholds is a governance parameter. The initial thresholds should be chosen by the Cardano community as a whole. The two thresholds for the Info action are set to 100% since setting <br> it any lower would result in not being able to poll above the threshold.
    </p>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note </b>It may make sense for some or all thresholds to be adaptive with respect to the Lovelace that is actively registered to vote. For example, a threshold could vary between 51% for a high level of registration and 75% for a low level registration. Moreover, the treasury threshold could also be adaptive, depending on the total Lovelace that is being withdrawn, or different thresholds could be set for different levels of withdrawal.
        </p>
    </div>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note </b>To achieve legitimacy, the minimum acceptable threshold should be no less than 50% of the delegated stake.
        </p>
    </div>

    <h3 class="font-medium text-xl  mt-8">Restrictions</h3>

    <p class="mt-3">
        Apart from <i>Treasury withdrawals</i> and <i>Infos</i> , we include a mechanism for ensuring that governance actions of the same type do not accidentally clash with each other in an unexpected way.
    </p>

    <p class="mt-3">
        Each governance action must include the governance action ID for the most recently enacted action of its given type. This means that two actions of the same type can be enacted at the same time, but they must be deliberately designed to do so.
    </p>

    <h3 class="font-medium text-xl  mt-8">Enactment</h3>

    <p class="mt-2">
        Actions that have been ratified in the current epoch are prioritized as follows for enactment:
    </p>

    <ul class="list-decimal ml-10 mt-5">
        <li class="mb-2 ">Motion of no-confidence</li>
        <li class="mb-2">New committee/threshold</li>
        <li class="mb-2">Updates to the Constitution</li>
        <li class="mb-2">Hard Fork initiation</li>
        <li class="mb-2">Protocol parameter changes</li>
        <li class="mb-2">Treasury withdrawals</li>
        <li class="mb-2">Info</li>
    </ul>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note </b>Enactment for Info actions is a null action, since they do not have any effect on the protocol.
        </p>
    </div>
    <p class="mt-7">
        Enactment of a successful Motion of no-confidence invalidates all other <b>not yet enacted</b> governance actions (whether or not they have been ratified), causing them to be immediately dropped without ever being enacted. Deposits for <b>dropped </b>actions will be returned immediately.
    </p>

    <h3 class="font-semibold mt-6">Order of enactment</h3>
    <p class="mt-7">
        Governance actions are enacted in order of acceptance to the chain. This resolves conflicts where, e.g. there are two competing parameter changes.
    </p>

    <h3 class="font-medium text-xl  mt-8">Lifecycle</h3>
    <p class="mt-6">
        Governance actions are checked for ratification only on an epoch boundary. Once ratified, actions are staged for enactment.
    </p>
    <p class="mt-6">
        All submitted governance actions will therefore either:
    </p>
    <ul class="list-decimal ml-10 mt-5">
        <li class="mb-2 ">be <b>ratified,</b> then <b>enacted</b></li>
        <li class="mb-2">be <b>dropped</b> as a result of a successful Motion of no-confidence</li>
        <li class="mb-2">or <b>expire</b> after a number of epochs</li>
    </ul>
    <p class="mt-6">
        In all of those cases, deposits are returned immediately.
    </p>
    <p class="mt-6">
        Some actions will be enacted immediately (i.e. at the same epoch boundary they are ratified), others are enacted only on the following epoch boundary.
    </p>

</div>