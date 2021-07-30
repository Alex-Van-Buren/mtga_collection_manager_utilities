/**
 * This file preprocess the bulk data from Scryfall, removing any non-arena cards, as well as
 * any unnecessary information from the card.
 * Preprocessing is used to reduce the file size of the cards json as much as possible.
 * 
 * @authors @Alex-Van-Buren @Nate-Sackett
 */

const fs = require('fs'); // For writing a new file

// Use most up-to-date Default Cards Bulk Data JSON from Scryfall
const cards = require('./default-cards-20210728090316.json');

const addArenaIds = [
    // {name: "Atarka's Command",              arena_id: 60959},
    // {name: "Ancient Grudge",                arena_id: 42618},
    // {name: "Court Homunculus",              arena_id: 46873},
    // {name: "Dromoka's Command",             arena_id: 60975},
    // {name: "Dragonstorm",                   arena_id: 18892},
    // {name: "Elesh Norn, Grand Cenobite",    arena_id: 50871},
    // {name: "Grisly Salvage",                arena_id: 51619},
    // {name: "Into the North",                arena_id: 24649},
    // {name: "Intangible Virtue",             arena_id: 42684},
    // {name: "Ichor Wellspring",              arena_id: 39339},
    // {name: "Jin-Gitaxias, Core Augur",      arena_id: 50873},
    // {name: "Kolaghan's Command",            arena_id: 60981},
    // {name: "Merfolk Looter",                arena_id: 32925},
    // {name: "Ojutai's Command",              arena_id: 60987},
    // {name: "Reverse Engineer",              arena_id: 64261},
    // {name: "Relic of Progenitus",           arena_id: 30895},
    // {name: "Ray of Revelation",             arena_id: 43257},
    // {name: "Stifle",                        arena_id: 18902},
    // {name: "Silumgar's Command",            arena_id: 60997},
    // {name: "Sheoldred, Whispering One",     arena_id: 50875},
    // {name: "Trash for Treasure",            arena_id: 78136},
    // {name: "Urabrask the Hidden",           arena_id: 39738},
    // {name: "Vault Skirge",                  arena_id: 39770},
    // {name: "Vorinclex, Voice of Hunger",    arena_id: 50879},
    // {name: "Whirler Rogue",                 arena_id: 61231}
];

// Properties to remove from cards array
const unwantedProperties = [
    "object", "id", "oracle_id", "multiverse_ids", "tcgplayer_id", "cardmarket_id", "lang", "released_at","uri", "scryfall_uri", 
    "highres_image", "games", "reserved", "foil", "nonfoil", "oversized", "promo", "reprint", "variation", "set_type", "set_uri",
    "set_search_uri", "scryfall_set_uri", "rulings_uri","prints_search_uri", "digital", "card_back_id", "artist",
    "artist_ids", "illustration_id", "border_color", "frame", "full_art", "textless", "story_spotlight", "edhrec_rank", "prices",
    "related_uris", "mtgo_id", "mtgo_foil_id", "all_parts", "watermark", "flavor_text", "image_status","preview", "produced_mana",
    "frame_effects", "set_name"
];

/* Nested properties to remove from cards array
   - property is a specific property of a card that has some info to be kept
   - nestedObject and nestedArray both refer to arrays of nested properties to be removed
     * nestedObject is used if the structure of the property is 'property -> object -> properties'
     * nestedArray is used if the structure of the property is 'property -> array -> object -> properties' */
const nestedProperties = [
    {   property: "image_uris",
        nestedObject: ["small", "normal", "large", "png", "art_crop"]},
    {   property: "legalities",
        nestedObject: ["future", "gladiator", "modern", "legacy", "pauper", "vintage", "penny", "commander", "duel", "oldschool", "premodern" ]},
    {   property: "card_faces",
        nestedArray: ["object", "watermark", "artist", "artist_id", "illustration_id", "flavor_text"]}
]

// An array that will hold cards after preprocessing
let finalCards = [];

// Preprocess cards, removing all without an arena id, and removing undesired properties
for ( let card of cards ) {

    try {
        // Don't add cards to the finalCards array that don't have an arena ID (unless they're in a set we need to add arena_id's to)
        if (!card.hasOwnProperty("arena_id")) {

            // Check if this card belongs to a set that we need to add arena_id's to
            if (card.set === "ha5") {

                // Loop through the set we need to add arena_id's for
                for (const matchCard of addArenaIds) {

                    // Add the arena_id if the card names match
                    if (card.name === matchCard.name) {
                        card.arena_id = matchCard.arena_id;
                        break; // Stop this loop through this set, card has arena_id added
                    }
                }
            }

            // Do nothing, move onto the next card; card isn't added to final card array
            else {
                continue;
            }
        }

        /* Card is an arena card, requires preprocessing */

        // Remove cards that have an arena_id but are not in english
        if ( card.hasOwnProperty('lang') && card.lang !== "en") {
            // go on to next card and do not add this card to the finalCards array
            continue;
        }

        // Remove tokens
        if ( card.hasOwnProperty('layout') && card.layout === 'token' ) {
            // Don't add this card
            continue;
        }

        // Try to remove properties listed in unwantedProperties array
        unwantedProperties.forEach( prop => {

            if (card.hasOwnProperty(prop))
                delete card[prop];
        });
        
        // Some properties contain objects or arrays, and we only want to keep some of those values
        //  therefore check for those values listed in nestedProperties
        nestedProperties.forEach( npObject => {

            // Case 1: nestedProperties object has a nestedObject value
            //  therefore: structured as, 'property -> object -> properties'
            if (npObject.hasOwnProperty("nestedObject")) {

                // Try to remove all values listed in nestedObject
                npObject.nestedObject.forEach( nestProp => {

                    // ...if both the property and nested property exist for the card
                    if ( card.hasOwnProperty(npObject.property) && card[npObject.property].hasOwnProperty(nestProp))
                        delete card[npObject.property][nestProp];
                });
            }
            // Case 2: nestedProperties object has a nestedArray value
            //  therefore structured as, 'property -> array -> object -> properties'
            else if (npObject.hasOwnProperty("nestedArray")) {

                // Check if the card has the property listed in the nestedProperties array (e.g. card_faces)
                if (card.hasOwnProperty(npObject.property)) {

                    // Loop through each object nested within a property of the card, call this objInProp
                    card[npObject.property].forEach( objInProp => {
                        const index = objInProp.index;

                        // Loop through each of the properties that we want to remove (from nestedProperties.nestedArray)
                        npObject.nestedArray.forEach(nestProp => {

                            // Check if that property exists within the card and remove it if it does
                            if ( objInProp.hasOwnProperty(nestProp) ) {
                                delete objInProp[nestProp.toString()];
                            }
                        });
                    });
                }
            }
        });

        // Change some card Properties
        card = changeProperties(card);

        // Preprocessing complete for this card, add it to the final array
        if ( filterAltArt(card.arena_id, card.promo_types, card.set)) {
            finalCards.push(card);
        }

        // end else (is an arena card and requires preprocessing)
        
    } catch (error) {
        console.log(`Unable to process: ${card.name}... Skipping`);
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
    if ( changeCards[card.arena_id] ) {

        // change the properties
        for (let [key, value] of Object.entries(changeCards[card.arena_id])) {
            card[key] = value;
        } 
    }
    return card;
}
/* Format file name as 'arenaCards' + (current data and time) + '.json'
   - (current data and time) formatted as 'YYYYMMDD' + UTC (without spaces or separators)
   - e.g. arenaCards202101010000.json */
const fileName = `./arenaCards${new Date().toISOString().replace(/\..+/g, "").replace(/[T:\-]/g, "")}.json`;

// Write to file
fs.writeFileSync(fileName, JSON.stringify(finalCards));