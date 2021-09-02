/**
 * This file specifies all parameters for the cardPreprocessing file.
 */

/** The most up-to-date Default Cards Bulk Data JSON from Scryfall */
const cards = require('./default-cards-20210830090230.json');

/** Extra cards that need to be filtered out via filterAltArt */
const filterArtIDs = [ 75382, 75910, 75381, 77382 ]; // Not exported, used internally

/** Cards that need an arena_id added to them. An array of objects with names and arena_ids 
 *  { name: "", arena_id:  }, // Template
 */
const addArenaIds = [];

/** Card sets to include even if they don't have arena_ids */
const setExceptions = ["j21"];

/** Cards that should be excluded even if they're from a set in setExceptions */
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

/** Split cards that require their image be replaced (like in the akr set) because their pictures don't
 *  show oracle_text.
 *  An array of objects: [{ arenaId: XXXX, img: "https://c1.scryfall.com/..." }, ...]
 */
const replacementImages = require('./replacementImages.json');

/** Cards that don't have arena_ids, but require replacement images.
 *  An array of objects: [{ name: "Xxxx // Yyyy", set: "x99", img: "https://c1.scryfall.com/..." }, ...]
 */
const extraReplacements = [
    {
        name: 'Fast // Furious',
        set: 'j21',
        img: 'https://c1.scryfall.com/file/scryfall-cards/border_crop/front/5/b/5b209759-6215-49e8-a6a0-a6c94040adb2.jpg?1629231952'     
    },
];

/** Properties to keep for each card in the cards array */
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

/** Legalities to keep for each card in the cards array */
const desiredLegalities = [
    'standard',
    'historic',
    'brawl',
    'historicbrawl',
    'future',
    // 'pioneer', // Not currently used
];

/** Props to keep from the card_faces property on each card of the cards array */
const desiredCardFaceProps = [
    'name',
    'oracle_text',
];

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
    if (filterArtIDs.includes(cardId)) {
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

module.exports = {
    cards,
    addArenaIds,
    setExceptions,
    addSetExceptions,
    replacementImages,
    extraReplacements,
    desiredProperties,
    desiredLegalities,
    desiredCardFaceProps,
    filterAltArt,
    changeProperties
};