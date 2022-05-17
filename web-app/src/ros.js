// -------------------------------------------------------
// Autores: Luis Belloch, Adrian Maldonado
// Fecha: 20/03/2022
// Descripcion: Este archivo es el que se encarga de la comunicacion con el servidor y el
// robot
// -------------------------------------------------------

//---------ROS-----------
let conn_data = {
    // ros connection
    ros: null,
    rosbridge_address: 'ws://127.0.0.1:9090/',
    connected: false,
}

//---------TOPICS-----------
var goal_pose = new ROSLIB.Topic({
    ros: null,
    name: '/goal_pose',
    messageType: 'geometry_msgs/msg/PoseStamped'
});
var odom = new ROSLIB.Topic({
    ros: null,
    name: '/odom',
    messageType: 'nav_msgs/msg/Odometry'
});

// DOCS: http://docs.ros.org/en/noetic/api/sensor_msgs/html/msg/Image.html
var camera = new ROSLIB.Topic({
    ros: null,
    name: '/camera/image_raw',
    messageType: 'sensor_msgs/msg/Image'
})

//---------ROBOS-----------
let robos_x = 0
let robos_y = 0

let destino_x = 0
let destino_y = 0

let checkpoints = []
let checkpoint_actual = 0

document.addEventListener('DOMContentLoaded', event => {
    console.log("entro en la pagina")

    /* Imagen del canvas */
    let mapStatus = document.getElementById("map-status");
    let canvas = document.getElementById("map-canvas");
    let ctx = canvas.getContext("2d");
    let image = new Image();
    // -------------------------------------------
    // Cambiar esta parte para meter otra imagen
    image.src = "img/my_map.jpg";
    // -------------------------------------------
    image.onload = function() {
        drawImageScaled(image, ctx)
        
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
    botonEnviar.addEventListener("click", sendRosData)
    // Recoger datos de firebase
    var botonDescargar = document.getElementById("btn-fetch")
    // Asigna la funcion senData al boton de enviar
    botonDescargar.addEventListener("click", fetchRosData)

    // Se asigna cuando se usa, se guarda aqui como global para poder usarla en las funciones
    var idSlot = 0;

    // Comprueba cookies para la pagina
    checkCookies();

    /**
     * Se conecta a ROS por un websocket
     */
    function connect() {
        console.log("Clic en connect")

        conn_data.ros = new ROSLIB.Ros({
            url: conn_data.rosbridge_address
        })

        goal_pose.ros = conn_data.ros
        odom.ros = conn_data.ros

        // TODO: mostrar que se ha conectado cambiado el circulo de color y cambiando de
        // boton conectar a desconectar

        // Define callbacks
        conn_data.ros.on("connection", () => {
            conn_data.connected = true
            //mover()
            console.log("Conexion con ROSBridge correcta")

        })
        conn_data.ros.on("data", (result) => {
            console.log("Se ha producido algun result")
            console.log(result)
        })
        conn_data.ros.on("error", (error) => {
            console.log("Se ha producido algun error mientras se intentaba realizar la conexion")
            console.log(error)
        })
        conn_data.ros.on("close", () => {
            conn_data.connected = false
            console.log("Conexion con ROSBridge cerrada")
        })

        odom.subscribe(function (message) {
            robos_x = message.pose.pose.position.x
            robos_y = message.pose.pose.position.y
            //console.log(message)
            dibujar();
        });
        // Dibuja en el canvas la imagen recibida por el topic
        camera.subscribe(function (message) {
            //console.log(message)
            //console.log(message.data)
            let msg_data = message.data
            let image = new Image();
            image.src = "data:image/jpeg;base64," + msg_data;
            image.onload = function () {
                let canvas = document.getElementById("map-canvas");
                let ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0);
            }
        });
    }

    /**
     * Crea el objeto de datos para enviar a Firebase
     */
    function sendRosData(data_send) {
        console.log("Clic en sendROSData")

        idSlot = document.getElementById("id-slot").value; // string
        
        let jsonMsg = {
            time: new Date().getTime(),
            connection_data: conn_data,
            msg: []
        }
        jsonMsg.msg.push(data_send);

        // Guarda cookies con la ID de conexion para no tener que ponerla cada vez
        document.cookie = "ros_id=" + idSlot + ";";

        putData(idSlot, jsonMsg);
    }

    function fetchRosData() {
        console.log("Clic en fetchROSData")

        idSlot = document.getElementById("id-slot").value; // string

        // Guarda cookies con la ID de conexion para no tener que ponerla cada vez
        document.cookie = "ros_id=" + idSlot + ";";

        fetchData(idSlot, startMovement);
    }
});

// FINAL DOM CONTENT LOADED

function startMovement(jsonData) {

    // Toma los valores del mensaje
    destino_x = jsonData.msg[0].pose.position.x;
    destino_y = jsonData.msg[0].pose.position.y;
    // Crea el mensaje goal pose recibido desde Firebase
    var mensaje = generarMensajeGoalPose(destino_x,destino_y)
    goal_pose.publish(mensaje);
    // Inicia la ruta
    nextCheckpoint();
}

/**
 * Genera un mensaje de ROSLIB para el Goal Pose
 * @param {num} x posicion objetivo
 * @param {num} y posicion objetivo
 * @returns ROSLIB.Message
 */
function generarMensajeGoalPose(x, y) {
    let mensaje = new ROSLIB.Message({
        header: {
            stamp: {
                sec: 1649056173,
                nanosecs: 274857925
            },
            frame_id: 'map'
        },
        pose: {
            position: {
                x: x,
                y: y,
                z: 0.0
            },
            orientation: {
                x: 0.0,
                y: 0.0,
                z: 0.0,
                w: 0.8
            }
        }
    })

    return mensaje
}

function nextCheckpoint() {
    setInterval(function () {
        let checkpoint = checkpoints[checkpoint_actual]
        destinoAlcanzado(checkpoint[0], checkpoint[1])
        goal_pose.publish(generarMensajeGoalPose(checkpoint[0], checkpoint[1]))
    }, 300)
}

/**
 * Dibuja en el mapa la trayectoria seguida por el robot
 */
function dibujar() {
    if (dibujar_disponible) {
        dibujar_disponible = false
        setTimeout(function () {
            dibujar_disponible = true
            pos = relativePosRobot(robos_x, robos_y, ctx.canvas)
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 1, 0, 2 * Math.PI);

            ctx.stroke();

        }, 300)
    }
}

/**
 * Se llama cuando el goal pose ha sido alcanzado
 * @param {*} x 
 * @param {*} y 
 */
function destinoAlcanzado(x, y) {

    if (Math.abs(robos_x - x) < 0.3 && Math.abs(robos_y - y) < 0.3) {
        //console.log("destino")
        checkpoint_actual++
        if (checkpoint_actual >= checkpoints.length) {
            checkpoint_actual = 0
        }

        // TODO: mostrar destino alcanzado
        
        // TODO: Si el punto requiere una foto, la envia a firebase
        guardarFoto();

    } else {
        // TODO: mostrar en camino

        //console.log(robos_x,destino_x)
        //console.log(robos_y,destino_y)
    }
}

/**
 * Guarda la imagen actual en el canvas
 */
function guardarFoto() {
    let imagen = document.getElementById("map-canvas").getContext().ImageData;
    if (imagen != "") {
        let msg_data = {
            image: imagen
        }
        sendROSData(msg_data);
    }
}