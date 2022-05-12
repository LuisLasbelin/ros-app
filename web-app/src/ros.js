// -------------------------------------------------------
// Autores: Luis Belloch, Adrian Maldonado
// Fecha: 20/03/2022
// Descripcion: Este archivo es el que se encarga de la comunicacion con el servidor y el
// robot
// -------------------------------------------------------

import Constants from './constants.js';

//---------ROS-----------
let data = {
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

//---------ROBOS-----------
let robos_x = 0
let robos_y = 0

let destino_x = 0
let destino_y = 0

let checkpoints = []
let checkpoint_actual = 0

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
    image.src = "img/my_map.jpg";
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
                ctx.arc(pos.x, pos.y, 60, 0, 2 * Math.PI);

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
    botonEnviar.addEventListener("click", sendROSData)
    // Recoger datos de firebase
    var botonDescargar = document.getElementById("btn-fetch")
    // Asigna la funcion senData al boton de enviar
    botonDescargar.addEventListener("click", fetchROSData)

    // Se asigna cuando se usa, se guarda aqui como global para poder usarla en las funciones
    var idSlot = 0;

    // Comprueba cookies para la pagina
    checkCookies();

    /**
     * Se conecta a ROS por un websocket
     */
    function connect() {
        console.log("Clic en connect")

        data.ros = new ROSLIB.Ros({
            url: data.rosbridge_address
        })

        goal_pose.ros = data.ros
        odom.ros = data.ros

        // TODO: mostrar que se ha conectado cambiado el circulo de color y cambiando de
        // boton conectar a desconectar

        // Define callbacks
        data.ros.on("connection", () => {
            data.connected = true
            //mover()
            console.log("Conexion con ROSBridge correcta")

        })
        data.ros.on("data", (data) => {
            console.log("Se ha producido algun data")
            console.log(data)
        })
        data.ros.on("error", (error) => {
            console.log("Se ha producido algun error mientras se intentaba realizar la conexion")
            console.log(error)
        })
        data.ros.on("close", () => {
            data.connected = false
            console.log("Conexion con ROSBridge cerrada")
        })

        odom.subscribe(function (message) {
            robos_x = message.pose.pose.position.x
            robos_y = message.pose.pose.position.y
            //console.log(message)
            dibujar()
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
            connection_data: data,
            msg: []
        }

        // Guarda cookies con la ID de conexion para no tener que ponerla cada vez
        document.cookie = "ros_id=" + idSlot + ";";

        putData(idSlot, msg);
    }

    /**
     * Se desconecta del Robot
     */
    function disconnect() {
        data.ros.close()
        data.connected = false
        console.log('Clic en botón de desconexión')
        // TODO: mostrar que se ha desconectado cambiado el circulo de color y cambiando
        // de boton desconectar a conectar
    }
    /**
     * Obtiene datos desde firebase
     */
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
                try {
                    // Toma los valores del mensaje
                    destino_x = result.msg[0].posiciones[0].x;
                    destino_y = result.msg[0].posiciones[0].y;
                    // Crea el mensaje goal pose recibido desde Firebase
                    var mensaje = generarMensajeGoalPose(destino_x, destino_y)
                    console.log(mensaje)
                    goal_pose.publish(mensaje);
                    // Inicia la ruta
                    //nextCheckpoint();
                } catch (error) {
                    console.error(error);
                }
            })
            .catch(error => console.error(error));
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
    for (let i = 0; i < ca.length; i++) {
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

/**
 * Dibuja una imagen escalada en un canvas
 * @param {*} img image to draw
 * @param {*} ctx canvas context
 */
function drawImageScaled(img, ctx) {
    var canvas = ctx.canvas;
    var hRatio = canvas.width / img.width;
    var vRatio = canvas.height / img.height;
    var ratio = Math.min(hRatio, vRatio);
    var centerShift_x = (canvas.width - img.width * ratio) / 2;
    var centerShift_y = (canvas.height - img.height * ratio) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
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
    setTimeout(function () {
        let checkpoint = checkpoints[checkpoint_actual]
        destinoAlcanzado(checkpoint[0], checkpoint[1])
        goal_pose.publish(generarMensajeGoalPose(checkpoint[0], checkpoint[1]))
        nextCheckpoint()
    }, 300)
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
        x: Math.floor(px * rect.width / 11.5),
        y: Math.floor(py * rect.height / 9.5)
    };
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

    } else {
        // TODO: mostrar en camino

        //console.log(robos_x,destino_x)
        //console.log(robos_y,destino_y)
    }
}