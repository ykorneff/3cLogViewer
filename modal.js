// Get the modal
var modal = document.getElementById("aboutWindow");
var sysInfo = document.getElementById("systemInfoWindow");

// Get the button that opens the modal
var btn = document.getElementById("showAbout");
var sysInfoBtn = document.getElementById("showSystemInfo");

// Get the <span> element that closes the modal
var spanAbout = document.getElementById("closeAbout");
var spanSysInfo = document.getElementById("closeSysInfo");


// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

sysInfoBtn.onclick = function() {
  sysInfo.style.display = "block";
  //let infoArea = document.getElementById("systemInfo");
  //document.createElement("P",)
  //infoArea.appendChild(document.createTextNode('@#%T@#$GSDFGSD'));

}

// When the user clicks on <span> (x), close the modal
spanAbout.onclick = function() {
  modal.style.display = "none";
}

spanSysInfo.onclick = function() {
  sysInfo.style.display = "none";
  //let infoArea = document.getElementById("systemInfo");
  //document.createElement("P",)
  //infoArea.appendChild(document.createTextNode('@#%T@#$GSDFGSD'));
  
}

// When the user clicks anywhere outside of the modal, close it
/*window.onclick = function(event) {
  console.log(event);
  
  if (event.target == modal) {
    modal.style.display = "none";
    sysInfo.style.display = "none";
  }
}*/