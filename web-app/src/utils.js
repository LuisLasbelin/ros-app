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

