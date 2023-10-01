<div class="max-w-1000  mx-auto  min-h-100">
    <!-- Content goes here -->
    <div class=" min-h-100 container ">
        <div class=" p-5 left-column mt-5">
            <h3 class="text-2xl font-medium">Abstract</h3>
            <hr>
            <p>
                We propose a revision of Cardano's on-chain governance system to support the new requirements for Voltaire. The existing specialized governance support for protocol parameter updates and MIR certificates will be removed, and two new fields will be added to normal transaction bodies for:
            </p>
            <ol class="list-decimal pl-6 mt-3">
                <li class="mb-2">governance actions</li>
                <li class="mb-2">votes</li>

            </ol>
            <br>

            <p><b>Any Cardano user </b> will be allowed to submit a <b>governance action.</b> We also introduce three distinct governance bodies that have specific functions in this new governance framework:
            </p>
            <ol class="list-decimal pl-6 mt-3">
                <li class="mb-2">a constitutional committee</li>
                <li class="mb-2">a group of delegate representatives (henceforth called <b>DReps</b>)</li>
                <li class="mb-2">the stake pool operators (henceforth called <b>SPOs</b>)</li>
            </ol>

            <br>
            <p>
                Every governance action must be ratified by at least two of these three governance bodies using their on-chain <b>votes</b>. The type of action and the state of the governance system determines which bodies must ratify it.
            </p>
            <br>
            <p>Ratified actions are then enacted on-chain, following a set of well-defined rules.</p>
            <br>

            <p>
                As with stake pools, any Ada holder may register to be a DRep and so choose to represent themselves and/or others. Also, as with stake pools, Ada holders may, instead, delegate their voting rights to any other DRep. Voting rights will be based on the total Ada that is delegated, as a whole number of Lovelace.
            </p>

            <br>

            <p>
                The most crucial aspect of this proposal is therefore the notion of <b>"one Lovelace = one vote".</b>
            </p>


            <br>
            <p class="text-xl font-normal">Acknowledgements</p>


            <br>


            <br>
            <p>Many people have commented on and contributed to the first draft of this document, which was published in November 2022. We would especially like to thank the following people for providing their wisdom and insights:</p>

            <br>
            <ul class="list-disc ml-10">
                <li class="mb-2">Jack Briggs</li>
                <li class="mb-2">Tim Harrison</li>
                <li class="mb-2">Philip Lazos</li>
                <li class="mb-2">Michael Madoff</li>
                <li class="mb-2">Evangelos Markakis</li>
                <li class="mb-2">Joel Telpner</li>
                <li class="mb-2">Thomas Upfield</li>
            </ul>
            <br>
            <p>
                We would also like to thank those who have commented via Github and other channels.
            </p>

            <!--</details> <details> <summary><strong>2023 Colorado Workshop (28/02 → 01/03)</strong></summary>-->

            <br>
            <p>
                In addition, we would like to thank all the attendees of the workshop that was held in Longmont, Colorado on February 28th and March 1st 2023 for their valuable contributions to this CIP, and for their active championing of Cardano's vision for minimal viable governance. These include:
            </p>
            <br>
            <ul class="list-disc ml-10">
                <li class="mb-2">Adam Rusch, ADAO & Summon</li>
                <li class="mb-2">Addie Girouard</li>
                <li class="mb-2">Andrew Westberg</li>
                <li class="mb-2">Darlington Wleh, LidoNation</li>
                <li class="mb-2">Evangelos Markakis</li>
                <li class="mb-2">James Dunseith, Gimbalabs</li>
                <li class="mb-2">Juana Attieh</li>
                <li class="mb-2">Kenric Nelson</li>
                <li class="mb-2">Lloyd Duhon, DripDropz</li>
                <li class="mb-2">Marcus Jay Allen</li>
                <li class="mb-2">Marek Mahut, 5 Binaries</li>
                <li class="mb-2">Markus Gufler</li>
                <li class="mb-2">Matthew Capps</li>
                <li class="mb-2">Mercy, Wada</li>
                <li class="mb-2">Michael Dogali</li>
                <li class="mb-2"> Michael Madoff</li>
                <li class="mb-2">Patrick Tobler, NMKR</li>
                <li class="mb-2">Philip Lazos</li>
                <li class="mb-2">π Lanningham, SundaeSwap</li>
                <li class="mb-2">Rick McCracken</li>
                <li class="mb-2">Romain Pellerin</li>
                <li class="mb-2">Sergio Sanchez Ferreros</li>
                <li class="mb-2">Tim Harrison</li>
                <li class="mb-2">Tsz Wai Wu</li>
            </ul>

            <br>
            <!--</details>-->
            <h3 class="text-2xl font-medium">Motivation: why is this CIP necessary?</h3>
            <hr class="mt-2">
            <br>
            <ul class="list-disc ml-10">
                <li class="mb-2">Goal</li>
                <li class="mb-2">Current design</li>
                <li class="mb-2">Shortcomings of the Shelley governance design</li>
                <li class="mb-2">Out of scope</li>
            </ul>

            <br>
            <h3 class="text-2xl font-medium">Goal</h3>
            <br>
            <p>
                We're heading into the age of Voltaire, laying down the foundations for decentralized decision-making. This CIP describes a mechanism for on-chain governance that will underpin the Voltaire phase of Cardano. The CIP builds on and extends the original Cardano governance scheme that was based on a fixed number of governance keys. It aims to provide a <b>first step</b> that is both valuable and, importantly, is also technically achievable in the <b>near term</b> as part of the proposed Voltaire governance system.
            </p>
            <br>
            <p>It also seeks to act as a jumping-off point for continuing community input, including on appropriate threshold settings and other on-chain settings.
            </p>
            <br>
            <p>
                Subsequent proposals may adapt and extend this proposal to meet emerging governance needs.
            </p>

            <br>

            <p>
                The on-chain Cardano governance mechanism that was introduced in the Shelley ledger era is capable of:
            </p>
            <ol class="list-decimal pl-6 mt-3">
                <li class="mb-2">modifying the values of the protocol parameters (including initiating "hard forks")</li>
                <li class="mb-2">transferring Ada out of the reserves and the treasury (and also moving Ada between the reserves and the treasury)</li>
            </ol>
            <br>

            <p>In the current scheme, governance actions are initiated by special transactions that require Quorum-Many authorizations from the governance keys (5 out of 7 on the Cardano mainnet)1. Fields in the transaction body provide details of the proposed governance action: either i) protocol parameter changes; or ii) initiating funds transfers. Each transaction can trigger both kinds of governance actions, and a single action can have more than one effect (e.g. changing two or more protocol parameters).</p>


            <ul class="list-disc ml-10">
                <li class="mb-2">Protocol parameter updates use transaction field nº6 of the transaction body.</li>
                <li class="mb-2">Movements of the treasury and the reserves use Move Instantaneous Rewards (abbrev. MIR) certificates.</li>

            </ul>
            <br>

            <p>
                Properly authorized governance actions are applied on an epoch boundary (they are <b>enacted</b>).
            </p>
            <br>

            <h3 class="text-2xl font-medium">Hard Forks</h3>
            <br>
            <p>One of the protocol parameters is sufficiently significant to merit special attention: changing the major protocol version enables Cardano to enact controlled hard forks. This type of protocol parameter update therefore has a special status, since stake pools must upgrade their nodes so they can support the new protocol version once the hard fork is enacted.</p>

            <h3 class="text-2xl font-medium">Shortcomings of the Shelley governance design</h3>
            <br>
            <p>
                The Shelley governance design was intended to provide a simple, transitional approach to governance. This proposal aims to address a number of shortcomings with that design that are apparent as we move into Voltaire.
            </p>

            <br>
            <ol class="list-decimal pl-6 mt-3">
                <li class="mb-2">The Shelley governance design gives no room for active on-chain participation of Ada holders. While changes to the protocol are usually the results of discussions with selected community actors, the process is currently driven mainly by the founding entities. Ensuring that everyone can voice their concern is cumbersome, and can be perceived as arbitrary at times.</li>
                <li class="mb-2">Movements from the treasury constitute a critical and sensitive topic. However, they can be hard to track. It is important to have more transparency and more layers of control over these movements.</li>
                <li class="mb-2">While they need to be treated specially by SPOs, hard forks are not differentiated from other protocol parameter changes.</li>
                <li>Finally, while there is currently a somewhat common vision for Cardano that is shared by its founding entities and also by many community members, there is no clearly defined document where these guiding principles are recorded. It makes sense to leverage the Cardano blockchain to record the shared Cardano ethos in an immutable fashion, as a formal Cardano Constitution.</li>
            </ol>

            <br>
            <h3 class="text-2xl font-medium">Out of scope</h3>
            <br>
            <p>The following topics are considered to be out of the scope of this CIP.</p>
            <br>
            <h4 class="text-2xl font-medium">The contents of the constitution</h4>
            <br>
            <p>This CIP focuses only on on-chain mechanisms. The provisions of the initial constitution are extremely important, as are any processes that will allow it to be amended. These merit their own separate and focused discussion.</p>

            <h4 class="text-2xl font-medium">The membership of the constitutional committee</h4>
            <p class="mt-3">This is an off-chain issue.</p>

            <br>
            <h4 class="text-2xl font-medium">Legal issues</h4>
            <p class="mt-3">Any potential legal enforcement of either the Cardano protocol or the Cardano Constitution are completely out of scope for this CIP.</p>
            <br>
            <h4 class="text-2xl font-medium">Off chain standards for governance actions</h4>
            <p class="mt-3">The Cardano community must think deeply about the correct standards and processes for handling the creation of the governance actions that are specified in this CIP. In particular, the role of Project Catalyst in creating treasury withdrawal actions is completely outside the scope of this CIP.</p>

            <br>
            <h4 class="text-2xl font-medium">Ada holdings and delegation</h4>
            <p class="mt-3">How any private companies, public or private institutions, individuals etc. choose to hold or delegate their Ada, including delegation to stake pools or DReps, is outside the scope of this CIP.</p>

            <br>
            <h3 class="text-2xl font-medium">Specification</h3>
            <hr>
            <ul class="list-disc ml-10 mt-10">
                <li class="mb-2 ">The Cardano Constitution</li>
                <li class="mb-2">The constitutional committee</li>
                <li class="mb-2 ml-3">State of no-confidence</li>
                <li class="mb-2 ml-3">Constitutional committee keys</li>
                <li class="mb-2 ml-3">Replacing the constitutional committee</li>
                <li class="mb-2 ml-3">Size of the constitutional committee</li>
                <li class="mb-2 ml-3">Term limits</li>

                <li class="mb-2 mt-10">Delegated representatives (DReps)</li>
                <li class="mb-2 ml-3">Pre-defined DReps</li>
                <li class="mb-2 ml-3">Registered DReps</li>
                <li class="mb-2 ml-3">New stake distribution for DReps</li>
                <li class="mb-2 ml-3">Incentives for Ada holders to delegate voting stake</li>
                <li class="mb-2 ml-3">DRep incentives</li>

                <li class="mb-2 mt-10">Governance actions</li>
                <li class="mb-2 ml-2">Ratification</li>
                <li class="mb-2 ml-3">Requirements</li>
                <li class="mb-2 ml-3">Restrictions</li>

                <li class="mb-2 ml-2 mt-10">Enactment</li>
                <li class="mb-2 ml-2">Lifecycle</li>
                <li class="mb-2 ml-2">Content</li>
                <li class="mb-2 ml-2">Protocol parameter groups</li>

                <li class="mb-2 ">Votes</li>
                <li class="mb-2 ml-2">Governance state</li>
                <li class="mb-2 ml-2">Changes to the stake snapshot</li>
                <li class="mb-2 ml-2">Definitions relating to voting stake</li>

            </ul>



            <h3 class="text-2xl font-medium mt-10">The Cardano Constitution</h3>

            <p class="mt-10">
                The Cardano Constitution is a text document that defines Cardano's shared values and guiding principles. At this stage, the Constitution is an informational document that unambiguously captures the core values of Cardano and acts to ensure its long-term sustainability. At a later stage, we can imagine the Constitution perhaps evolving into a smart-contract based set of rules that drives the entire governance framework. For now, however, the Constitution will remain an off-chain document whose hash digest value will be recorded on-chain. As discussed above, the Constitution is not yet defined and its content is out of scope for this CIP.
            </p>
            <code> &lt;<!--------------------------- Constitutional committee ------------------------>&gt;</code>

            <h3 class="text-2xl font-medium mt-10">The constitutional committee</h3>

            <p class="mt-6">We define a constitutional committee which represents a set of individuals or entities (each associated with a pair of Ed25519 credentials) that are collectively responsible for <b>ensuring that the Constitution is respected.</b>
            </p>
            <p class="mt-10">
            Though it <b>cannot be enforced on-chain,</b> the constitutional committee is only supposed to vote on the constitutionality of governance actions (which should thus ensure the long-term sustainability of the blockchain) and should be replaced (via the <b>no confidence</b>  action) if they overstep this boundary. Said differently, there is a social contract between the constitutional committee and the actors of the network. Although the constitutional committee could reject certain governance actions (by voting 'No' on them), they should only do so when those governance actions are in conflict with the Constitution.
            </p>

            <p class="mt-10">
            For example, if we consider the hypothetical Constitution rule "The Cardano network must always be able to produce new blocks", then a governance action that would reduce the maximum block size to 0 would be, in effect, unconstitutional and so might not be ratified by the constitutional committee. The rule does not, however, specify the smallest acceptable maximum block size, so the constitutional committee would need to determine this number and vote accordingly.
            </p>

            <h3 class="text-2xl font-medium mt-10">State of no-confidence</h3>

            <p class="mt-6">The constitutional committee is considered to be in one of the following two states at all times:
            </p>

            <ul class="list-decimal ml-10 mt-3">
                <li class="mb-2">a normal state (i.e. a state of confidence)</li>
                <li class="mb-2">a state of no-confidence</li>

            </ul>

            <p class="mt-10">
            In a state of no-confidence, the current committee is no longer able to participate in governance actions and must be replaced before any governance actions can be ratified (see below). Any outstanding governance actions are dropped immediately after the protocol enters a state of no-confidence, and will not be enacted.
            </p>

            <h3 class="text-2xl font-medium mt-10">Constitutional committee keys</h3>

            <p class="mt-6">
            The constitutional committee will use a hot and cold key setup, similar to the existing "genesis delegation certificate" mechanism.
            </p>

            <h3 class="text-2xl font-medium mt-10">Replacing the constitutional committee</h3>
 
            <p class="mt-10">
            The constitutional committee can be replaced via a specific governance action ("New constitutional committee", described below) that requires the approval of both the <b>SPOs</b>  and the <b>DReps</b>. The threshold for ratification might be different depending on if the governance is in a state of confidence or a state of no confidence.
            </p>


            <p class="mt-10">
            The new constitutional committee could, in principle, be identical to or partially overlap the outgoing committee as long as the action is properly ratified. This might happen, for example, if the electorate has collective confidence in all or part of the committee and wishes to extend its term of office.
            </p>

            <h3 class="text-2xl font-medium mt-10">Size of the constitutional committee</h3>

            <p class="mt-10">
            Unlike the Shelley governance design, the size of the constitutional committee is not fixed and can be any nonnegative number. It may be changed whenever a new committee is elected ("New constitutional committee and/or threshold"). Likewise, the committee threshold (the fraction of committee Yes votes that are required to ratify governance actions) is not fixed and can also be varied by the governance action. This gives a great deal of flexibility to the composition of the committee. In particular, it is possible to elect an empty committee if the community wishes to abolish the constitutional committee entirely. Note that this is different from a state of no-confidence and still constitutes a governance system capable of enacting proposals.
            </p>

            <p class="mt-10">
            There will be a new protocol parameter for the minimal size of the committee, itself a nonnegative number.
            </p>

            <h3 class="text-2xl font-medium mt-10">Term limits</h3>

            <p class="mt-10">
            Each newly elected constitutional committee will have per-member term limits. Per-member limits allow for a rotation scheme, such as a third of the committee expiring every year. Expired members can no longer vote. Member can also willingly resign early, which will be marked on-chain as an expired member.
            </p>

            <p class="mt-10">
            The system will automatically enter a state of no-confidence when the number of non-expired committee members falls below the minimal size of the committee. For example, a committee of size five with a quorum of three and two expired members can still pass governance actions if all of non-expired members vote Yes. However, if one more member expires then the system enters a state of no-confidence, since the two remaining members are not enough to meet quorum.
            </p>

            <p class="mt-10">
            The maximum term limit is a governance protocol parameter, specified as a number of epochs. During a state of no-confidence, no action can be ratified, so the committee should plan for its own replacement if it wishes to avoid disruption.
            </p>

            <!--------------------------- Constitutional committee ------------------------> <!--------------------------- DReps ------------------------>
            
            <h3 class="text-2xl font-medium mt-10">Delegated representatives (DReps)</h3>

            <div class="mt-10 bg-slate-100 h 20 p-5 border-4  border-l-slate-400" id="darkmode-table">
                <p>
                <b>Warning </b>CIP-1694 DReps <b>should not be conflated</b> with Project Catalyst DReps.
                </p>
            </div>

            <!-- TODO find another name that still points to liquid democracy. -->
            

            @livewire("Predefined")

        </div>




<!--articles-->
        <div class=" right-column max-w-sm p-2">
            @livewire('CommunityTranslations')
            @livewire("Conversations")
            @livewire(" Conversationsone ")
            @livewire(" Conversationstwo ")
            @livewire(" Conversationsthree")
            @livewire(" Conversationsfour")
            @livewire(" Conversationsfive")
            @livewire(" Conversationssix")
            @livewire(" Conversationsseven")
            @livewire(" Conversationseight")
            @livewire(" Conversationsnine")
            @livewire(" Conversationsten")
            @livewire("Conversation11")
            @livewire("Conversation12")
            @livewire("Conversation13")
            @livewire("Conversation14")
            @livewire("Conversation15")
            @livewire("Conversation16")
            @livewire("Conversation17")
            @livewire("Conversation18")
            @livewire("Conversation19")
            @livewire("Conversation20")
        </div>





    </div>
    

</div>