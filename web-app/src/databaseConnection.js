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
function putData(idSlot, data) {
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
        firebaseStatus(1);
        return result;
    })
    .catch(error => firebaseStatus(-1));
}


/**
 * Modifica el circulo de estado cuando hay errores o no en una conexion a firebase
 * @param {string} estado: 1 OK, -1 ERROR
 */
function firebaseStatus(status) {
    let firebaseStatus = document.getElementById("firebase-status");
    // OK
    if(status == 1) {
        firebaseStatus.classList.add("circle-green");
        firebaseStatus.classList.remove("circle-red");
        return;
    }
    // ERROR
    firebaseStatus.classList.add("circle-red");
    firebaseStatus.classList.remove("circle-green");
}