var fetch = require('node-fetch');

function createUrl(domain) {
    const url = `https://hamponator-web-default-rtdb.europe-west1.firebasedatabase.app/${domain}.json`;
    return url
}
/**
* POST DATA
*
* Sends data to the API
*
* data:json, domain:string -> f() -> data:json 
* 
* @param {string} domain
* @param {Object} data - data to be sent
*/
function postData(domain, data) {
    const url = createUrl(domain);
    var settings = {
        method: "PUT",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    };
    // write a fetch pu using url and settings
    fetch(url, settings)
    .then(response => {
        return response.json();
    })
    .then(response => {
        console.log(response);
    })
    .catch(error => {
        console.log(error);
    });
}

async function getData(domain) {
    const url = createUrl(domain);
    var settings = {
        method: "GET",
        headers: {
        "Content-Type": "application/json"
        },
    };
    // write a fetch pu using url and settings
    return fetch(url, settings)
    
}

module.exports = {createUrl, postData, getData};