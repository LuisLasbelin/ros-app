document.addEventListener('DOMContentLoaded', event => {
    
    let status = document.getElementById("internet-status")
    
    window.addEventListener('offline', function(e) { 
       status.classList.add("circle-red") 
       status.classList.remove("circle-green")
    });

    window.addEventListener('online', function(e) {
        status.classList.remove("circle-red") 
        status.classList.add("circle-green")
    });
});