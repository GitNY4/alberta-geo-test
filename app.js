/*
 TestTrack app.js v3
*/


let testId = generateTestId();


let locationData = {

latitude:null,
longitude:null,
accuracy:null,
capturedAt:null,
accuracyCheck:null,
coordinateLocation:null,
qualityAssessment:null

};



document.addEventListener(
"DOMContentLoaded",
()=>{


userAgent.value=navigator.userAgent;


device.value = detectDevice();


toggleFailure();


refreshLocation();


}

);





/*
 =====================
 TEST ID
 =====================
*/


function generateTestId(){


let d=new Date();


return (

"TT-" +

d.toISOString()
.substring(0,10)
.replaceAll("-","")

+

"-"

+

d.toTimeString()
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





/*
 =====================
 DEVICE
 =====================
*/


function detectDevice(){


return {

platform:navigator.platform,

mobile:/Android|iPhone|iPad/i.test(
navigator.userAgent
),

browser:getBrowser()

};


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






/*
 =====================
 LOCATION
 =====================
*/


function refreshLocation(){


locationStatus.innerHTML=
"Refreshing location...";



navigator.geolocation.getCurrentPosition(


position=>{


let c=position.coords;


locationData.latitude=c.latitude;

locationData.longitude=c.longitude;

locationData.accuracy=Math.round(
c.accuracy
);


locationData.capturedAt=
new Date().toISOString();



locationData.accuracyCheck=
checkAccuracy(
locationData.accuracy
);



locationData.coordinateLocation=
estimateCoordinateLocation(
c.latitude,
c.longitude
);



locationData.qualityAssessment={

locationUsable:
locationData.accuracyCheck.acceptable,

reason:
locationData.accuracyCheck.reason

};



displayLocation();



},


error=>{


locationStatus.innerHTML=
`
Location failed<br><br>
${error.message}
`;

},


{

enableHighAccuracy:true,

timeout:15000,

maximumAge:0

}



);


}





function checkAccuracy(acc){


if(acc<=20){


return {

acceptable:true,

status:"HIGH",

reason:"Excellent GPS accuracy"

};


}



if(acc<=100){


return {

acceptable:true,

status:"ACCEPTABLE",

reason:"Location precision acceptable for testing"

};


}




if(acc<=500){


return {

acceptable:true,

status:"LOW",

reason:
"Location returned but precision reduced"

};


}




return {

acceptable:false,

status:"POOR",

reason:
"Accuracy exceeds acceptable threshold"

};



}







function displayLocation(){


let l=locationData;


locationStatus.innerHTML=


`

<b>Location captured</b>

<br><br>


Latitude:
${l.latitude}

<br>

Longitude:
${l.longitude}

<br>

Accuracy:
${l.accuracy}m

<br><br>


Status:

<b>${l.accuracyCheck.status}</b>


<br>

${l.accuracyCheck.reason}


<br><br>


Region estimate:

<br>

${geoLabel(l.coordinateLocation)}


<br><br>

Captured:

<br>

${l.capturedAt}


`;



}







/*
 =====================
 IP LOCATION
 =====================
*/


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


source:
"IP",


confidence:
"medium"


};



}

catch(e){


return {


country:"unknown",

region:"unknown",

source:"unavailable",

confidence:"low"


};


}


}








/*
 =====================
 FAILURE
 =====================
*/


result.addEventListener(
"change",
toggleFailure
);



function toggleFailure(){


failureSection.style.display =

result.value==="FAIL"

?

"block"

:

"none";


}








/*
 =====================
 JSON
 =====================
*/


async function buildJSON(){



return {


testId:testId,


timestamp:
new Date().toISOString(),



tester:
tester.value,


testFlow:
flow.value,


scenario:
scenario.value,



result:
result.value,



failureType:

result.value==="FAIL"

?

failureType.value

:

null,





device:
detectDevice(),




browser:

{

userAgent:
userAgent.value

},




network:

{

manualCarrier:
networkManual.value

},




ipLocation:
await getIPLocation(),




coordinateLocation:
locationData.coordinateLocation,



locationAccuracy:

locationData.accuracyCheck,



qualityAssessment:

locationData.qualityAssessment,



coordinates:

{

latitude:
locationData.latitude,

longitude:
locationData.longitude,

accuracy:
locationData.accuracy

},




description:
description.value



};



}







/*
 =====================
 EMAIL
 =====================
*/


async function generateEmail(){


let data =
await buildJSON();



let json =
JSON.stringify(
data,
null,
2
);



location.href =

"mailto:nyoung@itsmanagement.net?subject="

+

encodeURIComponent(

`[TEST][${data.result}][${data.testFlow}] ${data.testId}`

)

+

"&body="

+

encodeURIComponent(json);



alert(

"Test ID:\n\n"+testId

);


}








/*
 =====================
 COPY JSON
 =====================
*/


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

"JSON copied\n\n"

+

testId

);



}








/*
 =====================
 RESET
 =====================
*/


function resetForm(){


scenario.value="";

description.value="";

networkManual.value="";


result.value="PASS";


testId =
generateTestId();



locationData={

latitude:null,

longitude:null,

accuracy:null,

capturedAt:null,

accuracyCheck:null,

coordinateLocation:null,

qualityAssessment:null

};



toggleFailure();


refreshLocation();



}






refreshLocation();



document
.getElementById("refreshLocation")
.onclick=refreshLocation;


document
.getElementById("generateEmail")
.onclick=generateEmail;


document
.getElementById("copyJSON")
.onclick=copyJSON;


document
.getElementById("reset")
.onclick=resetForm;






if(
"serviceWorker" in navigator
){

navigator.serviceWorker.register(
"sw.js"
)
.catch(()=>{});

}
