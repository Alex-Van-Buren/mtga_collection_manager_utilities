const prompt = require('prompt-sync')();
const fs = require('fs');

// Following 2 files pulled directly from game files
// path C:\Program Files\Wizards of the Coast\MTGA\MTGA_Data\Downloads\Data
// Copy data_cards_**.mtga and data_loc_**.mtga
// Change extension to .json
const data_cards = require("./arenaCardDataFiles/data_cards_66bce04966e00a467c563fe13e5ce877.json");
const data_loc = require("./arenaCardDataFiles/data_loc_b4731490543c3645e1044b8ec2b28d16.json");

// Ask which set to extract cards for
let set = prompt('Which set? ');
set = set.toUpperCase(); // Change to UpperCase since the arena files have them uppercase

// Initialize extracted cards
let extractCards = [];

for ( const card of data_cards ){
    // Check if the card matches the set requested
    if ( card.set === set ) {

        // Don't include tokens or secondary cards
        if (card.isSecondaryCard === true || card.isToken === true) {
            continue;
        }
        // Create extractCard to push into array
        const extractCard = {
            arenaId: card.grpid,
            name: getTextFromLoc(card.titleId),
            collector_number: card.collectorNumber,
            set: card.set.toLowerCase()
        };

        extractCards.push(extractCard);
    }
}

// Write the extracted cards to a file
const fileName = `./extractedSetData/${set.toLowerCase()}.json`;

// Check if any data was found before writing file
if (extractCards.length > 0) {
    fs.writeFileSync(fileName, JSON.stringify(extractCards));
} else {
    console.log("No Data Found")
}


/**
 * @param id Id number of the text to get from the localization file
 * @returns The string of text from the localization file
 */
function getTextFromLoc( id ) {
    const idArray = data_loc[0].keys; // [0] is to use English
    
    for ( const obj of idArray ) {
        if (obj.id === id ){

            return obj.text;
        }
    }
}
