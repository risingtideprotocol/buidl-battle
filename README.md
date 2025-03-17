# Rising Tide Protocol Documentation
*"A Rising Tide Lifts all Ships"*

*Last Updated: March 15, 2025*  
*Status: Draft*

## Executive Summary

The **Rising Tide Protocol** is a decentralized commerce engine built on the Stacks Blockchain, leveraging Bitcoin’s unmatched security to empower creators, builders, and consumers. It serves as the backbone for peer-to-peer marketplaces, eliminating intermediaries and placing creators firmly in control—all powered by **sBTC**, a trust-minimized bridge to Bitcoin’s economic value. Imagine a digital marketplace where creators connect directly with their audience, free from gatekeepers. That’s Rising Tide—built collaboratively with communities, by creators, for creators.

**Key Features**:
- **Modular Creator Tools**: Enable the creation of interoperable products—media, games, art, and more—with pricing, royalties, and distribution secured on-chain.
- **sBTC at the Core**: Transactions and earnings are conducted in sBTC, anchoring every interaction to Bitcoin’s robust economy.
- **Decentralized Powerhouse**: Clarity smart contracts on Stacks provide speed, scalability, and trustless operations.
- **Ecosystem Boost**: Reusable components fuel custom decentralized applications (dApps), fostering innovation.

Rising Tide recaptures the raw, community-driven spirit of early marketplaces, enhanced by blockchain technology and sBTC to build a creator-first future.

---

## Rising Tide Overview

The Rising Tide Protocol delivers a self-sovereign ecosystem to creators, builders, and consumers. Built on Stacks’ Clarity smart contracts and secured by Bitcoin, it provides a streamlined infrastructure for peer-to-peer marketplaces that cuts out middlemen. It harkens back to the days of direct producer-to-buyer transactions, now reimagined with blockchain and **sBTC**, Stacks’ Bitcoin-pegged asset, for seamless and secure value exchange.

With Bitcoin L1 adoption on the rise and regulatory frameworks emerging, Rising Tide positions Stacks as the bedrock for decentralized commerce. Powered by **sBTC**, the protocol unlocks innovative ways to earn, trade, and collaborate on chain-done fast, trustless, and tied to Bitcoin’s global strength and security.

### Goals
- **Circular Economy**: Create a thriving system grounded in proven commerce models, all running on sBTC.
- **Revenue Streams**: Enable sBTC-based earnings for creators and builders without requiring upfront capital—just talent and effort.
- **Proof of Work**: Reward tangible contributions with sBTC payouts, not hollow promises.
- **Decentralization**: Maximize seller autonomy and buyer trust through sBTC’s transparency.
- **Ecosystem Growth**: Provide tools for composable, sBTC-driven dApps.

### Vision
Rising Tide channels the gritty, community-led energy of early marketplaces into a blockchain toolkit powered by **sBTC**. Leveraging Stacks’ Clarity language, rapid transaction capabilities (post-Nakamoto release), and sBTC’s trustless peg to Bitcoin, it equips creators and developers to build dApps across media, events, games, writing, art, music, and finance—each generating perpetual sBTC revenue. The protocol remains UI-agnostic, offering test harness UIs for developers, while creators and communities (starting with DeOrganized) develop tailored experiences for Live Streaming Media, IRL Events, Gaming, and more
.

*<!-- Placeholder: Add a visual of sBTC flowing through verticals here -->*

### Core Principles
- **Composable Products**: Modular assets (e.g., NFTs combining music and art) embed sBTC pricing and royalties on-chain, bypassing intermediaries.
- **Peer-to-Peer Commerce**: Clarity contracts transfer sBTC directly from buyers to creators, ensuring transparency and efficiency.
- **Creator Control**: Creators deploy and customize products, with sBTC flows secured by Clarity.

---

## Building the Protocol: A Decentralized Process

The Rising Tide Protocol is developed through an innovative, decentralized process that harnesses the expertise of both the core protocol team and engaged communities. This approach ensures that the protocol evolves in a way that is practical, user-focused, and adaptable to various industries.

### Step 1: Entering a Vertical
The process begins with the core protocol team targeting a new industry or vertical:
- **Identifying Patterns**: The team researches the vertical to uncover common industry patterns, workflows, and elements that can be addressed by the protocol.
- **Setting the Foundation**: This analysis informs the initial design of new protocol features tailored to the vertical’s specific needs.

### Step 2: Partnering with Communities
Collaboration is key to this decentralized model:
- **Community Expertise**: The core team partners with a community that has deep knowledge of the vertical—e.g., content creators for Media, or event planners for Events—leveraging their insights to co-design and build a new experience on the protocol.
- **First Mover Advantage**: As early contributors, community members can begin earning rewards and revenue immediately, incentivizing active participation and innovation.

### Step 3: Iterating to Stability
The development process is iterative and collaborative:
- **Design and Implementation**: The core team and community work together to create an initial version of the new experience.
- **Refinement Through Feedback**: Through testing and real-world application, the experience is continuously improved based on user feedback and performance.
- **Stable Baseline**: Iteration persists until a reliable, stable version is achieved, ensuring the experience is robust and ready for widespread use.

### Step 4: Creating SIPs to Formalize Standards
The process concludes with standardization:
- **Proposing SIPs**: Once a stable baseline is established, the core team and community propose Stacks Improvement Proposals (SIPs) to document and formalize the standards and best practices that emerged during development.
- **Decentralized Governance**: These SIPs are reviewed and approved through a community-driven governance process, embedding the new standards into the protocol.

This decentralized method of building the Rising Tide Protocol fosters rapid innovation, empowers communities as co-creators, and ensures that the resulting standards are both practical and widely supported. By combining the strengths of the core team and first-mover communities, the protocol grows organically to meet the demands of its users.

---

## Rising Tide Shared Components

Imagine a creator like Jamie, setting up his decentralized concert, or Maya, crafting her beach poetry collection. They’re not working in isolation—the Rising Tide Protocol weaves their efforts together with shared components that make every vertical hum. These aren’t just technical cogs; they’re the threads that tie assets, revenue, and experiences into a seamless, sBTC-powered ecosystem. Let’s follow a creator’s journey to see how these pieces come to life.

It starts with collaboration. Take Nina, our musician, who’s just teamed up with a lyricist from her community to drop a new track. She wants her contributor to get paid fairly, instantly, without messy off-chain promises. That’s where the protocol’s **creator splits** come in. Nina crafts a Clarity smart contract with the `rt-creator` trait, setting it so 80% of each .00005 sBTC sale flows to her wallet, 15% to her lyricist, and 5% to the protocol. The moment a fan buys the track, the sBTC splits and lands in their wallets—no middlemen, no delays. It’s a poet and graphic designer splitting edition sales, or a game dev and show host sharing lobby profits—teams keep what they earn, secured on-chain.

But what happens when projects grow more complex? Maya, our poet, has a growing collection of haikus and wants to package them with Nina’s digital tracks into a themed bundle—say, a “Coastal Vibes” anthology of poetry and music. The protocol offers **parent/child relationships** to keep it all organized. Using the `rt-parent-child` trait, Maya deploys a parent contract as the anthology’s root, then links child contracts for each haiku and track. She’s the parent owner, so she can add new poems or songs—or remove ones that don’t fit—keeping the collection dynamic and sBTC-priced as a set. It’s like Jamie grouping his Summer Tour shows under one banner or Sam grouping game lobbies by skill level; everything stays hierarchical, manageable, and tied to sBTC, with Maya controlling the bundle’s evolution on-chain.

Then there’s the navigation magic. Fans and creators alike need a way to explore these growing collections—like flipping through folders on a computer. That’s where **deep linking** steps in, powered by the `rt-deeplink` trait. It structures URLs like a folder path, but instead of directories, it navigates the hierarchical structure of smart contracts. Picture a Rising Tide Explorer, styled like Windows File Explorer: Jamie’s Summer Tour folder opens to reveal child contracts for each show’s tickets, Maya’s Coastal Vibes anthology lists her haikus and Nina’s tracks, and Sam’s game assets sit neatly grouped. With `rt-deeplink`, this dynamic browser turns contracts into “files” fans can browse, buy with sBTC, or even peek into—all organized and accessible right from the protocol’s backbone.

### Chainhooks and Rising Tide Data Services
Underpinning it all is the protocol’s live heartbeat—connecting on-chain sBTC actions to off-chain updates. Picture Jamie’s concert tickets selling out. **Chainhooks** catch every sBTC sale on-chain and ping the Rising Tide Indexer, which turns those raw events into rich, structured data—ticket counts, earnings, schedules—fast and scalable. Then, **Data Services**, a RESTful API, beams that info to dApps, dashboards, or tools, blending on-chain sBTC flows with off-chain extras like venue details or analytics.

This event-driven system is a creator’s superpower. A game lobby’s sBTC buy-ins hit the chain, Chainhooks flag it, the Indexer updates availability, and Data Services push it live to every connected app—all in real time. It’s a live event tracker showing Alexa’s AMA stats or a dashboard tallying Nina’s music sales across verticals, keeping Stacks lean by offloading heavy lifting off-chain. For developers, it’s a playground—build custom marketplaces, analytics hubs, or even a game lobby tied to a live stream, all fueled by sBTC, all effortless.

*<!-- Placeholder: Add Data Flow Diagram Here -->*

---

## Rising Tide: Media

Meet Alexa, a streamer with a loyal fanbase and a big idea: a live AMA where fans pay to ask her anything, all powered by **Rising Tide Media**. No platform fees, no gatekeepers—just Alexa, her audience, and **sBTC**.

Alexa starts by filling out a simple form on a live streaming platform. Behind the scenes, the episode details are used to build a smart contract, which Alexa signs to finalize and deploy. This contract serves as an on-chain reservation system for the episode, picked up by the Rising Tide Indexer and made available via the API to any site listing live streaming events.


<img src="https://9ok0w2gk6hipqasu.public.blob.vercel-storage.com/Promote%20on%20X-hjLCqnBtKSaDTgQeiOT8cXAD4PCcBK.png" width="400" height="225">

Fans join by snagging an NFT reservation for .0005 sBTC each, serving as proof of entry minted to their wallets. Alexa sets the split with `rt-creator`: 70% of the sBTC goes to her, 28% to a guest illustrator, and 2% to the protocol. Every sale triggers instant payouts, no waiting around.

For fans, it’s simple: pay sBTC, get an NFT, and join the AMA. Alexa’s already plotting her next move: maybe an sBTC prize for the best question, or NFTs that unlock perks in other verticals. With Rising Tide Media, she’s not just streaming—she’s building a direct, sBTC-powered bond with her fans.


<img src="https://9ok0w2gk6hipqasu.public.blob.vercel-storage.com/Rising%20Tide%20Media%20Architecture-mXsfQXk4P47lwFDPqgXWOvAJADEpXD.png" width="528" height="408">

---

## Rising Tide: Events

Say hello to Jamie, a musician ready to rock his first decentralized concert with **Rising Tide Events**. He’s selling tickets, bundling exclusive goodies, and keeping most of the **sBTC** he earns.

Jamie visits a local event listing website that helps promote local bands. He sets the date of the performance, selects a venue, and links it to his “Summer Tour” series. The new show is now available via the API, not only on the local website but on any platform listing events.

Tickets go for .001 sBTC and can be purchased anywhere that submits a transaction. Jamie has customized the contract so each ticket comes with an NFT bundling a track and album artwork from a friend. The `rt-creator` trait splits the sBTC: 70% to Jamie, 28% to the artist, 2% to the protocol—all automatically. If plans change, Jamie updates the contract with `set-event-info`, staying in full control.

Fans pay sBTC, grab their NFT ticket, and get ready for the show. Now, Jamie’s dreaming bigger: a hybrid concert with a pay-per-view live stream. With Rising Tide Events, he’s not just gigging—he’s crafting a decentralized fan experience.


<img src="https://9ok0w2gk6hipqasu.public.blob.vercel-storage.com/Rising%20Tide%20Events%20Architecture-qJYRLmAdQq84shtkTYRfZibZJJw2Ik.png" width="528" height="408">

---

## Rising Tide: Games

Here’s Sam, a game dev launching a 5x5 tic-tac-toe variant with **Rising Tide Games**. Players pay sBTC to join, winners take the pot, and Sam builds it all on-chain.

Sam deploys a multiplayer lobby contract and sets a .00002 sBTC buy-in. Players pay up, with 75% of the buy-in feeding an sBTC prize pool. The remaining 25% uses `rt-creator` to split revenue: 70% to Sam, 20% to an artist for visuals, 10% to a local charity.

The game’s turn-based, with moves logged on-chain via Clarity for transparency. Winners snag the sBTC prize pot and an NFT trophy—bragging rights included. Sam’s next step? Maybe taking on Connect-4 or a card game. With Rising Tide Games, he’s not just coding—he’s defining a decentralized turn-based gaming protocol.


<img src="https://9ok0w2gk6hipqasu.public.blob.vercel-storage.com/Rising%20Tide%20Games%20Architecture-8ZJkppAnHb0sFAwFH97KQUHGaVfIov.png" width="528" height="408">

---

## Rising Tide: Pages

Meet Maya, a poet with a fresh haiku about the beach. She’s sharing it with **Rising Tide Pages**, earning sBTC, and supporting a cause.

Maya deploys a page contract—part of her digital on-chain notebook. She picks an artist’s beach-themed page style, adds her words, and prices editions at .00006 sBTC. Readers publish a numbered personal edition as an NFT and receive a unique copy in their wallet. With `rt-creator`, sBTC splits 60% to Maya, 28% to the template artist, 2% to the protocol—plus Maya routes 10% of her share to a charity, all on-chain.

Fans pay sBTC, get their personal numbered edition, and the Rising Tide API suggests other works that might interest them. Now, Maya’s planning collabs: an exclusive collection with this month’s hottest artist. With Rising Tide Pages, she’s not just writing—she’s publishing a decentralized legacy.


<img src="https://9ok0w2gk6hipqasu.public.blob.vercel-storage.com/Rising%20Tide%20Pages%20Architecture-uzilsVWrsdpm1kMJG4eTh0GfPqDQHi.png" width="528" height="408">

---

## Rising Tide: Art

Leo’s an artist with a killer game asset, and he’s selling usage rights for sBTC with **Rising Tide Art**.

He deploys a resource contract, signaling the new asset’s availability to the ecosystem. The icon’s priced at .00004 sBTC per use and is instantly accessible via the Rising Tide API. When Sam (our game dev) uses it in his project, 5% of each game’s buy-in flows to Leo, with `rt-creator` splitting the incoming revenue: 99% to Leo, 1% to the protocol—done instantly.

Leo’s eyeing standalone art sales or music-art bundles next. With Rising Tide Art, he’s not just drawing—he’s fueling a decentralized creative market.

---

## Rising Tide: Music

Nina’s a musician looking to connect with her audience. She runs a competition using the Rising Tide Pages protocol, allowing her community to author lyrics for a verse in an upcoming song. Using the winning lyrics, she publishes a new track and makes it available for sBTC via **Rising Tide Music**.

She deploys a track contract to sell the new song. It’s .00005 sBTC to purchase and tied to her open collection with `rt-collections`. Alex gifts a copy to the winning author and adds them to the creator split. When fans buy it, `rt-creator` splits the sBTC: 80% to Nina, 15% to the winning author, 5% to the protocol—no fuss.

Nina updates details with `set-track-info`, keeping control. Users pay sBTC, get rights, and might explore her catalog via an `rt-deeplink` dApp. Data Services sync it—Chainhooks and the Indexer keep it real-time.

Nina’s planning another competition next month, this time for album cover art. With Rising Tide Music, she’s not just singing—she’s powering a decentralized soundwave.

---

## Rising Tide: Finance

Now, picture all our creators—Alex, Jamie, Sam, Maya, Leo, Nina—tracking their sBTC with **Rising Tide Finance**.

They log into a Data Services dashboard—a decentralized ledger showing sBTC from every vertical. Alex sees her AMA earnings, Jamie his ticket sales, Sam his game pots—all split via `rt-creator` and detailed live. Chainhooks and the Indexer keep it current, with the API feeding it to the dash.

But it’s not just about tracking—creators can grow their wealth with DeFi tools built into the dash. Right from the dashboard, they can stack their STX—locking tokens to support network security and earn Bitcoin rewards. They can also earn yield on their sBTC by supplying it to decentralized lending protocols or liquidity pools, or perform asset swaps via integrated decentralized exchanges to optimize their portfolios. All these DeFi activities are executed on-chain through trustless smart contracts, ensuring security and accessibility without ever leaving the dApp.

It’s more than numbers: trends, top verticals, and tax-ready reports. Devs can build tools like budgeting apps with the API. Next up? sBTC forecasts and slick visuals. With Rising Tide Finance, creators don’t just earn—they dominate their finances.

---

# Conclusion

## A New Era for Creators with Rising Tide

The Rising Tide Protocol isn’t just a collection of tools spanning **Media, Events, Games, Pages, Art, Music, and Finance**—it’s a revolutionary force in decentralized commerce. Built on Stacks and powered by **sBTC**, it redefines how creators earn, connect, and prosper, breaking down the barriers erected by centralized intermediaries.

### The Struggles of the Web2 Creator Economy
The current creator economy is vast—valued at over **$100 billion** and expanding—yet creators face significant challenges on Web2 platforms:
- **High Fees**: Intermediaries like YouTube, Spotify, and Eventbrite take up to **30% of earnings**, reducing creators’ income.
- **Loss of Control**: Centralized systems impose restrictive terms, from content rules to payout delays, undermining creator autonomy.
- **Lack of Transparency**: Opaque algorithms and revenue models leave creators uncertain about their earnings and reach.

Millions of creators are seeking a fairer alternative, and the moment for change has arrived.

### Rising Tide’s Answer
Rising Tide offers a decentralized, creator-centric solution:
- **Higher Earnings**: With **protocol fees starting at 0% and customizable up to 5%**, creators retain the vast majority of their revenue through transparent Clarity smart contracts, with small fees introduced as the protocol matures to support development and hosting.
- **True Ownership**: No middlemen—creators maintain full control over their content, data, and audience relationships.
- **Fast, Secure Payments and Tipping**: **sBTC** delivers instant, trustless transactions, backed by Bitcoin’s unmatched security.


<img src="https://9ok0w2gk6hipqasu.public.blob.vercel-storage.com/the%20bitcoins%20must%20flow-ugeYNC45mNgHwzw7N7l7htdjK2D02G.png" width="400" height="225">

### A Vision for the Future
As Bitcoin adoption accelerates, **sBTC** emerges as the foundation of decentralized commerce. Rising Tide harnesses this momentum to provide creators with a scalable, equitable platform to build their livelihoods. It’s not just about addressing today’s issues—it’s about forging a future where creativity fuels value, unrestricted by gatekeepers.

### Join the Movement
Rising Tide is more than a protocol—it’s a rallying cry. It’s where creators become leaders, shaping a landscape of fair commerce and boundless opportunity. The tide is rising—are you ready to ride it?
