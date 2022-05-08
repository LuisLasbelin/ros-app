import Constants from './constants.js';

document.addEventListener('DOMContentLoaded', event => {
    console.log("entro en la pagina")

    /* Imagen del canvas */
    let mapStatus = document.getElementById("map-status");
    let canvas = document.getElementById("map-canvas");
    let ctx = canvas.getContext("2d");
    let image = new Image();
    image.src = "img/my_map.jpg";
    image.onload = function() {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        /* Activar circulo */
        mapStatus.classList.add("circle-green");
        mapStatus.classList.remove("circle-red");
    }

    /* BOTONES */
    // Conectar a ROS
    var botonConectar = document.getElementById("btn-con")
    // Asigna la funcion connect al boton de conectar
    botonConectar.addEventListener("click", connect)
    // Enviar datos a firebase
    var botonEnviar = document.getElementById("btn-send")
    // Asigna la funcion senData al boton de enviar
    botonEnviar.addEventListener("click", sendROSData)
    // Recoger datos de firebase
    var botonDescargar = document.getElementById("btn-fetch")
    // Asigna la funcion senData al boton de enviar
    botonDescargar.addEventListener("click", fetchROSData)


    var idSlot = 0;

    // Comprueba cookies para la pagina
    checkCookies();
    
    /* ROS CONNECTION */
    // Datos de conexion de ROS
    var conn_data = {
        ros: null,
        rosbridge_address: 'ws://127.0.0.1:9090/',
        connected: false
    };
    // Datos del Topic que se va a enviar
    // TODO: el Topic debe tener los datos correctos
    var cmdVel = new ROSLIB.Topic({
        ros: null,
        name: '/goal_pose',
        messageType: 'geometry_msgs/msg/PoseStamped'
    });

    /**
     * Se conecta a ROS por un websocket
     */
    function connect() {
        console.log("Clic en connect")

        conn_data.ros = new ROSLIB.Ros({
            url: conn_data.rosbridge_address
        })

        cmdVel.ros = conn_data.ros

        //#region CONNECTION_STATUS
        // Define callbacks
        conn_data.ros.on("connection", () => {
            conn_data.connected = true
        })
        conn_data.ros.on("data", (data) => {
            console.log("data: ", data);
        })
        conn_data.ros.on("error", (error) => {
            console.log("Se ha producido algun error mientras se intentaba realizar la conexion")
            console.log(error)
        })
        conn_data.ros.on("close", () => {
            conn_data.connected = false
            console.log("Conexion con ROSBridge cerrada")
        })
        //#endregion
        // Connect to rosbridge
        ROSLIB.odom.subscribe(function (message) {
            console.log(message);
        });
    }

    /**
     * Crea el objeto de datos para enviar a Firebase
     */
    function sendROSData() {
        console.log("Clic en sendROSData")

        idSlot = document.getElementById("id-slot").value; // string
        
        let msg = {
            time: new Date().getTime(),
            connection_data: conn_data,
            msg: [
                cmdVel
            ]
        }

        // Guarda cookies con la ID de conexion para no tener que ponerla cada vez
        document.cookie = "ros_id=" + idSlot + ";";

        putData(idSlot, msg);
    }

    function fetchROSData() {

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
            return result;
        })
        .catch(error => console.log('error', error));
    }

    function disconnect() {
        data.ros.close()
        data.connected = false
        console.log('Clic en botón de desconexión')
        botonDesconectar.disabled = true
        botonConectar.disabled = false
        textoConexion.innerHTML = "Desconectado"
        textoConexion.style.color = "#FF0000"
    }
});

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
        return result;
    })
    .catch(error => console.log('error', error));
}

/**
 * Comprueba si existen las cookies necesarias de este documento, no es modular
 */
function checkCookies() {
    let idSlotCookie = getCookie("ros_id");
    if (idSlotCookie != "") {
        document.getElementById("id-slot").value = idSlotCookie;
    }
}

/**
 * Devuelve una cookie si existe segun su nombre
 * @param {string} cname de cookie
 * @returns cookie value or ""
 */
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}
