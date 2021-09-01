/**
 * This file preprocess the bulk data from Scryfall, removing any non-arena cards, as well as
 * any unnecessary information from the card.
 * Preprocessing is used to reduce the file size of the cards json as much as possible.
 * 
 * @authors @Alex-Van-Buren @Nate-Sackett
 */

const fs = require('fs'); // For writing a new file

// Use most up-to-date Default Cards Bulk Data JSON from Scryfall
const cards = require('./default-cards-20210830090230.json');

const setExceptions = ["j21"];
const addArenaIds = [
    // { name: "", arena_id:  }, // Template
];
const addSetExceptions = [
    "Lightning Bolt",
    "Duress",
    "Fog",
    "Giant Growth",
    "Kraken Hatchling",
    "Light of Hope",
    "Ponder",
    "Regal Force",
    "Reassembling Skeleton",
    "Dark Ritual",
    "Shivan Dragon",
    "Stormfront Pegasus",
    "Force Spike",
    "Swords to Plowshares",
    "Assault Strobe",
    "Tropical Island",
];

// card.layout = "split", but img doesn't show text. Contains objects with "arenaId"s and "img"s in an array
// Find cards with the same ids that are split cards and replace their images
const replacementImages = require('./replacementImages.json');
const extraReplacements = [
    {
        name: 'Fast // Furious',
        set: 'j21',
        img: 'https://c1.scryfall.com/file/scryfall-cards/border_crop/front/5/b/5b209759-6215-49e8-a6a0-a6c94040adb2.jpg?1629231952'     
    },
];

// Properties to keep from cards array
const desiredProperties = [
    'name',
    'color_identity',
    'cmc',
    'set',
    'rarity',
    'type_line',
    'oracle_text',
    'layout',
    'keywords',
    'collector_number',
    'booster',
    'promo_types',
    'printed_name',
    // 'arena_id', // Special case - renamed to arenaId
    // 'legalities', // Special case - nested
    // 'card_faces', // Special case - nested
    // 'image_uris', // Swapping to imgs: {front, back}
    // 'power', // Not currently used
    // 'toughness', // Not currently used
    // 'loyalty', // Not currently used
];

const desiredLegalities = [
    'standard',
    'historic',
    'brawl',
    'historicbrawl',
    'future',
    // 'pioneer', // Not currently used
];

const desiredCardFaceProps = [
    'name',
    'oracle_text',
];

// An array that will hold cards after preprocessing
const returnCards = [];

// Preprocess cards, removing all without an arena id, and removing undesired properties
for ( let card of cards ) {

    try {

        /* 
         * Test if card is in MTG Arena
         */
        {
            // Don't add cards to the returnCards array that don't have an arena ID (unless there are specific exceptions)
            if (!card.hasOwnProperty("arena_id")) {

                // Add cards from specific sets
                if (setExceptions.includes(card.set)) {

                    // Add arenaIds for specified cards
                    for (const matchCard of addArenaIds) {

                        // Add the arena_id if the card names match
                        if (card.name === matchCard.name) {
                            card.arena_id = matchCard.arena_id;
                            break; // Stop this loop through this set, card has arena_id added
                        }
                    }

                    // Except these cards
                    if (addSetExceptions.includes(card.name)) {
                        continue;
                    }
                }

                // Do nothing, move onto the next card; card isn't an arena card
                else {
                    continue;
                }
            }

            // Remove cards that have an arena_id but are not in english
            if ( card.lang && card.lang !== "en") {
                // go on to next card and do not add this card to the returnCards array
                continue;
            }

            // Remove tokens
            if ( (card.layout && card.layout === 'token') || ( card.set_type && card.set_type === 'token' )) {
                // Don't add this card
                continue;
            }

            // Test if card is an alternate art card that is not desired
            if (!filterAltArt(card.arena_id, card.promo_types, card.set)) {
                continue;
            }
        }

        /* 
         * Card has passed all tests and should be added to arenaCards.json
         * Create new card, get all desired properties, and add it to the returnCards array
         */
        {
            const newCard = {};

            // Add arenaId to cards
            if (card.arena_id) { // Need to check "if" for the specific exception cases above
                newCard.arenaId = card.arena_id;
            }

            // Add desired properties to newCard
            for (const prop of desiredProperties) {
                if (card[prop]) {
                    newCard[prop] = card[prop];
                }
            }

            // Add imgs to card
            if (card.image_uris) {
                newCard.imgs = { front: card.image_uris.border_crop };
            }

            // Add desired legalities
            newCard.legalities = {};
            for (const legality of desiredLegalities) {
                if (card.legalities[legality]) {
                    newCard.legalities[legality] = card.legalities[legality];
                }
            }

            // 2-sided cards
            if (card.card_faces) {

                // Some cards don't have a card.image_uris property, so need to add front image from card_faces
                if (!newCard.imgs) {
                    newCard.imgs = { front: card.card_faces[0].image_uris.border_crop };
                }

                // Add backside image
                if (card.card_faces[1].image_uris) {
                    newCard.imgs.back = card.card_faces[1].image_uris.border_crop;
                }

                // Add card_faces if applicable
                if (card.card_faces) {
                    newCard.card_faces = [];

                    // Add specific props to 2-sided cards
                    for (const prop of desiredCardFaceProps) {
                        for (let i=0; i<card.card_faces.length; i++) {
                            if (!newCard.card_faces[i]) {
                                newCard.card_faces[i] = {};
                            }
                            if (card.card_faces[i][prop]) {
                                newCard.card_faces[i][prop] = card.card_faces[i][prop];
                            }
                        }
                    }
                }
            }

            // Replace some card images
            for (const replaceCard of replacementImages) {
                if (replaceCard.arenaId === card.arena_id) {
                    newCard.imgs.front = replaceCard.img;
                    break;
                }
            }

            // Extra replacements without arena IDs
            for (const replaceCard of extraReplacements) {
                if (replaceCard.name === card.name && replaceCard.set === card.set) {
                    newCard.imgs.front = replaceCard.img;
                }
            }

            // Change some card Properties
            changeProperties(newCard);

            // Preprocessing complete for this card, add it to the final array
            returnCards.push(newCard);
        }
        
    } catch (error) {
        console.log(`Unable to process: ${card.name? card.name : card}... Skipping`);
        console.log(error);
    }
} // end for cards

/**
 * Filter out alternate art and problem cards.
 * @param {number} cardId ID of the card.
 * @param {Array} cardPromoTypes 
 * @param {string} setId set code
 * @returns True if the card is not an alternate art card, false otherwise.
 */
 function filterAltArt(cardId, cardPromoTypes, setId) {

    // Problem cards that require a special filter
    // Realmwalker and Orah buy-a-box promos that also appear in the regular set
    // Special alt art of Reflections of Littjara doesn't appear in-game but has arena_id for some reason
    if (cardId === 75382 || cardId === 75910 || cardId === 75381 || cardId === 77382) {
        // Don't add
        return false;
    }

    // Keep all of strixhaven mystical archives
    if (setId === 'sta') {
        return true;
    }

    // Remove dominaria promos
    if (setId === 'pdom') {
        return false;
    }

    // Check if the card has promo types
    if ( cardPromoTypes ) {

        // For special sets this might not work (eg mystical archives)
        // if the card doesn't have boosterfun in promo types --> keep it
        if ( cardPromoTypes.includes("boosterfun") === false ) {

            return true
        }

        // Otherwise filter out this alt-art card
        return false;
    }
    // Else the card doesn't have promo_types and no filtering is necessary        
    return true;
}

/**
 * Some cards have properties that are difficult to work with or are not correct for our purposes.
 * This function changes them
 * @param {Object} card Card object
 * @returns Card with properties altered if they needed to be changed
 */
function changeProperties(card) {
    // Object wehre keys are arena_ids with properties to check and the value is an object with the new properties
    const changeCards = {
        // Brawl exclusives
        29535: {set: 'shm' , collector_number: 237 },
        49077: {set: 'm13' , collector_number: 72 },
        63081: {set: 'soi' , collector_number: 245 },
        18674: {set: 'scg' , collector_number: 136 },
        48499: {set: 'inv' , collector_number: 249 },

        // BFZ lands
        62115: {set: 'bfz' , collector_number: 250 },
        62125: {set: 'bfz' , collector_number: 255 },
        62135: {set: 'bfz' , collector_number: 260 },
        62145: {set: 'bfz' , collector_number: 265 },
        62155: {set: 'bfz' , collector_number: 270 },

        // RTR lands
        51789: {set: 'rtr' , collector_number: 250 },
        //! 62125: {set: 'rtr' , collector_number: 255 },  Island is missing for some reason  ARENA_ID WRONG
        51809: {set: 'rtr' , collector_number: 260 },
        51819: {set: 'rtr' , collector_number: 265 },
        51829: {set: 'rtr' , collector_number: 270 },

        // AKH lands
        65363: {set: 'akh' , collector_number: 256 },
        65369: {set: 'akh' , collector_number: 258 },
        65379: {set: 'akh' , collector_number: 262 },
        65385: {set: 'akh' , collector_number: 264 },
        65393: {set: 'akh' , collector_number: 267 },

        // MIR lands
        7193: {set: 'mir' , collector_number: 331 },
        7065: {set: 'mir' , collector_number: 336 },
        7347: {set: 'mir' , collector_number: 340 },
        7153: {set: 'mir' , collector_number: 346 },
        6993: {set: 'mir' , collector_number: 347 },

        // ROE lands
        36786: {set: 'roe' , collector_number: 229 },
        36818: {set: 'roe' , collector_number: 235 },
        36812: {set: 'roe' , collector_number: 237 },
        36788: {set: 'roe' , collector_number: 242 },
        36802: {set: 'roe' , collector_number: 245 },

        // UND lands
        73136: {set: 'und' , collector_number: 87 },
        73137: {set: 'und' , collector_number: 89 },
        73138: {set: 'und' , collector_number: 91 },
        73139: {set: 'und' , collector_number: 93 },
        // !73140: {set: 'und' , collector_number: 95 }, Forest is missing for some reason ARENA_ID IS WRONG, collector number wrong too

        // UND full art lands
        73141: {set: 'und' , collector_number: 88 },
        73142: {set: 'und' , collector_number: 90 },
        73143: {set: 'und' , collector_number: 92 },
        73144: {set: 'und' , collector_number: 94 },
        // !73145: {set: 'und' , collector_number: 96 }, Overlapping issue with UND forest

        // Godzilla lands sld
        73644: {set: 'sld' , collector_number: 63 },
        73645: {set: 'sld' , collector_number: 64 },
        73646: {set: 'sld' , collector_number: 65 },
        73647: {set: 'sld' , collector_number: 66 },
        73648: {set: 'sld' , collector_number: 67 },

        // UST full art John Avon lands
        75021: {set: 'ust' , collector_number: 212 },
        75022: {set: 'ust' , collector_number: 213 },
        75023: {set: 'ust' , collector_number: 214 },
        75024: {set: 'ust' , collector_number: 215 },
        75025: {set: 'ust' , collector_number: 216 }
    };

    // Change arena exclusive jumpstart cards to jumpstart and make booster true
    if (card.set === 'ajmp') {
        card.set = 'jmp';
        card.booster = true;
    }

    // set mystical archives cards booster value to true
    if (card.set === 'sta') {
        card.booster = true;
    }

    // Lots of changes for set pana
    // check if the card is in the change cards object
    if ( changeCards[card.arenaId] ) {

        // change the properties
        for (let [key, value] of Object.entries(changeCards[card.arenaId])) {
            card[key] = value;
        }
    }
}
/* Format file name as 'arenaCards' + (current data and time) + '.json'
   - (current data and time) formatted as 'YYYYMMDD' + UTC (without spaces or separators)
   - e.g. arenaCards202101010000.json */
const fileName = `./arenaCards${new Date().toISOString().replace(/\..+/g, "").replace(/[T:\-]/g, "")}.json`;

// Write to file
fs.writeFileSync(fileName, JSON.stringify(returnCards));