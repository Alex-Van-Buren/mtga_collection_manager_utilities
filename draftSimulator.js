const premierDraft = {
    entry: { gold: 10000, gems: 1500 },
    rewards: [
        { gems:   50, packs: 1 }, // 0 wins
        { gems:  100, packs: 1 }, // 1 wins
        { gems:  250, packs: 2 }, // 2 wins
        { gems: 1000, packs: 2 }, // 3 wins
        { gems: 1400, packs: 3 }, // 4 wins
        { gems: 1600, packs: 4 }, // 5 wins
        { gems: 1800, packs: 5 }, // 6 wins
        { gems: 2200, packs: 6 }  // 7 wins
    ],
    maxWins: 7,
    maxLosses: 3,
    maxGames: 9
 };

const traditionalDraft = {
    entry: { gold: 10000, gems: 1500 },
    rewards: [
        { gems:    0, packs: 1 }, // 0 wins
        { gems:    0, packs: 1 }, // 1 wins
        { gems: 1000, packs: 4 }, // 2 wins
        { gems: 3000, packs: 6 }  // 3 wins
    ],
    maxWins: 3,
    maxLosses: 3,
    maxGames: 3
};

const quickDraft = {
    entry: { gold: 5000, gems: 750 },
    rewards: [
        { gems:  50, packs: 1, bonusPacks: 0.20 }, // 0 wins
        { gems: 100, packs: 1, bonusPacks: 0.22 }, // 1 wins
        { gems: 200, packs: 1, bonusPacks: 0.24 }, // 2 wins
        { gems: 300, packs: 1, bonusPacks: 0.26 }, // 3 wins
        { gems: 450, packs: 1, bonusPacks: 0.30 }, // 4 wins
        { gems: 650, packs: 1, bonusPacks: 0.35 }, // 5 wins
        { gems: 850, packs: 1, bonusPacks: 0.40 }, // 6 wins
        { gems: 950, packs: 1, bonusPacks: 1.00 }  // 7 wins
    ],
    maxWins: 7,
    maxLosses: 3,
    maxGames: 9
};

/**
 * 
 * @param {*} draft The draft object
 * @param {*} rate Win rate: number between 0 and 1
 */
function draftSimulator(draft, winRate) {
    let wins = 0, losses = 0;

    // Keep looping while number of wins < maxWins && loses < maxLosses && games < maxGames
    while
      ( wins            < draft.maxWins   && 
        losses          < draft.maxLosses && 
        (wins + losses) < draft.maxGames )
    {
        // Check if we win
        if (winRate >= Math.random()) {
            wins++;
        } else {
            losses++;
        }
    }

    // Decide rewards based on wins
    let reward = draft.rewards[wins];

    // Decide if bonus pack is awarded
    if (reward.bonusPacks) {
        if (reward.bonusPacks >= Math.random()) {
            reward.packs++;
        }
    }

    // Return number of gems and packs
    return { gems: reward.gems, packs: reward.packs, wins: wins };
}

for (let i=0; i<5; i++) {
    console.log(draftSimulator(premierDraft, 0.50));
}