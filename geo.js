/*
 TestTrack geo.js

 Two location-lookup paths:
   1. estimateCoordinateLocation()      — offline, instant, hardcoded bounding
                                           boxes. No network required.
   2. estimateCoordinateLocationOnline() — free BigDataCloud reverse-geocode
                                           API. No API key. Requires network.
                                           Returns null on any failure so the
                                           caller can just keep the offline
                                           estimate.
*/


function estimateCoordinateLocation(latitude, longitude) {


    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
    ) {

        return {

            country: "unknown",
            province: "unknown",
            method: "offline-estimate",
            confidence: "low"

        };

    }



    /*
    =========================
    AUSTRALIA
    =========================
    */


    // New South Wales
    if (
        latitude >= -37.8 &&
        latitude <= -28.0 &&
        longitude >= 140.5 &&
        longitude <= 154.5
    ) {

        return {

            country: "Australia",
            province: "New South Wales",
            method: "offline-estimate",
            confidence: "medium"

        };

    }



    // Victoria
    if (
        latitude >= -39.2 &&
        latitude <= -34.0 &&
        longitude >= 140.5 &&
        longitude <= 150.0
    ) {

        return {

            country: "Australia",
            province: "Victoria",
            method: "offline-estimate",
            confidence: "medium"

        };

    }



    // Queensland
    if (
        latitude >= -29.5 &&
        latitude <= -10.0 &&
        longitude >= 137.0 &&
        longitude <= 154.5
    ) {

        return {

            country: "Australia",
            province: "Queensland",
            method: "offline-estimate",
            confidence: "medium"

        };

    }





    /*
    =========================
    CANADA
    =========================
    */


    // Alberta
    if (
        latitude >= 49.0 &&
        latitude <= 60.0 &&
        longitude >= -120.0 &&
        longitude <= -110.0
    ) {

        return {

            country: "Canada",
            province: "Alberta",
            method: "offline-estimate",
            confidence: "medium"

        };

    }



    // British Columbia
    if (
        latitude >= 48.0 &&
        latitude <= 60.0 &&
        longitude >= -139.0 &&
        longitude <= -114.0
    ) {

        return {

            country: "Canada",
            province: "British Columbia",
            method: "offline-estimate",
            confidence: "medium"

        };

    }



    // Ontario
    if (
        latitude >= 41.0 &&
        latitude <= 57.0 &&
        longitude >= -95.0 &&
        longitude <= -74.0
    ) {

        return {

            country: "Canada",
            province: "Ontario",
            method: "offline-estimate",
            confidence: "medium"

        };

    }





    /*
    =========================
    UNITED KINGDOM
    =========================
    */


    if (
        latitude >= 49.5 &&
        latitude <= 59.5 &&
        longitude >= -8.5 &&
        longitude <= 2.0
    ) {

        return {

            country: "United Kingdom",
            province: "Region unavailable",
            method: "offline-estimate",
            confidence: "low"

        };

    }





    return {

        country: "unknown",
        province: "unknown",
        method: "offline-estimate",
        confidence: "low"

    };


}




async function estimateCoordinateLocationOnline(latitude, longitude) {

    if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
    ) {

        return null;

    }

    try {

        let response = await fetch(
            "https://api.bigdatacloud.net/data/reverse-geocode-client" +
            "?latitude=" + latitude +
            "&longitude=" + longitude +
            "&localityLanguage=en"
        );

        if (!response.ok) {

            return null;

        }

        let data = await response.json();

        if (!data || !data.countryName) {

            return null;

        }

        return {

            country: data.countryName,
            province: data.principalSubdivision || "Region unavailable",
            city: data.city || data.locality || null,
            method: "bigdatacloud-api",
            confidence: "high"

        };

    }

    catch (error) {

        // No network, request blocked, or API unavailable —
        // caller keeps whatever offline estimate it already has.
        return null;

    }

}




function geoLabel(location) {


    if (!location) {

        return "Unknown";

    }


    if (location.country === "unknown") {

        return "Unknown";

    }


    if (location.province) {

        return (
            location.country +
            " - " +
            location.province
        );

    }


    return location.country;


}
