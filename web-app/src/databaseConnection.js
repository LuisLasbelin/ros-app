/**
 * Obtiene datos desde firebase y los envia al callback
 * @param {string} idSlot
 * @param {function} callback
 */
async function fetchData(idSlot, callback) {

    // Guarda cookies con la ID de conexion para no tener que ponerla cada vez
    document.cookie = "ros_id=" + idSlot + ";";
    
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };
    
    fetch(Constants.url + `${idSlot}-web.json`, requestOptions)
    .then(response => response.json())
    .then(result => {
        console.log(result);
        try {
            callback(result);
        } catch (error) {
            console.error(error);
        }
    })
    .catch(error => console.error(error));
}

/**
 * Publica datos en firebase
 * @param {string} idSlot 
 * @param {json} data 
 */
function putData(idSlot, data, callbackStatus) {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    
    let raw = JSON.stringify(data);

    let requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    fetch(Constants.url + `${idSlot}-app.json`, requestOptions)
    .then(response => response.json())
    .then(result => {
        console.log(result);
        callbackStatus(1);
        return result;
    })
    .catch(error => callbackStatus(-1));
}