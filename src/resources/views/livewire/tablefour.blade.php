<div>
    <div class="">
        <table class="w-full border border-collapse divide-y divide-gray-200">
            <thead>
                <tr>
                    <th class="px-6 py-3 bg-gray-100 border bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">Governance action type</th>
                    <th class="px-6 py-3 bg-gray-100 border bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">Additional data</th>
                </tr>
            </thead>
            <tbody>
                <!-- Row 1 -->
                <tr>
                    <td class="px-6 py-3 border">1. Motion of no-confidence</td>
                    <td class="px-6 py-3 border">None</td>
                </tr>
                <!-- Row 2 -->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">2. New committee/threshold</td>
                    <td class="px-6 py-3 border">The set of verification key hash digests (members to be removed), a map of verification key hash digests to epoch numbers (new members and their term limit), and a fraction (quorum threshold)</td>
                </tr>
                <!-- Row 3 -->
                <tr>
                    <td class="px-6 py-3 border">3. Update to the Constitution</td>
                    <td class="px-6 py-3 border">A hash digest of the Constitution document</td>
                </tr>
                <!-- Row 4-->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">4. Hard-fork initiation</td>
                    <td class="px-6 py-3 border">The new (greater) major protocol version</td>
                </tr>
                <!-- Row 5 -->
                <tr>
                    <td class="px-6 py-3 border ">5. Protocol parameters changes</td>
                    <td class="px-6 py-3 border">The changed parameters</td>
                </tr>
                <!-- Row 6 -->
                <tr class="bg-gray-200 bg-gray-200 dark:bg-gray-300 dark:bg-opacity-50 dark:text-black">
                    <td class="px-6 py-3 border">6. Treasury withdrawal</td>
                    <td class="px-6 py-3 border">A map from stake credentials to a positive number of Lovelace</td>
                </tr>
                <!-- Row 7 -->
                <tr>
                    <td class="px-6 py-3 border">7. Info</td>
                    <td class="px-6 py-3 border">none</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Warning </b>For treasury withdrawals, there will be upper and lower thresholds on the amount: the withdrawal threshold is the <b>total</b> amount of Lovelace that is withdrawn by the action, not the amount of any single withdrawal if the action specifies more than one withdrawal.
        </p>
    </div>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note </b>The new major protocol version must be precisely one greater than the current protocol version. Any two consecutive epochs will therefore either have the same major protocol version, or the later one will have a major protocol version that is one greater.
        </p>
    </div>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Note </b>There can be no duplicate committee members - each pair of credentials in a committee must be unique.
        </p>
    </div>

    <p class="mt-8">
        Each governance action that is accepted on the chain will be assigned a unique identifier (a.k.a. the governance action ID), consisting of the transaction hash that created it and the index within the transaction body that points to it.
    </p>

    <h3 class="font-medium text-xl  mt-8">Protocol Parameter groups</h3>
    <p class="mt-5">
        We have grouped the protocol parameter changes by type, allowing different thresholds to be set for each group.
    </p>
    <p class="mt-5">
        We are not, however, restricting each protocol parameter governance action to be contained within one group. In case where a governance action carries updates for multiple parameters from different groups, the maximum threshold of all the groups involved will apply to any given such governance action. </p>

    <p class="mt-5">
        The <i>network, economic</i> and <i>technical </i> parameter groups collect existing protocol parameters that were introduced during the Shelley, Alonzo and Babbage eras. In addition, we introduce a new <i>governance </i> group that is specific to the new governance parameters that will be introduced by CIP-1694.
    </p>

    <p class="mt-6">The <b>network group</b> consists of:</p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">maximum block body size (maxBBSize)</li>
        <li class="pb-2">maximum transaction size (maxTxSize)</li>
        <li class="pb-2">maximum block header size (maxBHSize)</li>
        <li class="pb-2">maximum size of a serialized asset value (maxValSize)</li>
        <li class="pb-2">maximum size of a serialized asset value (maxValSize)</li>
        <li class="pb-2">maximum size of a serialized asset value (maxValSize)</li>
        <li class="pb-2">maximum size of a serialized asset value (maxValSize)</li>

    </ul>
    <p class="mt-6">The <b> economic group</b> consists of:</p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">minimum fee coefficient (minFeeA)</li>
        <li class="pb-2">minimum fee constant (minFeeB)</li>
        <li class="pb-2">delegation key Lovelace deposit (keyDeposit)</li>
        <li class="pb-2">pool registration Lovelace deposit (poolDeposit)</li>
        <li class="pb-2">monetary expansion (rho)</li>
        <li class="pb-2">treasury expansion (tau)</li>
        <li class="pb-2">minimum fixed rewards cut for pools (minPoolCost)</li>
        <li class="pb-2">minimum Lovelace deposit per byte of serialized UTxO (coinsPerUTxOByte)</li>
        <li class="pb-2">prices of Plutus execution units (prices)</li>
    </ul>

    <p class="mt-6">The <b> technical group </b> consists of:</p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">pool pledge influence (a0)</li>
        <li class="pb-2">pool retirement maximum epoch (eMax)</li>
        <li class="pb-2">desired number of pools (nOpt)</li>
        <li class="pb-2">Plutus execution cost models (costModels)</li>
        <li class="pb-2">proportion of collateral needed for scripts (collateralPercentage)</li>
    </ul>

    <p class="mt-6">The <b> governance group </b> consists of all the new protocol parameters that are introduced in this CIP:</p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">governance voting thresholds ($P_1$, $P_{2a}$, $P_{2b}$, $P_3$, $P_4$, $P_{5a}$, $P_{5b}$, $P_{5c}$, $P_6$, $P_7$, $Q_1$, $Q_{2b}$, $Q_4$)</li>
        <li class="pb-2">constitutional committee term limits</li>
        <li class="pb-2">governance action expiration</li>
        <li class="pb-2">governance action deposit (govDeposit)</li>
        <li class="pb-2">DRep deposit amount (drepDeposit)</li>
        <li class="pb-2">DRep activity period (drepActivity)</li>
        <li class="pb-2">minimal constitutional committee size</li>
        <li class="pb-2">maximum term limit (in epochs) of the constitutional committee</li>
    </ul>

    <p>
        <!-- TODO: - Decide on the initial values for the new governance parameters - Decide on coherence conditions on the voting thresholds. For example, the threshold for a motion of no-confidence should arguably be higher than that of a minor treasury withdrawal. --> <!--------------------------- Governance Actions ------------------------> <!--------------------------- Votes ------------------------>
    </p>

    <h3 class="font-medium text-2xl  mt-8">Votes</h3>

    <p class="mt-4">Each vote transaction consists of the following:</p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">a governance action ID</li>
        <li class="pb-2">a role - constitutional committee member, DRep, or SPO</li>
        <li class="pb-2">a governance credential witness for the role</li>
        <li class="pb-2">an optional anchor (as defined above) for information that is relevant to the vote</li>
        <li class="pb-2">a 'Yes'/'No'/'Abstain' vote</li>
    </ul>

    <p class="mt-4">For SPOs and DReps, the number of votes that are cast (whether 'Yes', 'No' or 'Abstain') is proportional to the Lovelace that is delegated to them at the point the action is checked for ratification. For constitututional committee members, each current committee member has one vote. Votes from unregistered SPOs or DReps count as having zero stake.</p>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Warning</b>'Abstain' votes are not included in the "active voting stake".
        </p>
        <p class="mt-3">
            Note that an explicit vote to abstain differs from abstaining from voting. Unregistered stake that did not vote behaves like an 'Abstain' vote, while registered stake that did not vote behaves like a 'No' vote. To avoid confusion, we will only use the word 'Abstain' from this point onward to mean an on-chain vote to abstain.
        </p>
    </div>

    <p class="mt-6">
        The governance credential witness will trigger the appropriate verifications in the ledger according to the existing UTxOW ledger rule (i.e. a signature check for verification keys, and a validator execution with a specific vote redeemer and new Plutus purpose for scripts).
    </p>

    <p class="mt-6">
        Votes can be cast multiple times for each governance action by a single credential. Correctly submitted votes override any older votes for the same credential and role. That is, the voter may change their position on any action if they choose. As soon as a governance action is ratified, voting ends and transactions containing further votes are invalid.
    </p>
    <h3 class="font-medium text-2xl  mt-8">Governance state</h3>

    <p class="mt-3">
        When a governance action is successfully submitted to the chain, its progress will be tracked by the ledger state. In particular, the following will be tracked:
    </p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">the governance action ID</li>
        <li class="pb-2">the epoch that the action expires</li>
        <li class="pb-2">the deposit amount</li>
        <li class="pb-2">the rewards address that will receive the deposit when it is returned</li>
        <li class="pb-2">the total 'Yes'/'No'/'Abstain' votes of the constitutional committee for this action</li>
        <li class="pb-2">the total 'Yes'/'No'/'Abstain' votes of the DReps for this action</li>
        <li class="pb-2">the total 'Yes'/'No'/'Abstain' votes of the SPOs for this action</li>
    </ul>

    <h3 class="font-medium text-2xl  mt-8">Changes to the stake snapshot</h3>

    <p class="mt-3">
        Since the stake snapshot changes at each epoch boundary, a new tally must be calculated when each unratified governance action is checked for ratification. This means that an action could be enacted even though the DRep or SPO votes have not changed (since the vote delegation could have changed).
    </p>

    <h3 class="font-medium text-2xl  mt-8">Definitions relating to voting stake</h3>


    <p class="mt-3">
        We define a number of new terms related to voting stake:
    </p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">Lovelace contained in a transaction output is considered active for voting (that is, it forms the "active voting stake"):</li>
        <li class="pb-2">It contains a registered stake credential.</li>
        <li class="pb-2">The registered stake credential has delegated its voting rights to a registered DRep.</li>
        <li class="pb-2">Relative to some percentage P, a DRep (SPO) vote threshold has been met if the sum of the relative stake that has been delegated to the DReps (SPOs) that vote 'Yes' to a governance action is at least P.</li>
    </ul>

    <h3 class="font-medium text-2xl  mt-8">Rationale</h3>
    <hr class="px-20 mt-5">

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">Role of the constitutional committee</li>
        <li class="pb-2">Intentional omission of identity verification</li>
        <li class="pb-2">Reducing the power of entities with large amounts of Ada</li>
        <li class="pb-2">Piggybacking on stake pool stake distribution</li>
        <li class="pb-2">Separation of hard-fork initiation from standard protocol parameter changes</li>
        <li class="pb-2">Treasury withdrawals vs Project Catalyst</li>
        <li class="pb-2">The purpose of the DReps</li>
        <li class="pb-2">Ratification requirements table</li>
        <li class="pb-2">Motion of no-confidence</li>
        <li class="pb-2">New committee/threshold (state of no-confidence)</li>
        <li class="pb-2">The versatility of the info governance action</li>
        <li class="pb-2">Hard-fork initiation</li>
        <li class="pb-2">New metadata structures</li>
        <li class="pb-2">Controlling the number of active governance actions</li>
        <li class="pb-2">No AVST</li>
    </ul>

    <h3 class="font-medium text-2xl  mt-8">Role of the constitutional committee</h3>

    <p class="mt-3">
        At first sight, the constitutional committee may appear to be a special committee that has been granted extra power over DReps. However, because DReps can replace the constitutional committee at any time and DRep votes are also required to ratify every governance action, the constitutional committee has no more (and may, in fact, have less) power than the DReps. Given this, what role does the committee play, and why is it not superfluous? The answer is that the committee solves the bootstrapping problem of the new governance framework. Indeed, as soon as we pull the trigger and enable this framework to become active on-chain, then without a constitutional committee, there would rapidly need to be sufficient DReps, so that the system did not rely solely on SPO votes. We cannot yet predict how active the community will be in registering as DReps, nor how reactive other Ada holders will be regarding delegation of votes.
    </p>

    <p class="mt-3">
        Thus, the constitutional committee comes into play to make sure that the system can transition from its current state into fully decentralized governance in due course. Furthermore, in the long run, the committee can play a mentoring and advisory role in the governance decisions by being a set of elected representatives who are put under the spotlight for their judgment and guidance in governance decisions. Above all, the committee is required at all times to adhere to the Constitution and to ratify proposals in accordance with the provisions of the Constitution.
    </p>

    <h3 class="font-medium text-2xl  mt-8">Intentional Omission of Identity Verification</h3>

    <p class="mt-3">
        Note that this CIP does not mention any kind of identity validation or verification for the members of the constitutional committee or the DReps.
    </p>

    <p class="mt-3">
        This is intentional.
    </p>
    <p class="mt-3">
        We hope that the community will strongly consider only voting for and delegating to those DReps who provide something like a DID to identify themselves. However, enforcing identity verification is very difficult without some centralized oracle, which we consider to be a step in the wrong direction.</p>

    <h3 class="font-medium text-2xl  mt-8">Reducing the power of entities with large amounts of Ada</h3>

    <p class="mt-3">Various mechanisms, such as quadratic voting, have been proposed to guard against entities with a large amount of influence. In a system based on "1 Lovelace, 1 vote", however, it is trivially easy to split stake into small amounts and undo the protections. Without an on-chain identity verification system we cannot adopt any such measures.</p>

    <h3 class="font-medium text-2xl  mt-8">Piggybacking on stake pool stake distribution</h3>

    <p class="mt-5">The Cardano protocol is based on a Proof-of-Stake consensus mechanism, so using a stake-based governance approach is sensible. However, there are many ways that could be used to define how to record the stake distribution between participants. As a reminder, network addresses can currently contain two sets of credentials: one to identify who can unlock funds at an address (a.k.a. payment credentials) and one that can be delegated to a stake pool (a.k.a. delegation credentials).</p>

    <p class="mt-5">Rather than defining a third set of credentials, we instead propose to re-use the existing delegation credentials, using a new on-chain certificate to determine the governance stake distribution. This implies that the set of DReps can (and likely will) differ from the set of SPOs, so creating balance. On the flip side, it means that the governance stake distribution suffers from the same shortcomings as that for block production: for example, wallet software providers must support multi-delegation schemes and must facilitate the partitioning of stake into sub-accounts should an Ada holder desire to delegate to multiple DReps, or an Ada holder must manually split their holding if their wallet does not support this.</p>

    <p class="mt-5">However, this choice also limits future implementation effort for wallet providers and minimizes the effort that is needed for end-users to participate in the governance protocol. The latter is a sufficiently significant concern to justify the decision. By piggybacking on the existing structure, the system remains familiar to users and reasonably easy to set up. This maximizes both the chance of success of, and the rate of participation in, the governance framework.</p>


    <h3 class="font-medium text-2xl  mt-8">Separation of Hard Fork Initiation from Standard Protocol Parameter Changes</h3>

    <p class="mt-5">In contrast to other protocol parameter updates, hard forks (or, more correctly, changes to the protocol's major version number) require much more attention. Indeed, while other protocol parameter changes can be performed without significant software changes, a hard fork assumes that a super-majority of the network has upgraded the Cardano node to support the new set of features that are introduced by the upgrade. This means that the timing of a hard fork event must be communicated well ahead of time to all Cardano users, and requires coordination between stake pool operators, wallet providers, DApp developers, and the node release team.</p>


    <p class="mt-7">Hence, this proposal, unlike the Shelley scheme, promotes hard fork initiations as a standalone governance action, distinct from protocol parameter updates.</p>

    <h3 class="font-medium text-2xl  mt-8">The purpose of the DReps</h3>

    <p class="mt-7">Nothing in this proposal limits SPOs from becoming DReps. Why do we have DReps at all? The answer is that SPOs are chosen purely for block production and not all SPOs will want to become DReps. Voters can choose to delegate their vote to DReps without needing to consider whether they are also a good block producer, and SPOs can choose to represent Ada holders or not.</p>

    <h3 class="font-medium text-2xl  mt-8">Ratification Requirements Table</h3>
    <p class="mt-7">The requirements in the ratification requirement table are explained here. Most of the governance actions have the same kind of requirements: the constitutional committee and the DReps must reach a sufficient number of 'Yes' votes. This includes these actions:</p>


    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">New committee/threshold (normal state)</li>
        <li class="pb-2">Update to the Constitution</li>
        <li class="pb-2">Protocol parameter changes</li>
        <li class="pb-2">Treasury withdrawal</li>
    </ul>

    <h3 class="font-medium text-2xl  mt-8">Motion of no-confidence</h3>
    <p class="mt-5">A motion of no-confidence represents a lack of confidence by the Cardano community in the current constitutional committee, and hence the constitutional committee should not be included in this type of governance action. In this situation, the SPOs and the DReps are left to represent the will of the community.</p>

    <h3 class="font-medium text-2xl  mt-8">New committee/threshold (state of no-confidence)</h3>

    <p class="mt-5">Similar to the motion of no-confidence, electing a constitutional committee depends on both the SPOs and the DReps to represent the will of the community.</p>

    <h3 class="font-medium text-2xl  mt-8">The versatility of the info governance action</h3>
    <p class="mt-5">While not binding on chain, the Info governance action could be useful in an number of situations. These include:</p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2">ratifying a CIP</li>
        <li class="pb-2">deciding on the genesis file for a new ledger era</li>
        <li class="pb-2">recording initial feedback for future governance actions</li>
    </ul>

    <h3 class="font-medium text-2xl  mt-8">Hard-Fork initiation</h3>
    <p class="mt-5">Regardless of any governance mechanism, SPO participation is needed for any hard fork since they must upgrade their node software. For this reason, we make their cooperation explicit in the hard fork initiation governance action, by always requiring their vote. The constitutional committee also votes, signaling the constitutionality of a hard fork. The DReps also vote, to represent the will of every stake holder.</p>

    <h3 class="font-medium text-2xl  mt-8">New Metadata structures</h3>
    <p class="mt-5">Both the governance actions and the votes use new metadata fields, in the form of URLs and integrity hashes (mirroring the metadata structure for stake pool registration). The metadata is used to provide context. Governance actions need to explain why the action is needed, what experts were consulted, etc. Since transaction size constraints should not limit this explanatory data, we use URLs instead.</p>

    <p class="mt-5">
        This does, however, introduce new problems. If a URL does not resolve, what should be the expectation for voting on that action? Should we expect everyone to vote 'No'? Is this an attack vector against the governance system? In such a scenario, the hash pre-image could be communicated in other ways, but we should be prepared for the situation. Should there be a summary of the justification on chain?
    </p>

    <h3 class="font-medium text-2xl  mt-8">Alternative: Use of transaction metadata</h3>

    <p class="mt-5">
        Instead of specific dedicated fields in the transaction format, we could instead use the existing transaction metadata field.
    </p>

    <p class="mt-5">
        Governance-related metadata can be clearly identified by registering a CIP-10 metadata label. Within that, the structure of the metadata can be determined by this CIP (exact format TBD), using an index to map the vote or governance action ID to the corresponding metadata URL and hash.
    </p>

    <p class="mt-5">
        This avoids the need to add additional fields to the transaction body, at the risk of making it easier for submitters to ignore. However, since the required metadata can be empty (or can point to a non-resolving URL), it is already easy for submitters to not provide metadata, and so it is unclear whether this makes the situation worse.
    </p>

    <p class="mt-5">
        Note that transaction metadata is never stored in the ledger state, so it would be up to clients to pair the metadata with the actions and votes in this alternative, and would not be available as a ledger state query.
    </p>

    <h3 class="font-medium text-2xl  mt-8">Controlling the number of active governance actions</h3>
    <p class="mt-5">
        Since governance actions are available for anyone to submit, we need some mechanism to prevent those individuals responsible for voting from becoming overwhelmed with a flood of proposals. A large deposit is one such mechanism, but this comes at the unfortunate cost of being a barrier for some people to submit an action. Note, however, that crowd-sourcing with a Plutus script is always an option to gather the deposit.
    </p>
    <p class="mt-5">
        We could, alternatively, accept the possibility of a large number of actions active at any given time, and instead depend on off-chain socialization to guide voters' attention to those that merit it. In this scenario, the constitutional committee might choose to only consider proposals which have already garnered enough votes from the DReps.
    </p>

    <h3 class="font-medium text-2xl  mt-8">No AVST</h3>
    <p class="mt-5">
        An earlier draft of this CIP included the notion of an "active voting stake threshold", or AVST. The purpose of AVST was to ensure the legitimacy of each vote, removing the possibility that, for example, 9 out of 10 Lovelace could decide the fate of millions of entities on Cardano. There are really two concerns here, which are worth separating.
    </p>
    <p class="mt-5">
        The first concern is that of bootstrapping the system, i.e. reaching the initial moment when sufficient stake is registered to vote. The second concern is that the system could lose participation over time. One problem with the AVST is that it gives an incentive for SPOs to desire a low voting registration (since their votes then hold more weight). This is absolutely not a slight on the existing SPOs, but an issue with bad incentives.
    </p>
    <p class="mt-5">
        We have chosen, therefore, to solve the two concerns differently. We solve the bootstrapping problem as described in the section on bootstrapping. We solve the long-term participation problem by not allowing reward withdrawals (after the bootstrap phase) unless the stake is delegated to a DRep (including the two special cases, namely 'Abstain' and 'No confidence').
    </p>

    <h3 class="font-medium text-2xl  mt-8">Path to Active</h3>
    <hr class=" mt-4">
    <h3 class="font-medium text-2xl  mt-1">Acceptance Criteria</h3>
    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2"><input type="checkbox" id="myCheckbox" disabled> A new ledger era is enabled on the Cardano mainnet, which implements the above specification.</li>
    </ul>

    <h3 class="font-medium text-2xl  mt-8">Implementation Plan</h3>
    <p class="mt-5">
        The features in this CIP require a hard fork.
    </p>
    <p class="mt-5">
        This document describes an ambitious change to Cardano governance. We propose to implement the changes via <b>one hard fork.</b>
    </p>
    <p class="mt-5">
        In the following sections, we give more details about the various implementation work items that have already been identified. In addition, the final section exposes a few open questions which will need to be finalized. We hope that those questions can be addressed through community workshops and discussions
    </p>

    <h3 class="font-medium text-2xl  mt-8">Ratification of this proposal</h3>

    <p class="mt-7">
        The ratification of this proposal is something of a circular problem: we need some form of governance framework in order to agree on what the final governance framework should be. As has been stated many times, CIPs are not authoritative, nor are they a governance mechanism. Rather, they describe technical solutions that have been deemed sound (from a technical standpoint) by community of experts.
    </p>

    <p class="mt-7">
        CIP-1694 arguably goes beyond the usual scope of the CIP process and there is a strong desire to ratify this CIP through some process. However, that process is yet to be defined and it remains an open question. The final ratification process is likely to be a blend of various ideas, such as:
    </p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2"><input type="checkbox" id="myCheckbox" disabled> Gather opinions from community-held workshops, akin to the Colorado workshop of February-March 2023.</li>
        <li class="pb-2"><input type="checkbox" id="myCheckbox" disabled> Exercise voting actions on a public testnet, with sufficient participation.</li>
        <li class="pb-2"><input type="checkbox" id="myCheckbox" disabled> Poll the established SPOs.</li>
        <li class="pb-2"><input type="checkbox" id="myCheckbox" disabled> Leverage Project Catalyst to gather inputs from the existing voting community (albeit small in terms of active stake).</li>
    </ul>

    <h3 class="font-medium text-2xl  mt-8">Changes to the transaction body</h3>
    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2"><input type="checkbox" id="myCheckbox" disabled> New elements will be added to the transaction body, and existing update and MIR capabilities will be removed. In particular, The governance actions and votes will comprise two new transaction body fields.</li>
        <li class="pb-2"><input type="checkbox" id="myCheckbox" disabled> Three new kinds of certificates will be added in addition to the existing <br> ones:</li>
        <li class="pb-2 ml-3">DRep registration</li>
        <li class="pb-2 ml-3">DRep de-registration</li>
        <li class="pb-2 ml-3">Vote delegation</li>
        <p class="mt-3">And similarly, the current MIR and genesis certificates will be removed.</p>
        <li class="pb-2"><input type="checkbox" id="myCheckbox" disabled> A new Voting purpose will be added to Plutus script contexts. This will provide, in particular, the vote to on-chain scripts.</li>
    </ul>

    <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
        <p>
            <b>Warning</b> As usual, we will provide a CDDL specification for each of those changes.
        </p>

    </div>
    <h3 class="font-medium text-2xl  mt-8">Changes to the existing ledger rules</h3>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2 ml-3">The PPUP transition rule will be rewritten and moved out of the UTxO rule and into the LEDGER rule as a new TALLY rule. It will process and record the governance actions and votes.</li>
        <li class="pb-2 ml-3">The NEWEPOCH transition rule will be modified.</li>
        <li class="pb-2 ml-3">The MIR sub-rule will be removed.</li>
        <li class="pb-2 ml-3">A new RATIFY rule will be introduced to stage governance actions for enactment. It will ratify governance actions, and stage them for enactment in the current or next epoch, as appropriate.</li>
        <li class="pb-2 ml-3">A new ENACTMENT rule will be called immediately after the EPOCH rule. This rule will enact governance actions that have previously been ratified.</li>
        <li class="pb-2 ml-3">The EPOCH rule will no longer call the NEWPP sub-rule or compute whether the quorum is met on the PPUP state.</li>
    </ul>

    <h3 class="font-medium text-2xl  mt-8">Changes to the local state-query protocol</h3>

    <p class="mt-7">
        The on-chain governance workload is large, but the off-chain workload for tools and applications will arguably be even larger. To build an effective governance ecosystem, the ledger will have to provide interfaces to various governance elements.
    </p>

    <p class="mt-7">
        While votes and DReps (de)registrations are directly visible in blocks and will, therefore, be accessible via the existing local-chain-sync protocols; we will need to upgrade the local-state-query protocol to provide extra insights on information which are harder to infer from blocks (i.e. those that require maintaining a ledger state). New state queries should cover (at least):
    </p>

    <ul class="list-disc mt-4 ml-10">
        <li class="pb-2 ml-3">Governance actions currently staged for enactment</li>
        <li class="pb-2 ml-3">Governance actions under ratification, with the total and percentage of yes stake, no stake and abstain stake</li>
        <li class="pb-2 ml-3">The current constitutional committee, and constitution hash digest</li>
    </ul>


    <h3 class="font-medium text-2xl  mt-8">Bootstrapping Phase</h3>

    <p class="mt-5">
        We will need to be careful how we bootstrap this fledgling government. All the parties that are involved will need ample time to register themselves and to become familiar with the process.
    </p>
    <p class="mt-5">
        Special provisions will apply in the initial bootstrap phase. Firstly, during the bootstrap phase, a vote from the constitutional committee is sufficient to change the protocol parameters. Secondly, during the bootstrap phase, a vote from the constitutional committee, together with a sufficient SPO vote, is sufficient to initiate a hard fork. No other actions are possible during the bootstrap phase.
    </p>
    <p class="mt-5">
        The bootstrap phase ends when a given number of epochs has elapsed, as specified in the next ledger era configuration file. This is likely to be a number of months after the hard fork.
    </p>
    <p class="mt-5">
        Moreover, there will be an interim Constitutional committee, also specified in the next ledger era configuration file, whose term limits will be set to expire when the bootstrap phase ends. The rotational schedule of the first non-bootstrap committee could be included in the constitution itself. Note, however, that since the constitutional committee never votes on new committees, it cannot actually enforce the rotation.
    </p>

    <h3 class="font-medium text-2xl  mt-8">Final safety measure, post bootstrapping</h3>

    <p class="mt-7">
        Many people have stated that they believe that the actual voting turnout will not be so large as to be a strain on the throughput of the system. We also believe that this is likely to be the case, but when the bootstrap phase ends we will put one final, temporary safety measure in place (this will also allow us to justify a low DRep deposit amount).
    </p>
    <p class="mt-7">
        For values of $X$ and $Y$ that are still to be determined, as soon as the bootstrap phase has ended, when we calculate the DReps stake distribution for the next epoch boundary, we will consider only those DReps that are either in the top $X$-many DReps ranked by stake amount, or those DReps that have at least $Y$ Lovelace. Every epoch, the value of $X$ will increase and the value of $Y$ will decrease, so that eventually $X$ will be effectively infinite and $Y$ will be zero. Note that this is only an incentive, and nothing actually stops any DRep from casting their vote (though it will not be counted if it does not meet the requirements).
    </p>
    <p class="mt-7">
        If the community decides at some point that there is indeed a problem with congestion, then a hard fork could be enacted that limits the number of DReps in a more restrictive way.
    </p>
    <p class="mt-7">
        Reasonable numbers for the initial value of $X$ are probably 5,000-10,000. Reasonable numbers for the initial value of $Y$ are probably the total number of Lovelace divided by the initial value of $X$.
    </p>
    <p class="mt-7">
        The mechanism should be set to relax at a rate where the restriction is completely eliminated after a period of six months to one year.
    </p>

    <h3 class="font-medium text-2xl  mt-8">Other Ideas / Open Questions</h3>
    <p class="text-bold text-lg mt-6">Pledge-weighted SPO voting</p>
    <p class="mt-7">
        The SPO vote could additionally be weighted by each SPO's pledge. This would provide a mechanism for allowing those with literal stake in the game to have a stronger vote. The weighting should be carefully chosen. </p>

    <p class="text-bold text-lg mt-6">Automatic re-delegation of DReps</p>
    <p class="mt-7">
        A DRep could optionally list another DRep credential in their registration certificate. Upon retirement, all of the DRep's delegations would be automatically transferred to the given DRep credential. If that DRep had already retired, the delegation would be transfer to the 'Abstain' DRep.</p>

    <p class="text-bold text-lg mt-6">No DRep registration</p>
    <p class="mt-7">
        Since the DRep registration does not perform any necessary functions, the certificates for (de-)registering DReps could be removed. This makes the democracy more liquid since it removes some bureaucracy and also removes the need for the DRep deposit, at the cost of moving the anchor that is part of the DRep registration certificate into the transaction metadata.</p>

    <p class="text-bold text-lg mt-6">Reduced deposits for some government actions</p>
    <p class="mt-7">
        The deposit that is attached to governance actions exists to prevent a flood of non-serious governance actions, each of which would require time and attention from the Cardano community. We could reduce this deposit for proposals which go through some agreed upon off-chain process. This would be marked on-chain by the endorsement of at least one constitutional committee member. The downside of this idea is that it gives more power to the constitutional committee.</p>

    <p class="text-bold text-lg mt-6">Include hash of (future) genesis configuration within hard-fork proposal</p>
    <p class="mt-7">
        Some hard-forks require new genesis configurations. This has been the case for the Shelley and Alonzo hard forks (but not Allegra, Mary, Vasil or Valentine), may be the case in the future. At the moment, this proposal doesn't state anything about such a genesis configuration: it is implicitly assumed to be an off-chain agreement. We could however, enforce that (the hash of) a specific genesis configuration is also captured within a hard-fork governance action.</p>

    <p class="text-bold text-lg mt-6">Adaptive thresholds</p>
    <p class="mt-7">
        As discussed above, it may make sense for some or all thresholds to be adaptive with respect to the Lovelace that is actively registered to vote, so that the system provides greater legitimacy when there is only a low level of active voting stake. The bootstrapping mechanism that is proposed above may subsume this, however, by ensuring that the governance system is activated only when a minimum level of stake has been delegated to DReps.</p>


    <p class="text-bold text-lg mt-6">Renaming DReps / state of no-confidence?</p>
    <p class="mt-7">
        It has been stated several times that "DReps" as presented here, might be confused with Project Catalst DReps. Similarly, some people have expressed confusion between the state of no-confidence, the motion of no-confidence and the no-confidence DReps.
    </p>

    <p class="mt-8">
        We could imagine finding better terms for these concepts.
    </p>

    <p class="text-bold text-lg mt-6">Rate-limiting treasury movements</p>
    <p class="mt-7">
        Nothing prevents money being taken out of the treasury other than the proposed votes and voting thresholds. Given that the Cardano treasury is a quite fundamental component of its monetary policy, we could imagine enforcing (at the protocol level) the maximum amount that can removed from the treasury over any period of time.</p>


    <h3 class="font-medium text-2xl  mt-8">Copyright</h3>
    <hr class="border-t-2 border-gray-300 my-4">

    <p>
        This CIP is licensed under CC-BY-4.0
    </p>

    <ul class="list-decimal mt-4 ml-10">
        <li class="pb-2 ml-3">Governance actions currently staged for enactment</li>
        <ul class="list-disc mt-4 ml-10">
            <li>For protocol parameter changes (including hard forks), the PPUP transition rule (Figure 13) describes how protocol parameter updates are processed, and the NEWPP transition rule (Figure 43) describes how changes to protocol parameters are enacted.</li>
            <li>
                For funds transfers, the DELEG transition rule (Figure 24) describes how MIR certificates are processed, and the MIR transition rule (Figure 55) describes how treasury and reserve movements are enacted.
            </li>
            <div class="mt-10 bg-slate-100 h 20 p-5 border-l-2  border-l-slate-400 dark:bg-gray-300 dark:bg-opacity-50 dark:border-l-white">
                <p>
                    <b>Note </b>The capabilities of the MIR transition rule were expanded in the Alonzo ledger specification
                </p>

            </div>
            ↩
        </ul>
        <li>
            There are many varying definitions of the term "hard fork" in the blockchain industry. Hard forks typically refer to non-backwards compatible updates of a network. In Cardano, we formalize the definition slightly more by calling any upgrade that would lead to more blocks being validated a "hard fork" and force nodes to comply with the new protocol version, effectively obsoleting nodes that are unable to handle the upgrade. ↩
        </li>
    </ul>




</div>