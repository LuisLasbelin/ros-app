// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const updateOnlineStatus = () => {
  let status = document.getElementById('internet_status');
  if(navigator.onLine) {
      status.classList.remove('circle-red');
      status.classList.add('circle-green');
  } else {
      status.classList.remove('circle-green');
      status.classList.add('circle-red');
  }
}

document.addEventListener('online', updateOnlineStatus)
document.addEventListener('offline', updateOnlineStatus)

updateOnlineStatus()
