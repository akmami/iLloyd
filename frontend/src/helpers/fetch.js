

const URL = 'http://0.0.0.0:8000/';

/**
 * Send data using the Fetch API
 * 
 * @param {string} url the URL to which the data will be sent
 * @param {Object} data the data object to be sent
 * @param {string} method the HTTP method ('POST', 'PUT', 'PATCH', etc.)
 * @returns {Promise<Object>} returns a promise that resolves to the server response as a JSON object
 */
const fetchData = async (path, method, data) => {
    try {
        const response = await fetch( URL + path, {
            method: method,
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const responseData = await response.json();
            return responseData;
        }
        console.error(`HTTP error! Status: ${response.status}`);
        return {};
    } catch (error) {
        console.error(`Fetch error:, ${error}`);
        return {};
    }
};


export default fetchData;