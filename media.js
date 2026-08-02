/* TestTrack — media.js
   Handles: Test ID generation, photo/video capture, and upload to Cloudinary.
   Drop this file in your repo root and add <script src="media.js"></script>
   to index.html, AFTER geo.js and app.js.
*/

(function () {
  "use strict";

  // ---- 1. CONFIGURE THESE TWO VALUES ----
  const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";   // from Cloudinary dashboard
  const CLOUDINARY_UPLOAD_PRESET = "testtrack_unsigned"; // the unsigned preset you create
  // ----------------------------------------

  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const STORAGE_PREFIX = "ttmedia:";

  function genTestId() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TT-${stamp}-${rand}`;
  }

  function loadMedia(testId) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + testId);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveMedia(testId, list) {
    localStorage.setItem(STORAGE_PREFIX + testId, JSON.stringify(list));
  }

  function renderThumbs(container, testId) {
    const items = loadMedia(testId);
    container.innerHTML = "";
    items.forEach((item) => {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "display:inline-block;margin:6px;position:relative;width:88px;";
      if (item.resource_type === "video") {
        wrap.innerHTML = `<video src="${item.url}" style="width:88px;height:88px;object-fit:cover;border-radius:8px;" muted></video>`;
      } else {
        wrap.innerHTML = `<img src="${item.url}" style="width:88px;height:88px;object-fit:cover;border-radius:8px;">`;
      }
      container.appendChild(wrap);
    });
  }

  function uploadFile(file, testId, onDone) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    form.append("folder", `testtrack/${testId}`);
    form.append("tags", testId);

    fetch(UPLOAD_URL, { method: "POST", body: form })
      .then((r) => r.json())
      .then((data) => {
        if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
        const list = loadMedia(testId);
        list.push({
          url: data.secure_url,
          resource_type: data.resource_type, // "image" or "video"
          uploadedAt: new Date().toISOString(),
        });
        saveMedia(testId, list);
        onDone(null, data);
      })
      .catch((err) => onDone(err));
  }

  function init() {
    const container = document.querySelector(".container");
    if (!container) return;

    let testId = localStorage.getItem("ttCurrentTestId") || genTestId();
    localStorage.setItem("ttCurrentTestId", testId);

    const section = document.createElement("div");
    section.className = "help";
    section.innerHTML = `
      <b>Test ID</b>
      <div style="display:flex;gap:8px;margin-top:6px;">
        <input id="ttTestId" readonly style="flex:1;" value="${testId}">
        <button type="button" id="ttNewId" class="secondary" style="width:auto;padding:12px 16px;">New</button>
      </div>
      <br>
      <b>Media (photo / video)</b>
      <input type="file" id="ttMediaInput" accept="image/*,video/*" capture="environment" multiple style="margin-top:8px;">
      <div id="ttUploadStatus" style="margin-top:8px;font-size:13px;opacity:.85;"></div>
      <div id="ttThumbs" style="margin-top:8px;"></div>
    `;
    container.insertBefore(section, container.querySelector(".help"));

    const idInput = section.querySelector("#ttTestId");
    const newBtn = section.querySelector("#ttNewId");
    const fileInput = section.querySelector("#ttMediaInput");
    const status = section.querySelector("#ttUploadStatus");
    const thumbs = section.querySelector("#ttThumbs");

    renderThumbs(thumbs, testId);

    newBtn.addEventListener("click", () => {
      testId = genTestId();
      localStorage.setItem("ttCurrentTestId", testId);
      idInput.value = testId;
      renderThumbs(thumbs, testId);
      status.textContent = "";
    });

    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;
      status.textContent = `Uploading ${files.length} file(s)...`;
      let done = 0;
      let failed = 0;
      files.forEach((file) => {
        uploadFile(file, testId, (err) => {
          done++;
          if (err) {
            failed++;
            console.error("Upload error:", err);
          }
          if (done === files.length) {
            status.textContent = failed
              ? `Done with ${failed} error(s). Check console.`
              : `Uploaded ${files.length} file(s).`;
            renderThumbs(thumbs, testId);
          }
        });
      });
      fileInput.value = "";
    });

    // Public API — call this from app.js when building your Copy JSON payload:
    //   const media = window.TestTrackMedia.getUrls();
    window.TestTrackMedia = {
      get testId() {
        return testId;
      },
      getUrls() {
        return loadMedia(testId).map((m) => m.url);
      },
      getMediaObjects() {
        return loadMedia(testId);
      },
    };
  }

  document.addEventListener("DOMContentLoaded", init);
})();
