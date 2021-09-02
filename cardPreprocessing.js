const fs = require('fs'); // For writing a new file

const { 
    cards, addArenaIds, setExceptions, addSetExceptions, replacementImages, extraReplacements, 
    desiredProperties, desiredLegalities, desiredCardFaceProps, filterAltArt, changeProperties
} = require('./cardPreprocessingParams'); // Parameters describing source data, exceptions, exclusions, etc.

/**
 * This file preprocess the bulk data from Scryfall, creating a json file as output.
 * 
 * @authors @Alex-Van-Buren @Nate-Sackett
 */

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

/* Format file name as 'arenaCards' + (current data and time) + '.json'
 * - (current data and time) formatted as 'YYYYMMDD' + UTC (without spaces or separators)
 * - e.g. arenaCards202101010001.json
 */
const fileName = `./arenaCards${new Date().toISOString().replace(/\..+/g, "").replace(/[T:\-]/g, "")}.json`;

// Write to file
fs.writeFileSync(fileName, JSON.stringify(returnCards));