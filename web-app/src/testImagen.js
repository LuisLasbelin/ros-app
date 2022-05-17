// TESTING
function testImagen() {
    var image = new Image();
    image.src = "img/my_map.png";
    image.onload = function () {      
        let canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.src = image;
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(this, 0, 0);
        var dataURL = canvas.toDataURL('image/png');
        imagen_camara = dataURL;
        guardarFoto(imagen_camara);
        console.log(dataURL);
        sendRosData(images_data);
    }
}