const ROSLIB = require('roslib');
const {createUrl, postData} = import('./router_msgs.js');

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
    
    botonConectar.addEventListener("click", connect)

    var data = {
        // ros connection
        ros: null,
        rosbridge_address: 'ws://192.168.0.62:9090/',
        connected: false,
    }

    var odom = new ROSLIB.Topic({
        ros: null,
        name: '/waypoints',
        messageType: 'visualization_msgs/msg/MarkerArray'
    });

    function connect() {
        console.log("Clic en connect")

        data.ros = new ROSLIB.Ros({
            url: data.rosbridge_address
        })
        // .----------------------
        // postData();
        // .----------------------

        // Define callbacks
        data.ros.on("connection", () => {
            data.connected = true
            // post data to api
            const confirmation = {
                "ros": "connected"
            }
            postData("hampo", confirmation)

            estadoRos('ok')
            botones('connect')
        })
        data.ros.on("data", (data) => {
            estadoRos('data')
            console.log("Se ha recibido: " + data);
        })
        data.ros.on("error", (error) => {
            console.log("Se ha producido algun error mientras se intentaba realizar la conexion")
            console.log(error)
            estadoRos('error')
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
        console.log('Click en botón de desconexión')
        botones('disconnect')
    }

    function botones(orden) {
        let botonConectar = document.getElementById("btn_con")
        switch (orden) {
            case 'disconnect':
                botonConectar.removeEventListener("click", disconnect)
                botonConectar.addEventListener("click", connect)
                botonConectar.classList.remove('btn-danger')
                botonConectar.classList.add('btn-success')
                break;
            case 'connect':
                botonConectar.removeEventListener("click", connect)
                botonConectar.addEventListener("click", disconnect)
                botonConectar.classList.remove('btn-success')
                botonConectar.classList.add('btn-danger')
                break;
            default:
                break;
        }
    }

});

/**
 * ESTADO ROS
 *
 * Establece el estado del boton segun la orden enviada.
 * 
 * orden:string -> f() 
 * 
 * @param {string} orden 'ok' or 'data' or 'error'
 */
function estadoRos(orden) {
    let estado_ros = document.getElementById("robot_status")
    switch (orden) {
        case 'ok':
            estado_ros.classList.remove('circle-red');
            estado_ros.classList.remove('circle-yellow');
            estado_ros.classList.add('circle-green');
            break;
        case 'data':
            estado_ros.classList.remove('circle-red');
            estado_ros.classList.remove('circle-green');
            estado_ros.classList.add('circle-yellow');
            break;
        case 'error':
            estado_ros.classList.remove('circle-green');
            estado_ros.classList.remove('circle-yellow');
            estado_ros.classList.add('circle-red');
            break;
        default:
            break;
    }
}

function drawImageScaled(img, ctx) {
    let canvas = ctx.canvas;
    let aspectWidth = canvas.width / img.width;
    let aspectHeight = canvas.height / img.height;

    ctx.drawImage(img, 0, 0, img.width * aspectWidth, img.height * aspectHeight);
}