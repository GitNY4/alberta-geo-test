/*
 TestTrack geo.js v3

 Offline coordinate location estimation.

 No API calls.
 No external dependencies.

 Supports:
 - Australia states
 - Canada provinces
 - UK regions

 Returns confidence rating.
*/


function estimateCoordinateLocation(lat, lon){


if(
typeof lat !== "number" ||
typeof lon !== "number"
){

return {

country:"unknown",
province:"unknown",
method:"offline-boundary-estimate",
confidence:"low"

};

}





/*
 ==========================
 AUSTRALIA
 ==========================
*/


// NSW
if(
lat >= -37.7 &&
lat <= -28 &&
lon >= 140.9 &&
lon <= 154
){

return {

country:"Australia",
province:"New South Wales",
method:"offline-boundary-estimate",
confidence:"medium"

};

}



// Victoria
if(
lat >= -39.2 &&
lat <= -34 &&
lon >= 140.5 &&
lon <= 150
){

return {

country:"Australia",
province:"Victoria",
method:"offline-boundary-estimate",
confidence:"medium"

};

}



// Queensland
if(
lat >= -29.3 &&
lat <= -10 &&
lon >= 137 &&
lon <= 154
){

return {

country:"Australia",
province:"Queensland",
method:"offline-boundary-estimate",
confidence:"medium"

};

}



// Western Australia
if(
lat >= -35 &&
lat <= -13 &&
lon >= 112 &&
lon <= 129
){

return {

country:"Australia",
province:"Western Australia",
method:"offline-boundary-estimate",
confidence:"medium"

};

}



// South Australia
if(
lat >= -39 &&
lat <= -25 &&
lon >= 129 &&
lon <= 141
){

return {

country:"Australia",
province:"South Australia",
method:"offline-boundary-estimate",
confidence:"medium"

};

}





/*
 ==========================
 CANADA
 ==========================
*/


// Alberta
if(
lat >= 49 &&
lat <= 60 &&
lon >= -120 &&
lon <= -110
){

return {

country:"Canada",
province:"Alberta",
method:"offline-boundary-estimate",
confidence:"medium"

};

}




// British Columbia
if(
lat >= 48 &&
lat <= 60 &&
lon >= -139 &&
lon <= -114
){

return {

country:"Canada",
province:"British Columbia",
method:"offline-boundary-estimate",
confidence:"medium"

};

}





// Ontario
if(
lat >= 41 &&
lat <= 57 &&
lon >= -95 &&
lon <= -74
){

return {

country:"Canada",
province:"Ontario",
method:"offline-boundary-estimate",
confidence:"medium"

};

}




// Quebec
if(
lat >= 45 &&
lat <= 62 &&
lon >= -80 &&
lon <= -57
){

return {

country:"Canada",
province:"Quebec",
method:"offline-boundary-estimate",
confidence:"medium"

};

}





/*
 ==========================
 UNITED KINGDOM
 ==========================
*/


if(
lat >= 49.8 &&
lat <= 59 &&
lon >= -8.5 &&
lon <= 2
){

return {

country:"United Kingdom",
province:"England / Scotland / Wales estimate",
method:"offline-boundary-estimate",
confidence:"low"

};

}





/*
 ==========================
 FALLBACK
 ==========================
*/


return {

country:"unknown",
province:"unknown",
method:"offline-boundary-estimate",
confidence:"low"

};


}





/*
 Optional helper:
 returns readable label
*/


function geoLabel(location){


if(!location)
return "Unknown";


if(
location.country==="unknown"
){

return "Unknown";

}


return location.province
?
`${location.country} - ${location.province}`
:
location.country;


}
