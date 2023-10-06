<div>
    <h3 class="text-2xl font-medium mt-10">Pre-defined DReps</h3>
    <p class="mt-3">In order to participate in governance, each stake credential must be delegated to a DRep. Ada holders will generally delegate their voting rights to a registered DRep that will vote on their behalf. In addition, two pre-defined DRep options are available:</p>

    <ul class="list-disc ml-10 mt-10">
        <li class="mb-2 ">Abstain If an Ada holder delegates to Abstain, then their stake is actively marked as not participating in governance. The effect of delegating to Abstain on chain is that the delegated stake will not be considered to be a part of the active voting stake. However, the stake will be considered to be registered for the purpose of the incentives that are described in Incentives for Ada holders to delegate voting stake.</li>
        <li class="mb-2">No Confidence If an Ada holder delegates to No Confidence, then their stake is counted as a no vote on every governance action apart from a "Motion of no confidence". This also signals that they have no confidence in the existing constitutional committee. The effect of delegating to No Confidence on chain is that this stake will be considered to be a part of the active voting stake. It will count as a Yes vote on every No Confidence action and a No vote on every other action. It also serves as a directly auditable measure of the confidence of Ada holders in the constitutional committee.</li>
    </ul>


    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white" >
        
        <p>
            <b>Note</b> The pre-defined DReps do not cast votes inside of transactions, their behavior is accounted for at the protocol level. The Abstain DRep may be chosen for a variety of reasons, including the desire to not participate in the governance system.
        </p>
    </div>


    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white" >
        <p>
            <b>Note</b> Any Ada holder may register themselves as a DRep and delegate to themselves if they wish to actively participate in voting.
        </p>
    </div>

    <h3 class="text-2xl font-medium mt-10">Registered DReps</h3>
    <p class="mt-3">In Voltaire, existing stake credentials will be able to delegate their stake to registered DReps for voting purposes, in addition to the current delegation to stake pools for block production. DRep delegation will mimic the existing stake delegation mechanisms (via on-chain certificates). Similarly, DRep registration will mimic the existing stake registration mechanisms. Additionally, registered DReps will need to vote regularly to still be considered active. Specifically, if a DRep does not submit any votes for drepActivity-many epochs, the DRep is considered inactive, where drepActivity is a new protocol paremater. Inactive DReps do not count towards the active voting stake anymore. The reason for marking DReps as inactive is so that DReps who stop participating but still have stake delegated to them do not eventually leave the system in a state where no governance action can pass.</p>

    <p class="mt-4">
        Registered DReps are identified by a credential that can be either:
    </p>

    <ul class="list-disc ml-10 mt-6">
        <li class="mb-2 ">A verification key (Ed25519)</li>
        <li class="mb-2">A native or Plutus script</li>
    </ul>

    <p class="mt-6">
        The blake2b-224 hash digest of a serialized DRep credential is called the DRep ID.
    </p>
    <p class="mt-9">
        The following new types of certificates will be added for governance: DRep registration certificates, DRep retirement certificates, and vote delegation certificates.
    </p>

    <p class="font-semibold mt-8">DRep registration certificates</p>
    <p class="mt-6">
        DRep registration certificates include:
    </p>

    <ul class="list-disc ml-10 mt-10">
        <li class="mb-2 ">a DRep ID</li>
        <li class="mb-2">a deposit</li>
        <li class="mb-2">a stake credential (for the deposit return)</li>
        <li class="mb-2">an optional anchor</li>
    </ul>

    <p class="mt-10">An <b>anchor</b> is a pair of:</p>
    <ul class="list-disc ml-10 mt-10">
        <li class="mb-2 ">a URL to a JSON payload of metadata</li>
        <li class="mb-2">a hash of the contents of the metadata URL</li>

    </ul>

    <p class="mt-5">
        The structure and format of this metadata is deliberately left open in this CIP. The on-chain rules will not check either the URL or the hash. Client applications should, however, perform the usual sanity checks when fetching content from the provided URL.
    </p>

    <p class="font-semibold mt-8">DRep retirement certificates</p>
    <p class="mt-6">
        DRep retirement certificates include:
    </p>
    <ul class="list-disc ml-10 mt-10">
        <li class="mb-2 ">a DRep ID</li>
        <li class="mb-2">the epoch number after which the DRep will retire</li>
        <li class="mb-2">an optional anchor</li>
    </ul>
    <p class="mt-8">
        Note that a DRep is retired immediately upon the chain accepting a retirement certificate, and the deposit is returned as part of the transaction that submits the retirement certificate (the same way that stake credential registration deposits are returned).
    </p>

    <p class="font-semibold mt-8">Vote delegation certificates</p>
    <p class="mt-6">
        Vote delegation certificates include:
    </p>
    <ul class="list-disc ml-10 mt-10">
        <li class="mb-2 ">the DRep ID to which the stake should be delegated</li>
        <li class="mb-2">the stake credential for the delegator</li>
        <li class="mb-2">an optional anchor</li>
    </ul>
    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note</b> <br>DRep delegation always maps a stake credential to a DRep credential. This means that a DRep cannot delegate voting stake to another DRep.
        </p>
    </div>

    <p class="font-semibold mt-8">Certificate authorization schemes</p>
    <p class="mt-6">The authorization scheme (i.e. which signatures are required for registration, retirement or delegation) mimics the existing stake delegation certificate authorization scheme.</p>
    <p><!-- TODO: Provide CBOR specification in the annexe for those new certificates. --></p>

    <h3 class="font-semibold text-xl  mt-8">New stake distribution for DReps</h3>
    <p class="mt-5">
        In addition to the existing per-stake-credential distribution and the per-stake-pool distribution, the ledger will now also determine the per-DRep stake distribution. This distribution will determine how much stake is backed by each Yes vote from a DRep.
    </p>
    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note</b> <br><br><b>Unlike</b> the distribution that is used for block production, we will always use the most current version of the per-DRep stake distribution as given on the epoch boundary.
        </p>
        <p class="mt-5">
            This means that <b>for any topic which individual voters care deeply about, they have time to register themselves as a DRep and vote directly. </b>, it means that there may be a difference between the stake that is used for block production and the stake that is used for voting in any given epoch.
        </p>
    </div>
    <h3 class="font-semibold text-xl  mt-8">Incentives for Ada holders to delegate voting stake</h3>
    <p class="mt-6">
        There will be a short bootstrapping phase during which rewards will be earned for stake delegation etc. and may be withdrawn at any time. After this phase, although rewards will continue to be earned for block delegation etc., reward accounts will be blocked from withdrawing any rewards unless their associated stake credential is also delegated to a DRep (either pre-defined or registered). This helps to ensure high participation, and so, legitimacy.
    </p>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note</b> <br> <br>Even though rewards cannot be withdrawn, they are not lost. As soon as a stake credential is delegated (including to a pre-defined DRep), the rewards can be withdrawn.
        </p>
    </div>

    <h3 class="font-semibold text-xl  mt-8">DRep incentives</h3>

    <p class="mt-5">
        DReps arguably need to be compensated for their work. Research on incentive models is still ongoing, and we do not wish to hold up implementation of this CIP while this is resolved.
    </p>

    <p class="mt-5">
        Our interim proposal is therefore to escrow Lovelace from the existing Cardano treasury until this extremely important decision can be agreed on by the community, through the on-chain governance mechanism that is being constructed.
    </p>

    <p class="mt-5">Alternatively, DReps could pay themselves through instances of the "Treasury withdrawal" governance action. Such an action would be auditable on-chain, and should reflect an off-chain agreement between DReps and delegators.</p>

    <!--------------------------- DReps ------------------------> <!--------------------------- Governance Actions ------------------------>

    <h3 class="font-semibold text-xl  mt-8">Governance actions</h3>

    <p class="mt-5">We define seven different types of governance actions. A governance action is an on-chain event that is triggered by a transaction and has a deadline after which it cannot be enacted.</p>

    <ul class="list-disc ml-10 mt-10">
        <li class="mb-2 ">An action is said to be <b>ratified</b> when it gathers enough votes in its favor (through the rules and parameters that are detailed below).</li>
        <li class="mb-2">An action that doesn't collect sufficient Yes votes before its deadline is said to have <b>expired.</b>
        </li>
        <li class="mb-2">An action that has been ratified is said to be <b>enacted </b>once it has been activated on the network.</li>
    </ul>

    <p class="mt-5">Regardless of whether they have been ratified, actions may, however, be <b>dropped without being enacted</b> if, for example, a motion of no confidence is enacted.</p>


    <!--  the first table component -->
    <br>
    @livewire("Tableone")
    <p class="mt-10 ml-2 mr-2">
        <b>Any Ada holder can submit</b> a governance action to the chain. They must provide a deposit of govDeposit Lovelace, which will be returned when the action is finalized (whether it is <b>ratified</b>, has been <b>dropped</b> , or has <b>expired</b>). The deposit amount will be added to the deposit pot, similar to stake key deposits. It will also be counted towards the stake of the reward address it will be paid back to, to not reduce the submitter's voting power to vote on their own (and competing) actions.
    </p>

    <p class="pt-9">
        Note that a motion of no-confidence is an extreme measure that enables Ada holders to revoke the power that has been granted to the current constitutional committee. Any outstanding governance actions, including ones that the committee has ratified or ones that would be enacted this epoch, will be dropped if the motion is enacted.
    </p>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note </b>A <b>single</b> governance action might contain <b>multiple</b> protocol parameter updates. Many parameters are inter-connected and might require moving in lockstep.
        </p>
    </div>

    <h3 class="font-semibold text-xl  mt-8">Ratification</h3>

    <p class="pt-5">
        Governance actions are ratified through on-chain voting actions. Different kinds of governance actions have different ratification requirements but always involve two of the three governance bodies, with the exception of a hard-fork initiation, which requires ratification by all governance bodies. Depending on the type of governance action, an action will thus be ratified when a combination of the following occurs:
    </p>

    <ul class="list-disc ml-10 mt-10">
        <li class="mb-2 ">the constitutional committee approves of the action (the number of members who vote 'Yes' meet the threshold of the constitutional committee)
        </li>
        <li class="mb-2">the DReps approve of the action (the stake controlled by the DReps who vote 'Yes' meets a certain threshold of the total active voting stake)
        </li>
        <li class="mb-2">the SPOs approve of the action (the stake controlled by the SPOs who vote 'Yes' meets a certain threshold over the total registered voting stake)
        </li>
    </ul>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Warning </b>As explained above, different stake distributions apply to DReps and SPOs.
        </p>
    </div>

    <p class="mt-10">
        A successful election of a new constitutional committee, a constitutional change or a hard-fork delays ratification of all other governance actions until the first epoch after their enactment. This gives a new constitutional committee enough time to vote on current proposals, re-evaluate existing proposals with respect to a new constitution, and ensures that the in principle arbitrary semantic changes caused by enacting a hard-fork do not have unintended consequences in combination with other actions.
    </p>

    <h3 class="font-medium text-xl  mt-8">Requirements</h3>

    <p class="mt-10">
        The following table details the ratification requirements for each governance action scenario. The columns represent:
    </p>

    <ul class="list-disc ml-10 mt-10">
        <li class="mb-2 "><b>Governance action type</b><br /> The type of governance action. Note that the protocol parameter updates are grouped into three categories.
        </li>
        <li class="mb-2"><b>Constitutional committee (abbrev. CC)</b><br /> A value of ✓ indicates that the constitutional committee must approve this action.<br /> A value of - means that constitutional committee votes do not apply.
        </li>
        <li class="mb-2"><b>DReps</b><br /> The DRep vote threshold that must be met as a percentage of active voting stake.<br /> A value of - means that DReps votes do not apply.
        </li>
        <li class="mb-2"><b>SPOs</b><br /> The SPO vote threshold which must be met as a percentage of the stake held by all stake pools.<br /> A value of - means that SPO votes do not apply.
        </li>
    </ul>
    @livewire("Tabletwo")
    @livewire("Tablethree")
    @livewire("Tablefour")

</div>
