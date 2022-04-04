const ROSLIB = require('roslib');

document.addEventListener('DOMContentLoaded', event => {
    console.log("entro en la pagina")

    // CANVAS
    let mapCanvas = document.getElementById("map_canvas")
    let ctx = mapCanvas.getContext("2d");
    var img = new Image();
    img.onload = function() {
        drawImageScaled(img, ctx)
    };
    img.src = 'img/my_map.jpg';

    // BOTONES
    let botonConectar = document.getElementById("btn_con")
    let botonDesconectar = document.getElementById("btn_dis")
    let textoConexion = document.getElementById("estado_conexion")
    let estadoRos = document.getElementById("ros_state")
    
    botonConectar.addEventListener("click", connect)
    botonDesconectar.addEventListener("click", disconnect)

    botonDesconectar.disabled = true
    textoConexion.innerHTML = "Desconectado"
    textoConexion.style.color = "#FF0000"

    let data = {
        // ros connection
        ros: null,
        rosbridge_address: 'ws://127.0.0.1:9090/',
        connected: false,
    }

    var cmdVel = new ROSLIB.Topic({
        ros: null,
        name: '/goal_pose',
        messageType: 'geometry_msgs/msg/PoseStamped'
    });

    function connect() {
        console.log("Clic en connect")

        data.ros = new ROSLIB.Ros({
            url: data.rosbridge_address
        })
        // .----------------------
        postData();
        // .----------------------

        cmdVel.ros = data.ros

        botonDesconectar.disabled = false
        botonConectar.disabled = true
        textoConexion.innerHTML = "Conectado"
        textoConexion.style.color = "#00FF00"

        // Define callbacks
        data.ros.on("connection", () => {
            data.connected = true
            // post data to api
            const confirmation = {
                "ros": "connected"
            }
            postData(confirmation)
            estadoRos.innerHTML = "Conexion con ROSBridge correcta";

        })
        data.ros.on("data", (data) => {
            estadoRos.innerHTML = "Se ha recibido: " + data;
        })
        data.ros.on("error", (error) => {
            console.log("Se ha producido algun error mientras se intentaba realizar la conexion")
            console.log(error)
            estadoRos.innerHTML = "Se ha producido algun error mientras se intentaba realizar la conexion: " + error;
            disconnect();
        })
        data.ros.on("close", () => {
            data.connected = false
            console.log("Conexion con ROSBridge cerrada")
            estadoRos.innerHTML = "Conexion con ROSBridge cerrada";
            disconnect();
        })

        odom.subscribe(function (message) {
            console.log(message);
        });
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
 * POST DATA
 * Sends data to the API
 * data:* -> f() -> data:json 
 * 
 * @param {Object} data - data to be sent
 */
function postData(data) {
    const url = 'https://hamponator-web-default-rtdb.europe-west1.firebasedatabase.app/time.json';
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

// https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
function drawImageScaled(img, ctx) {
    var canvas = ctx.canvas ;
    var hRatio = canvas.width  / img.width    ;
    var vRatio =  canvas.height / img.height  ;
    var ratio  = Math.min ( hRatio, vRatio );
    var centerShift_x = ( canvas.width - img.width*ratio ) / 2;
    var centerShift_y = ( canvas.height - img.height*ratio ) / 2;  
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.drawImage(img, 0,0, img.width, img.height,
                       centerShift_x, centerShift_y,
                       img.width*ratio, img.height*ratio);  
 }