/**
 * This file preprocess the bulk data from Scryfall, removing any non-arena cards, as well as
 * any unnecessary information from the card.
 * Preprocessing is used to reduce the file size of the cards json as much as possible.
 * 
 * @authors @Alex-Van-Buren @Nate-Sackett
 */

const fs = require('fs'); // For writing a new file

// Use most up-to-date Default Cards Bulk Data JSON from Scryfall
const cards = require('./default-cards-20210412090313.json');

// Properties to remove from cards array
const unwantedProperties = [
    "object", "id", "oracle_id", "multiverse_ids", "tcgplayer_id", "cardmarket_id", "lang", "released_at","uri", "scryfall_uri", 
    "highres_image", "games", "reserved", "foil", "nonfoil", "oversized", "promo", "reprint", "variation", "set_type", "set_uri",
    "set_search_uri", "scryfall_set_uri", "rulings_uri","prints_search_uri", "collector_number", "digital", "card_back_id", "artist",
    "artist_ids", "illustration_id", "border_color", "frame", "full_art", "textless", "story_spotlight", "edhrec_rank", "prices",
    "related_uris", "mtgo_id", "mtgo_foil_id", "all_parts", "watermark", "flavor_text", "image_status","preview", "produced_mana",
    "frame_effects"
]

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
cards.forEach(card => {

    try {
        // Don't add cards to the finalCards array that don't have an arena ID
        if (!card.hasOwnProperty("arena_id")) {

            // Do nothing, move onto the next card; card isn't added to final card array

        } else { // Is an arena card, requires preprocessing

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

            // Preprocessing complete for this card, add it to the final array
            finalCards.push(card);

        } // end else (is an arena card and requires preprocessing)
        
    } catch (error) {
        console.log(`Unable to process: ${card.name}... Skipping`);
        console.log(error);
    }
}); // end cards.forEach

/* Format file name as 'arenaCards' + (current data and time) + '.json'
   - (current data and time) formatted as 'YYYYMMDD' + UTC (without spaces or separators)
   - e.g. arenaCards202101010000.json */
const fileName = `./arenaCards${new Date().toISOString().replace(/\..+/g, "").replace(/[T:\-]/g, "")}.json`;

// Write to file
fs.writeFileSync(fileName, JSON.stringify(finalCards));