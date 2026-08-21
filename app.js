/*
 TestTrack app.js v7
*/

"use strict";

const TESTTRACK_EMAIL_ADDRESS = "nyoung@itsmanagement.net";

function ttGenerateTestId() {
  const now = new Date();

  return (
    "TT-" +
    now
      .toISOString()
      .substring(0, 10)
      .replaceAll("-", "") +
    "-" +
    now
      .toTimeString()
      .substring(0, 8)
      .replaceAll(":", "") +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()
  );
}

/*
 Set the ID immediately. media.js can then read it even if media.js
 loads before the DOMContentLoaded event.
*/
let testId = ttGenerateTestId();
window.TestTrackTestId = testId;

document.addEventListener("DOMContentLoaded", function () {
  const tester = document.getElementById("tester");
  const flow = document.getElementById("flow");
  const scenario = document.getElementById("scenario");
  const accountNumber = document.getElementById("accountNumber");
  const accountUrl = document.getElementById("accountUrl");
  const result = document.getElementById("result");
  const failureSection = document.getElementById("failureSection");
  const failureType = document.getElementById("failureType");
  const device = document.getElementById("device");
  const userAgent = document.getElementById("userAgent");
  const networkManual = document.getElementById("networkManual");
  const description = document.getElementById("description");
  const locationStatus = document.getElementById("locationStatus");
  const refreshButton = document.getElementById("refreshLocation");
  const emailButton = document.getElementById("generateEmail");
  const copyButton = document.getElementById("copyJSON");
  const resetButton = document.getElementById("reset");

  let locationData = createEmptyLocationData();

  initialiseApp();

  function initialiseApp() {
    const missingElementIds = [];

    const requiredElements = {
      tester: tester,
      flow: flow,
      scenario: scenario,
      result: result,
      failureSection: failureSection,
      failureType: failureType,
      device: device,
      userAgent: userAgent,
      networkManual: networkManual,
      description: description,
      locationStatus: locationStatus,
      refreshLocation: refreshButton,
      generateEmail: emailButton,
      copyJSON: copyButton,
      reset: resetButton
    };

    Object.entries(requiredElements).forEach(function (entry) {
      const elementId = entry[0];
      const element = entry[1];

      if (!element) {
        missingElementIds.push(elementId);
      }
    });

    if (missingElementIds.length > 0) {
      console.error(
        "TestTrack could not start. Missing HTML elements:",
        missingElementIds
      );

      return;
    }

    /*
     Account number and URL are optional. The form still works if an
     older copy of the HTML does not contain these inputs.
    */
    userAgent.value = navigator.userAgent;
    device.value = getDeviceSummary();

    result.addEventListener("change", toggleFailure);
    refreshButton.addEventListener("click", refreshLocation);
    emailButton.addEventListener("click", generateEmail);
    copyButton.addEventListener("click", copyJSON);
    resetButton.addEventListener("click", resetForm);

    toggleFailure();
    refreshLocation();
  }

  function createEmptyLocationData() {
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      capturedAt: null,
      accuracyCheck: null,
      coordinateLocation: null
    };
  }

  function getDevice() {
    return {
      platform: getPlatform(),
      mobile: /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
      ),
      browser: getBrowser()
    };
  }

  function getPlatform() {
    /*
     navigator.platform is deprecated, but it remains useful as a
     fallback for the existing TestTrack data structure.
    */
    if (
      navigator.userAgentData &&
      navigator.userAgentData.platform
    ) {
      return navigator.userAgentData.platform;
    }

    return navigator.platform || "Unknown";
  }

  function getDeviceSummary() {
    const detectedDevice = getDevice();

    return (
      detectedDevice.platform +
      " — " +
      detectedDevice.browser +
      " (" +
      (detectedDevice.mobile ? "Mobile" : "Desktop") +
      ")"
    );
  }

  function getBrowser() {
    const userAgentValue = navigator.userAgent;

    if (
      userAgentValue.includes("Edg/") ||
      userAgentValue.includes("EdgiOS/") ||
      userAgentValue.includes("EdgA/")
    ) {
      return "Edge";
    }

    if (
      userAgentValue.includes("OPR/") ||
      userAgentValue.includes("Opera")
    ) {
      return "Opera";
    }

    if (
      userAgentValue.includes("CriOS/") ||
      userAgentValue.includes("Chrome/")
    ) {
      return "Chrome";
    }

    if (
      userAgentValue.includes("FxiOS/") ||
      userAgentValue.includes("Firefox/")
    ) {
      return "Firefox";
    }

    if (
      userAgentValue.includes("Safari/") &&
      userAgentValue.includes("Version/")
    ) {
      return "Safari";
    }

    return "Unknown";
  }

  function toggleFailure() {
    const isFailure = result.value === "FAIL";

    failureSection.style.display = isFailure
      ? "block"
      : "none";

    failureSection.hidden = !isFailure;

    if (failureType) {
      failureType.disabled = !isFailure;
    }
  }

  function refreshLocation(event) {
    if (event) {
      event.preventDefault();
    }

    locationStatus.innerHTML =
      '<span class="loc-idle">Refreshing location…</span>';

    if (!navigator.geolocation) {
      locationStatus.innerHTML =
        '<span class="loc-idle">' +
        "Geolocation is not supported by this browser." +
        "</span>";

      return;
    }

    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  function handleLocationSuccess(position) {
    const coordinates = position.coords;

    locationData.latitude = coordinates.latitude;
    locationData.longitude = coordinates.longitude;
    locationData.accuracy = Math.round(
      coordinates.accuracy
    );
    locationData.capturedAt = new Date().toISOString();
    locationData.accuracyCheck = checkAccuracy(
      locationData.accuracy
    );

    /*
     These functions must exist in the geolocation script used by
     TestTrack.
    */
    if (
      typeof window.estimateCoordinateLocation ===
      "function"
    ) {
      locationData.coordinateLocation =
        window.estimateCoordinateLocation(
          locationData.latitude,
          locationData.longitude
        );
    } else if (
      typeof estimateCoordinateLocation === "function"
    ) {
      locationData.coordinateLocation =
        estimateCoordinateLocation(
          locationData.latitude,
          locationData.longitude
        );
    } else {
      locationData.coordinateLocation = {
        country: "unknown",
        province: "unknown",
        method: "coordinates-only",
        confidence: "low"
      };
    }

    displayLocation();

    /*
     Upgrade the offline result when the online location function is
     available. Keep the original result if the online request fails.
    */
    let onlineLocationPromise = null;

    if (
      typeof window.estimateCoordinateLocationOnline ===
      "function"
    ) {
      onlineLocationPromise =
        window.estimateCoordinateLocationOnline(
          locationData.latitude,
          locationData.longitude
        );
    } else if (
      typeof estimateCoordinateLocationOnline ===
      "function"
    ) {
      onlineLocationPromise =
        estimateCoordinateLocationOnline(
          locationData.latitude,
          locationData.longitude
        );
    }

    if (
      onlineLocationPromise &&
      typeof onlineLocationPromise.then === "function"
    ) {
      onlineLocationPromise
        .then(function (onlineResult) {
          if (onlineResult) {
            locationData.coordinateLocation =
              onlineResult;

            displayLocation();
          }
        })
        .catch(function (error) {
          console.warn(
            "Online coordinate lookup failed:",
            error
          );
        });
    }
  }

  function handleLocationError(error) {
    console.warn("Geolocation failed:", error);

    locationStatus.innerHTML =
      '<span class="loc-idle">' +
      "Location failed:<br>" +
      escapeHTML(
        error && error.message
          ? error.message
          : "Unknown location error"
      ) +
      "</span>";
  }

  function checkAccuracy(value) {
    if (value <= 20) {
      return {
        status: "HIGH",
        acceptable: true,
        reason: "Excellent GPS accuracy"
      };
    }

    if (value <= 100) {
      return {
        status: "ACCEPTABLE",
        acceptable: true,
        reason: "Suitable for testing"
      };
    }

    if (value <= 500) {
      return {
        status: "LOW",
        acceptable: true,
        reason: "Reduced precision"
      };
    }

    return {
      status: "POOR",
      acceptable: false,
      reason: "Accuracy likely unreliable"
    };
  }

  function displayLocation() {
    if (
      locationData.latitude === null ||
      locationData.longitude === null ||
      locationData.accuracy === null ||
      !locationData.accuracyCheck
    ) {
      locationStatus.innerHTML =
        '<span class="loc-idle">' +
        "No location is available." +
        "</span>";

      return;
    }

    const status = locationData.accuracyCheck.status;

    const statusClass = {
      HIGH: "status-high",
      ACCEPTABLE: "status-acceptable",
      LOW: "status-low",
      POOR: "status-poor"
    }[status] || "";

    const coordinateLocation =
      locationData.coordinateLocation || {
        country: "unknown",
        province: "unknown",
        method: "unavailable",
        confidence: "low"
      };

    const isVerified =
      coordinateLocation.method === "bigdatacloud-api";

    const regionStatus = isVerified
      ? '<span style="color:var(--accent);">· verified</span>'
      : '<span style="color:var(--text-faint);">· offline est.</span>';

    locationStatus.innerHTML = `
      <div class="loc-primary">
        <span class="loc-value">
          ${escapeHTML(locationData.accuracy)}
          <span class="loc-unit">m</span>
        </span>
        <span class="loc-status-badge ${statusClass}">
          ${escapeHTML(status)}
        </span>
      </div>

      <div class="acc-scale">
        <span class="acc-seg ${
          status === "HIGH"
            ? "active seg-h"
            : ""
        }"></span>

        <span class="acc-seg ${
          status === "ACCEPTABLE"
            ? "active seg-a"
            : ""
        }"></span>

        <span class="acc-seg ${
          status === "LOW"
            ? "active seg-l"
            : ""
        }"></span>

        <span class="acc-seg ${
          status === "POOR"
            ? "active seg-p"
            : ""
        }"></span>
      </div>

      <div class="loc-reason">
        ${escapeHTML(
          locationData.accuracyCheck.reason
        )}
      </div>

      <div class="loc-grid">
        <div>
          <span class="loc-label">Latitude</span>
          <span class="loc-mono">
            ${escapeHTML(
              locationData.latitude.toFixed(6)
            )}
          </span>
        </div>

        <div>
          <span class="loc-label">Longitude</span>
          <span class="loc-mono">
            ${escapeHTML(
              locationData.longitude.toFixed(6)
            )}
          </span>
        </div>

        <div>
          <span class="loc-label">
            Region ${regionStatus}
          </span>
          <span class="loc-mono">
            ${escapeHTML(
              getCoordinateLocationLabel(
                coordinateLocation
              )
            )}
          </span>
        </div>

        <div>
          <span class="loc-label">Captured</span>
          <span class="loc-mono">
            ${escapeHTML(locationData.capturedAt)}
          </span>
        </div>
      </div>
    `;
  }

  function getCoordinateLocationLabel(coordinateLocation) {
    if (
      typeof window.geoLabel === "function"
    ) {
      return window.geoLabel(coordinateLocation);
    }

    if (typeof geoLabel === "function") {
      return geoLabel(coordinateLocation);
    }

    const province =
      coordinateLocation.province ||
      coordinateLocation.region ||
      "";

    const country =
      coordinateLocation.country || "";

    return (
      [province, country]
        .filter(Boolean)
        .join(", ") ||
      "Unknown"
    );
  }

  async function getIPLocation() {
    const abortController = new AbortController();

    const timeoutId = window.setTimeout(
      function () {
        abortController.abort();
      },
      8000
    );

    try {
      const response = await fetch(
        "https://ipapi.co/json/",
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          },
          signal: abortController.signal
        }
      );

      if (!response.ok) {
        throw new Error(
          "IP location request returned " +
          response.status
        );
      }

      const data = await response.json();

      return {
        country: data.country_name || "unknown",
        region: data.region || "unknown",
        source: "IP",
        confidence: "medium"
      };
    } catch (error) {
      console.warn(
        "IP location lookup failed:",
        error
      );

      return {
        country: "unknown",
        region: "unknown",
        source: "unavailable",
        confidence: "low"
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function getAccountDetails() {
    const numberValue = accountNumber
      ? accountNumber.value.trim()
      : "";

    const urlValue = accountUrl
      ? accountUrl.value.trim()
      : "";

    if (!numberValue && !urlValue) {
      return null;
    }

    return {
      accountNumber: numberValue || null,
      url: urlValue || null
    };
  }

  function validateAccountUrl() {
    if (!accountUrl) {
      return true;
    }

    const value = accountUrl.value.trim();

    if (!value) {
      accountUrl.setCustomValidity("");
      return true;
    }

    try {
      const parsedUrl = new URL(value);

      if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
      ) {
        throw new Error(
          "Only HTTP and HTTPS URLs are supported."
        );
      }

      accountUrl.setCustomValidity("");
      return true;
    } catch (error) {
      accountUrl.setCustomValidity(
        "Enter a complete HTTP or HTTPS URL."
      );

      accountUrl.reportValidity();
      return false;
    }
  }

  function validateForm() {
    const requiredElements = [
      tester,
      flow,
      scenario,
      result,
      description
    ];

    for (
      let index = 0;
      index < requiredElements.length;
      index += 1
    ) {
      const element = requiredElements[index];

      if (
        element &&
        typeof element.checkValidity === "function" &&
        !element.checkValidity()
      ) {
        element.reportValidity();
        return false;
      }
    }

    if (
      result.value === "FAIL" &&
      failureType &&
      typeof failureType.checkValidity === "function" &&
      !failureType.checkValidity()
    ) {
      failureType.reportValidity();
      return false;
    }

    return validateAccountUrl();
  }

  async function buildJSON() {
    const ipLocation = await getIPLocation();

    return {
      testId: testId,
      timestamp: new Date().toISOString(),
      tester: tester.value.trim(),
      testFlow: flow.value,
      scenario: scenario.value.trim(),
      accountDetails: getAccountDetails(),
      result: result.value,
      failureType:
        result.value === "FAIL"
          ? failureType.value
          : null,
      device: getDevice(),
      browser: {
        userAgent: userAgent.value
      },
      network: {
        manualCarrier:
          networkManual.value.trim()
      },
      ipLocation: ipLocation,
      coordinateLocation:
        locationData.coordinateLocation,
      locationAccuracy:
        locationData.accuracyCheck,
      coordinates: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        capturedAt: locationData.capturedAt
      },
      description: description.value.trim()
    };
  }

  async function generateEmail(event) {
    if (event) {
      event.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    setButtonBusy(
      emailButton,
      true,
      "Generating…"
    );

    try {
      const data = await buildJSON();

      const json = JSON.stringify(
        data,
        null,
        2
      );

      const subject =
        "[TEST][" +
        data.result +
        "][" +
        data.testFlow +
        "] " +
        data.testId;

      if (
        !TESTTRACK_EMAIL_ADDRESS ||
        TESTTRACK_EMAIL_ADDRESS ===
          "YOUR_EMAIL_ADDRESS"
      ) {
        throw new Error(
          "Set TESTTRACK_EMAIL_ADDRESS at the top of app.js."
        );
      }

      const mailtoUrl =
        "mailto:" +
        encodeURIComponent(
          TESTTRACK_EMAIL_ADDRESS
        ) +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(json);

      /*
       Keep this command directly within the original button event.
       Some mobile browsers restrict external application links after
       delayed or indirect navigation.
      */
      window.location.href = mailtoUrl;
    } catch (error) {
      console.error(
        "Could not generate the TestTrack email:",
        error
      );

      window.alert(
        "The test email could not be generated.\n\n" +
        (
          error && error.message
            ? error.message
            : "Unknown error"
        )
      );
    } finally {
      setButtonBusy(
        emailButton,
        false
      );
    }
  }

  async function copyJSON(event) {
    if (event) {
      event.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    setButtonBusy(
      copyButton,
      true,
      "Copying…"
    );

    try {
      const data = await buildJSON();

      const json = JSON.stringify(
        data,
        null,
        2
      );

      await copyTextToClipboard(json);

      window.alert(
        "JSON copied\n\n" + testId
      );
    } catch (error) {
      console.error(
        "Could not copy the TestTrack JSON:",
        error
      );

      window.alert(
        "The JSON could not be copied.\n\n" +
        (
          error && error.message
            ? error.message
            : "Unknown error"
        )
      );
    } finally {
      setButtonBusy(
        copyButton,
        false
      );
    }
  }

  async function copyTextToClipboard(text) {
    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const temporaryTextArea =
      document.createElement("textarea");

    temporaryTextArea.value = text;
    temporaryTextArea.setAttribute(
      "readonly",
      ""
    );

    temporaryTextArea.style.position = "fixed";
    temporaryTextArea.style.opacity = "0";
    temporaryTextArea.style.pointerEvents =
      "none";

    document.body.appendChild(
      temporaryTextArea
    );

    temporaryTextArea.select();
    temporaryTextArea.setSelectionRange(
      0,
      temporaryTextArea.value.length
    );

    const copied =
      document.execCommand("copy");

    document.body.removeChild(
      temporaryTextArea
    );

    if (!copied) {
      throw new Error(
        "The browser refused clipboard access."
      );
    }
  }

  function setButtonBusy(
    button,
    isBusy,
    busyLabel
  ) {
    if (!button) {
      return;
    }

    if (isBusy) {
      button.dataset.originalLabel =
        button.textContent;

      button.disabled = true;

      if (busyLabel) {
        button.textContent = busyLabel;
      }

      return;
    }

    button.disabled = false;

    if (button.dataset.originalLabel) {
      button.textContent =
        button.dataset.originalLabel;

      delete button.dataset.originalLabel;
    }
  }

  function resetForm(event) {
    if (event) {
      event.preventDefault();
    }

    if (scenario) {
      scenario.value = "";
    }

    if (description) {
      description.value = "";
    }

    if (networkManual) {
      networkManual.value = "";
    }

    if (accountNumber) {
      accountNumber.value = "";
    }

    if (accountUrl) {
      accountUrl.value = "";
      accountUrl.setCustomValidity("");
    }

    if (failureType) {
      failureType.value = "";
    }

    result.value = "PASS";

    testId = ttGenerateTestId();
    window.TestTrackTestId = testId;

    document.dispatchEvent(
      new CustomEvent(
        "testtrack:reset",
        {
          detail: {
            testId: testId
          }
        }
      )
    );

    locationData =
      createEmptyLocationData();

    toggleFailure();
    refreshLocation();
  }

  function escapeHTML(value) {
    return String(
      value === null ||
      value === undefined
        ? ""
        : value
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
