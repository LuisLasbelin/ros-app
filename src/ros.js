import fetch from 'electron-fetch';
import ROSLIB from 'roslib';

document.addEventListener('DOMContentLoaded', event => {
    console.log("entro en la pagina")

    botonConectar = document.getElementById("btn_con")
    botonDesconectar = document.getElementById("btn_dis")
    textoConexion = document.getElementById("estadoConexion")
    estadoRos = document.getElementById("ros_state")

    botonConectar.addEventListener("click", connect)
    botonDesconectar.addEventListener("click", disconnect)

    botonDesconectar.disabled = true
    textoConexion.innerHTML = "Desconectado"
    textoConexion.style.color = "#FF0000"

    data = {
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
            estadoRos.innerHTML("Conexion con ROSBridge correcta")

        })
        data.ros.on("data", (data) => {
            estadoRos.innerHTML("Se ha recibido: " + data)
        })
        data.ros.on("error", (error) => {
            console.log("Se ha producido algun error mientras se intentaba realizar la conexion")
            console.log(error)
            estadoRos.innerHTML("Se ha producido algun error mientras se intentaba realizar la conexion: " + error)
        })
        data.ros.on("close", () => {
            data.connected = false
            console.log("Conexion con ROSBridge cerrada")
            estadoRos.innerHTML("Conexion con ROSBridge cerrada")
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

function postData(data) {
    // fetch post
    fetch('http://localhost:8080/hampo/post/data', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error(error))
}