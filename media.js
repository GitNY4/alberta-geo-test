/* TestTrack — media.js
   Handles: photo/video capture and upload to Cloudinary, linked to the
   testId that app.js generates. Add <script src="media.js"></script>
   to index.html AFTER app.js.
*/

(function () {
  "use strict";

  // ---- 1. CONFIGURE THESE TWO VALUES ----
  const CLOUDINARY_CLOUD_NAME = "z9gwe2hh";       // from Cloudinary dashboard
  const CLOUDINARY_UPLOAD_PRESET = "testtrack_unsigned"; // the unsigned preset you create
  // ----------------------------------------

  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const STORAGE_PREFIX = "ttmedia:";

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

    // app.js's DOMContentLoaded listener runs first (it's loaded first in
    // index.html), so window.TestTrackTestId is already set by this point.
    let testId = window.TestTrackTestId;

    const section = document.createElement("div");
    section.className = "help";
    section.innerHTML = `
      <b>Media (photo / video)</b>
      <div id="ttTestIdLabel" style="margin-top:4px;font-size:13px;opacity:.85;">Linked to ${testId}</div>
      <input type="file" id="ttMediaInput" accept="image/*,video/*" capture="environment" multiple style="margin-top:8px;">
      <div id="ttUploadStatus" style="margin-top:8px;font-size:13px;opacity:.85;"></div>
      <div id="ttThumbs" style="margin-top:8px;"></div>
    `;
    container.insertBefore(section, container.querySelector(".help"));

    const idLabel = section.querySelector("#ttTestIdLabel");
    const fileInput = section.querySelector("#ttMediaInput");
    const status = section.querySelector("#ttUploadStatus");
    const thumbs = section.querySelector("#ttThumbs");

    renderThumbs(thumbs, testId);

    // app.js dispatches this on Reset Test — keep the media panel in sync
    document.addEventListener("testtrack:reset", (e) => {
      testId = e.detail.testId;
      idLabel.textContent = `Linked to ${testId}`;
      status.textContent = "";
      renderThumbs(thumbs, testId);
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

    // Public API — app.js's buildJSON() calls this to attach media URLs.
    window.TestTrackMedia = {
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
