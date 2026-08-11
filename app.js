/*
 TestTrack app.js v6
*/


function ttGenerateTestId(){

let now = new Date();

return (

"TT-" +

now.toISOString()
.substring(0,10)
.replaceAll("-","")

+

"-"

+

now.toTimeString()
.substring(0,8)
.replaceAll(":","")

+

"-"

+

Math.random()
.toString(36)
.substring(2,7)
.toUpperCase()

);

}


// Set immediately, at script-parse time — not inside DOMContentLoaded —
// so media.js (loaded after this file) can always read a real value.
let testId = ttGenerateTestId();
window.TestTrackTestId = testId;



document.addEventListener("DOMContentLoaded", function(){



const tester = document.getElementById("tester");
const flow = document.getElementById("flow");
const scenario = document.getElementById("scenario");

const result = document.getElementById("result");

const failureSection = document.getElementById("failureSection");
const failureType = document.getElementById("failureType");

const device = document.getElementById("device");
const userAgent = document.getElementById("userAgent");

const networkManual = document.getElementById("networkManual");

const description = document.getElementById("description");

const locationStatus = document.getElementById("locationStatus");

const refreshButton =
document.getElementById("refreshLocation");

const emailButton =
document.getElementById("generateEmail");

const copyButton =
document.getElementById("copyJSON");

const resetButton =
document.getElementById("reset");



let locationData = {

latitude:null,
longitude:null,
accuracy:null,
capturedAt:null,
accuracyCheck:null,
coordinateLocation:null

};




userAgent.value = navigator.userAgent;

device.value = getDeviceSummary();




result.addEventListener(
"change",
toggleFailure
);



refreshButton.addEventListener(
"click",
refreshLocation
);



emailButton.addEventListener(
"click",
generateEmail
);



copyButton.addEventListener(
"click",
copyJSON
);



resetButton.addEventListener(
"click",
resetForm
);




toggleFailure();

refreshLocation();








function getDevice(){


return {

platform:navigator.platform,

mobile:
(/Android|iPhone|iPad/i)
.test(navigator.userAgent),

browser:
getBrowser()


};


}



function getDeviceSummary(){

let d = getDevice();

return (

d.platform +

" — " +

d.browser +

" (" +

(d.mobile ? "Mobile" : "Desktop") +

")"

);

}






function getBrowser(){


let ua=navigator.userAgent;


if(ua.includes("Chrome"))
return "Chrome";


if(ua.includes("Firefox"))
return "Firefox";


if(ua.includes("Safari"))
return "Safari";


return "Unknown";


}








function toggleFailure(){


failureSection.style.display =

result.value==="FAIL"

?

"block"

:

"none";


}









function refreshLocation(){


locationStatus.innerHTML =
'<span class="loc-idle">Refreshing location…</span>';



if(!navigator.geolocation){


locationStatus.innerHTML =
'<span class="loc-idle">Geolocation not supported</span>';


return;


}



navigator.geolocation.getCurrentPosition(


function(position){


let coords =
position.coords;



locationData.latitude =
coords.latitude;


locationData.longitude =
coords.longitude;


locationData.accuracy =
Math.round(coords.accuracy);



locationData.capturedAt =
new Date().toISOString();




locationData.accuracyCheck =
checkAccuracy(
locationData.accuracy
);




locationData.coordinateLocation =
estimateCoordinateLocation(

locationData.latitude,

locationData.longitude

);




displayLocation();




// Upgrade to a precise result if we have a network connection —
// silently keeps the offline estimate if this fails or times out.
estimateCoordinateLocationOnline(

locationData.latitude,

locationData.longitude

).then(function(onlineResult){

if (onlineResult) {

locationData.coordinateLocation = onlineResult;

displayLocation();

}

});



},




function(error){


locationStatus.innerHTML =

'<span class="loc-idle">Location failed:<br>' +

error.message +

'</span>';



},



{

enableHighAccuracy:true,

timeout:15000,

maximumAge:0

}


);



}








function checkAccuracy(value){



if(value<=20){


return {

status:"HIGH",

acceptable:true,

reason:
"Excellent GPS accuracy"

};


}



if(value<=100){


return {

status:"ACCEPTABLE",

acceptable:true,

reason:
"Suitable for testing"

};


}



if(value<=500){


return {

status:"LOW",

acceptable:true,

reason:
"Reduced precision"

};


}




return {

status:"POOR",

acceptable:false,

reason:
"Accuracy likely unreliable"

};



}









function displayLocation(){


let status = locationData.accuracyCheck.status;

let statusClass = {
HIGH:"status-high",
ACCEPTABLE:"status-acceptable",
LOW:"status-low",
POOR:"status-poor"
}[status];


locationStatus.innerHTML =

`
<div class="loc-primary">
<span class="loc-value">${locationData.accuracy}<span class="loc-unit">m</span></span>
<span class="loc-status-badge ${statusClass}">${status}</span>
</div>

<div class="acc-scale">
<span class="acc-seg ${status==="HIGH"?"active seg-h":""}"></span>
<span class="acc-seg ${status==="ACCEPTABLE"?"active seg-a":""}"></span>
<span class="acc-seg ${status==="LOW"?"active seg-l":""}"></span>
<span class="acc-seg ${status==="POOR"?"active seg-p":""}"></span>
</div>

<div class="loc-reason">${locationData.accuracyCheck.reason}</div>

<div class="loc-grid">
<div>
<span class="loc-label">Latitude</span>
<span class="loc-mono">${locationData.latitude.toFixed(6)}</span>
</div>
<div>
<span class="loc-label">Longitude</span>
<span class="loc-mono">${locationData.longitude.toFixed(6)}</span>
</div>
<div>
<span class="loc-label">Region ${locationData.coordinateLocation.method==="bigdatacloud-api"?'<span style="color:var(--accent);">· verified</span>':'<span style="color:var(--text-faint);">· offline est.</span>'}</span>
<span class="loc-mono">${geoLabel(locationData.coordinateLocation)}</span>
</div>
<div>
<span class="loc-label">Captured</span>
<span class="loc-mono">${locationData.capturedAt}</span>
</div>
</div>
`;



}









async function getIPLocation(){



try{


let response =
await fetch(
"https://ipapi.co/json/"
);


let data =
await response.json();



return {

country:
data.country_name || "unknown",

region:
data.region || "unknown",

source:"IP",

confidence:"medium"

};



}

catch(error){


return {

country:"unknown",

region:"unknown",

source:"unavailable",

confidence:"low"

};


}



}









async function buildJSON(){



return {


testId:testId,


timestamp:
new Date().toISOString(),



tester:tester.value,


testFlow:flow.value,


scenario:scenario.value,



result:result.value,



failureType:

result.value==="FAIL"

?

failureType.value

:

null,



device:getDevice(),



browser:{

userAgent:userAgent.value

},




network:{

manualCarrier:
networkManual.value

},




ipLocation:
await getIPLocation(),




coordinateLocation:
locationData.coordinateLocation,



locationAccuracy:
locationData.accuracyCheck,



coordinates:{

latitude:
locationData.latitude,

longitude:
locationData.longitude,

accuracy:
locationData.accuracy

},



description:
description.value,



media:

window.TestTrackMedia

?

window.TestTrackMedia.getUrls()

:

[]



};


}









async function generateEmail(){



let data =
await buildJSON();



let json =
JSON.stringify(
data,
null,
2
);



window.location.href =

"mailto:nyoung@itsmanagement.net?subject="

+

encodeURIComponent(

"[TEST]["+

data.result+

"]["+

data.testFlow+

"] "+

data.testId

)

+

"&body="

+

encodeURIComponent(json);



}









async function copyJSON(){



let data =
await buildJSON();



let json =
JSON.stringify(
data,
null,
2
);



await navigator.clipboard.writeText(json);



alert(
"JSON copied\n\n"+testId
);



}









function resetForm(){



scenario.value="";

description.value="";

networkManual.value="";


result.value="PASS";


testId =
ttGenerateTestId();

window.TestTrackTestId = testId;

document.dispatchEvent(
new CustomEvent("testtrack:reset",{detail:{testId:testId}})
);



locationData={

latitude:null,

longitude:null,

accuracy:null,

capturedAt:null,

accuracyCheck:null,

coordinateLocation:null

};



toggleFailure();


refreshLocation();



}




});
