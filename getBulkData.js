const axios = require('axios');
const fs = require('fs').promises;

/**
 * Request url of "default cards" from scryfall
 * @returns url string
 */
async function getDownloadURL() {

    let res;

    try {
        res = await axios.get('https://api.scryfall.com/bulk-data');
    } catch (e) {
        throw new Error(`getDownloadURL: Axios request for bulk data failed.\n${e.name}: ${e.message}`);
    }

    const data = res.data.data;
    if (!data || data.length === 0) {
        throw new Error(`getDownloadURL: No data found in response.\ndata = ${data}`)
    }

    const defaultCardObjectData = data.find( obj => obj.type === 'default_cards')
    if (!defaultCardObjectData) {
        throw new Error(`getDownloadURL: 'default_cards' type not found in response.data list of objects.\ndata=${data}`)
    }

    const downloadURL = defaultCardObjectData.download_uri
    if (!downloadURL) {
        throw new Error(`getDownloadURL: Response object does not contain a "download_uri" property.\nobject = ${defaultCardObjectData}`)
    }

    console.log(`Successfully received get request URL for default cards. URL = "${downloadURL}"`)
    return(downloadURL);
}

/**
 * Use requested URL to get bulk data file
 * @param {string} url
 * @returns Default card data object
 */
async function getBulkData(url) {

    // Get default cards bulk data
    try {
        const res = await axios.get(url);
        console.log("Successfully received default cards bulk data.")
        return res.data
    } catch (e) {
        throw new Error(`getBulkData("${url}"):\nAxios request to get default cards failed.\n${e.name}: ${e.message}`)
    }
}

/**
 * Write default card data to file.
 * @param {string} url 
 * @param {JSON} data 
 */
async function saveData(url, data) {
    // Get file name
    const fileNameArray = url.split("default-cards/")
    if (fileNameArray.length <= 1) {
        throw new Error(`saveData: splitting ${url} by "default-cards/" string unsuccessful.`)
    }
    fileName = fileNameArray[fileNameArray.length-1]

    // Save file
    try {
        await fs.writeFile('./'+fileName, JSON.stringify(data));
        console.log(`Successfully wrote file ${fileName}`)
    } catch (e) {
        throw new Error(`saveData: Failed to write new file with name "${fileName}".\n${e.name}: ${e.message}`)
    }
}

/**
 * Use main function for async syntax. Need to wait for getDownloadURL before running getBulkData
 */
async function main() {

    try {
        const url = await getDownloadURL();
        const defaultCards = await getBulkData(url);
        saveData(url, defaultCards)
    } catch (e) {
        console.error(e)
    }
}

main()