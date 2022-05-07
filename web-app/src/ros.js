document.addEventListener('DOMContentLoaded', event => {
    console.log("entro en la pagina")

    /* Imagen del canvas */
    let mapStatus = document.getElementById("map-status");
    let canvas = document.getElementById("map-canvas");
    let ctx = canvas.getContext("2d");
    let image = new Image();
    image.src = "img/my_map.jpg";
    image.onload = function(){
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        /* Activar circulo */
        mapStatus.classList.add("circle-green");
        mapStatus.classList.remove("circle-red");
    }

    /* BOTONES */
    var botonConectar = document.getElementById("btn-con")
    var estadoRos = document.getElementById("ros-status")

    botonConectar.addEventListener("click", connect)

    /* ROS CONNECTION */
    var data = {
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

        let idSlot = document.getElementById("idSlot").value; // string

        postData(idSlot, {time: new Date().getTime(), status: "Conectado"})

        data.ros = new ROSLIB.Ros({
            url: data.rosbridge_address
        })

        cmdVel.ros = data.ros

        // Define callbacks
        data.ros.on("connection", () => {
            data.connected = true
            // post data to api
            const confirmation = {
                "ros": "connected"
            }
            postData(idSlot, confirmation)
            estadoRos.innerHTML = "Conexion con ROSBridge correcta";

        })
        data.ros.on("data", (data) => {
            estadoRos.innerHTML = "Se ha recibido: " + data;
        })
        data.ros.on("error", (error) => {
            console.log("Se ha producido algun error mientras se intentaba realizar la conexion")
            console.log(error)
            estadoRos.innerHTML = "Se ha producido algun error mientras se intentaba realizar la conexion: " + error;
        })
        data.ros.on("close", () => {
            data.connected = false
            console.log("Conexion con ROSBridge cerrada")
            estadoRos.innerHTML = "Conexion con ROSBridge cerrada";
        })

        // Connect to rosbridge
        ROSLIB.odom.subscribe(function (message) {
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

function postData(idSlot, data) {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify(data);
    console.log(raw)

    let requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
    };

    fetch(`https://hamponator-web-default-rtdb.europe-west1.firebasedatabase.app/${idSlot}-app.json`, requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
}