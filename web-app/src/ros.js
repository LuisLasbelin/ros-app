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

// Guarda la imagen actual de la camara
var imagen_camara = null;
// Guarda las imagenes hasta que termine la ruta y las envia al final
var images_data = {};

//---------ROBOS-----------
let robos_x = 0
let robos_y = 0

let limite_mapa_x = 2.3
let limite_mapa_y = 1.9

let destino_x = 0
let destino_y = 0

let checkpoints = []
let checkpoint_actual = 0
let seguir = true
let tiempo_espera = 300

let dibujar_disponible = true

document.addEventListener('DOMContentLoaded', event => {
    console.log("entro en la pagina")

    /* Imagen del canvas */
    let mapStatus = document.getElementById("map-status");
    let canvas = document.getElementById("map-canvas");
    let ctx = canvas.getContext("2d");
    let image = new Image();
    // -------------------------------------------
    // Cambiar esta parte para meter otra imagen
    image.src = "img/my_map.png";
    // -------------------------------------------
    image.onload = function () {
        drawImageScaled(image, ctx)

        /* Activar circulo */
        mapStatus.classList.add("circle-green");
        mapStatus.classList.remove("circle-red");
    }
    /**
     * Dibuja en el mapa la trayectoria seguida por el robot
     */
    function dibujar() {
        if (dibujar_disponible) {
            dibujar_disponible = false
            setTimeout(function () {
                dibujar_disponible = true
                let pos = relativePosRobot(robos_x, robos_y, ctx.canvas)
                //console.log(pos)
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);

                ctx.stroke();

            }, 300)
        }
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
                imagen_camara = image;
            }
        });
    }
    /**
     * Obtiene datos desde firebase
     */
    function fetchRosData() {

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
                    result.msg.forEach(element => {
                        //console.log(element.tipo)
                        if (element.tipo == "ruta") {
                            element.posiciones.forEach(pos => {
                                pos.tipo = "ruta"
                                pos.z = 0.0
                                checkpoints.push(pos)
                            });
                        } else if (element.tipo == "foto") {
                            let pos = {}
                            pos.x = element.posicion.x
                            pos.y = element.posicion.y

                            let z = Math.atan(element.orientacion.y - element.posicion.y, element.orientacion.x - element.posicion.x)
                            pos.z = z
                            pos.tipo = "foto"
                            checkpoints.push(pos)
                        }

                    });

                    console.log(checkpoints)
                    seguir = true
                    // Toma los valores del mensaje
                    //destino_x = result.msg[0].posiciones[0].x;
                    //destino_y = result.msg[0].posiciones[0].y;
                    // Crea el mensaje goal pose recibido desde Firebase
                    //var mensaje = generarMensajeGoalPose(destino_x/100*1.9, destino_y/100*2.1)
                    //console.log(mensaje)
                    //goal_pose.publish(mensaje);
                    // Inicia la ruta
                    nextCheckpoint();
                } catch (error) {
                    console.error(error);
                }
            })
            .catch(error => console.error(error));
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
function generarMensajeGoalPose(x, y, z) {
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
                z: z,
                w: 0.8
            }
        }
    })

    return mensaje
}

function nextCheckpoint() {
    setTimeout(function () {
        if (seguir) {
            let checkpoint = checkpoints[checkpoint_actual]
            destinoAlcanzado(checkpoint)
            nextCheckpoint()
        }
    }, tiempo_espera)
}

/**
 * 
 * @param {*} px 
 * @param {*} py 
 * @param {*} element 
 * @returns 
 */
function relativePosRobot(px, py, element) {
    var rect = element.getBoundingClientRect();

    return {
        x: Math.floor(px * rect.width / limite_mapa_x),
        y: Math.floor(py * rect.height / limite_mapa_y)
    };
}



/**
 * Se llama cuando el goal pose ha sido alcanzado
 * @param {*} x 
 * @param {*} y 
 */
function destinoAlcanzado(checkpoint) {

    if (checkpoint_actual >= checkpoints.length) {
        console.log("fin")
        seguir = false
        checkpoints = []
        checkpoint_actual = 0
        return
    }
    console.log(checkpoint)
    console.log(checkpoint_actual)

    if (checkpoint.tipo == "ruta") {
        tiempo_espera = 300
        destino_x = checkpoint.x / 100 * limite_mapa_x
        destino_y = checkpoint.y / 100 * limite_mapa_y

        console.log(robos_x, robos_y)
        console.log(destino_x, destino_y)
        if (Math.abs(robos_x - destino_x) < 0.4 && Math.abs(robos_y - destino_y) < 0.4) {
            checkpoint_actual++
        } else {
            goal_pose.publish(generarMensajeGoalPose(destino_x, destino_y, checkpoint.z))
            console.log("llegadisimo")
            //checkpoint_actual++
        }
    } else if (checkpoint.tipo == "foto") {
        console.log("foto")
        tiempo_espera = 2000
        checkpoint_actual++
        guardarFoto();
        // TODO: mostrar destino alcanzado
    }

    // Si es el ultimo checkpoint envia las fotos a firebase
    if (checkpoint_actual == checkpoints.length - 1) {
        sendRosData(images_data);
    }
}

/**
 * Guarda la imagen actual en el canvas
 */
function guardarFoto() {
    if (imagen_camara != null) {
        images_data = {
            images: []
        }
        images_data.images.push(imagen_camara);
    }
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

