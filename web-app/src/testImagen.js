// TESTING
function testImagen() {
    var image = new Image();
    image.src = "img/my_map.png";
    image.onload = function () {      
        imagen_camara = image.src;
        let png64 = image.baseURI;
        let blob = b64toBlob(png64, 'image/png');
        let url = URL.createObjectURL(blob);
        imagen_camara = url;
        guardarFoto();
        console.log(images_data);
        sendRosData(images_data);
    }
}

/**
 * Convert a base64 string to a Blob
 * @param {*} dataURI 
 * @returns blob
 */
function b64toBlob(dataURI) {
    var byteString = buf.from(dataURI, 'base64');
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);

    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {
        type: 'image/png'
    });
}