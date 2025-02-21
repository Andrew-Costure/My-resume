const ELEMS_TO_BLUR = [
  "img",
  "video",
  "iframe",
  'div[style*="url"]',
  'span[style*="url"]',
  'a[style*="url"]',
  'i[style*="url"]',
];

const BLUR_ENABLED_FLAG = "enabled";
const BLUR_LEVEL_FLAG = "blurLevel";
const ALLOW_LIST_FLAG = "allowList";

const TOGGLE_EXTENSION_FLAG = "reverse_status";
const TOGGLE_SELECTED_FLAG = "toggle_selected";

let BLUR_LEVEL_PX = "50";
let enabled = false;

let allowList = [];

const removeExistingFhazingCSS = () => {
  const css = document.getElementById("fhazer");
  if (css) {
    css.parentNode.removeChild(css);
  }
};

const getAllowList = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(ALLOW_LIST_FLAG, (data) => {
      allowList = data.allowList || [];
      resolve();
    });
  });
};

const getExtensionEnabled = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get([BLUR_ENABLED_FLAG], (data) => {
      if (data.enabled === true) {
        enabled = true;
        resolve();
      }
    });
  });
};

const setExtensionEnabled = (enabled) => {
  chrome.storage.local.set({ [BLUR_ENABLED_FLAG]: enabled });
};

const isCurrentDomainAllowed = () => {
  const currentDomain = window.location.host;
  return allowList.indexOf(currentDomain) >= 0;
};

const injectBlurCSS = (blurLevel) => {
  removeExistingFhazingCSS();
  let style = document.createElement("style");
  style.rel = "stylesheet";
  style.id = "fhazer";
  style.fhazed = true;
  style.innerHTML =
    ELEMS_TO_BLUR.join(",") + "{ filter: blur(" + blurLevel + "px) !important}";
  document.documentElement.prepend(style);
};

chrome.storage.local.get(ALLOW_LIST_FLAG, (data) => {
  allowList = data.allowList || [];
});

const updateCSS = () => {
  getAllowList().then(() => {
    if (enabled) {
      if (!isCurrentDomainAllowed()) {
        injectBlurCSS(BLUR_LEVEL_PX);
      } else if (isCurrentDomainAllowed()) {
        removeExistingFhazingCSS();
      }
    } else {
      removeExistingFhazingCSS();
    }
  });
};

// set initial value for blur enabled
chrome.storage.local.get([BLUR_ENABLED_FLAG], (data) => {
  if (data.enabled === true) {
    enabled = true;
    updateCSS();
  }
});

// set initial value for blur level
chrome.storage.local.get([BLUR_LEVEL_FLAG], (data) => {
  BLUR_LEVEL_PX = data[BLUR_LEVEL_FLAG] || BLUR_LEVEL_PX;
  updateCSS();
});

// listen for updates to value for blur enabled
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let key in changes) {
    let storageChange = changes[key];
    if (key === BLUR_ENABLED_FLAG) {
      enabled = storageChange.newValue;
      updateCSS();
    }
  }
});

// listen for updates to value for blur level
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let key in changes) {
    let storageChange = changes[key];
    if (key === BLUR_LEVEL_FLAG && storageChange.newValue) {
      BLUR_LEVEL_PX = storageChange.newValue;
      updateCSS();
    }
  }
});

// listen for updates to value for allow list
chrome.storage.onChanged.addListener(function (changes) {
  for (let key in changes) {
    let storageChange = changes[key];
    if (key === ALLOW_LIST_FLAG && storageChange.newValue) {
      allowList = storageChange.newValue;

      if (!isCurrentDomainAllowed()) {
        injectBlurCSS(BLUR_LEVEL_PX);
      } else if (isCurrentDomainAllowed()) {
        removeExistingFhazingCSS();
      }
    }
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === TOGGLE_EXTENSION_FLAG) {
    setExtensionEnabled(!enabled);
  } else if (request.message === TOGGLE_SELECTED_FLAG) {
    toggleSelected();
  }
});

/* toggleSelected - (1) Determines objects over hover (2) reverses blur state of objects over hover  */
function toggleSelected() {
  const hover = document.querySelectorAll(":hover"); // Determine user hover
  let imgFoundCSS = false; // Track if image found

  /* Iterate through all elements under hover. Toggle if contains IMG, IFRAME, VIDEO or inline image. */
  hover.forEach(function (selected, iterator, array) {
    toggleIfImg(selected);
  });

  /* toggleIfImg sub-method - If any element is an (1) IMG, IFRAME, VIDEO or (2) has a in-line background-url --> toggle */
  function toggleIfImg(selected) {
    if (
      selected.nodeName === "IMG" ||
      selected.nodeName === "IFRAME" ||
      selected.nodeName === "VIDEO"
    ) {
      toggle(selected);
    } else if (selected.style) {
      if (selected.style.cssText.match(/url\(([^()]+)\)/)) {
        toggle(selected);
      }
    }
  }

  /* toggle sub-method - adds forced blur or unblur as appropriate */
  function toggle(selected) {
    /* If this is fist image found */
    if (imgFoundCSS === false) {
      let cssText = selected.style.cssText;

      /* If image is blurred by default --> apply forced unblur */
      if (enabled === true && selected.style.filter === "") {
        selected.style.cssText += ";filter: blur(0px) !important;";
      } else if (enabled === false && selected.style.filter === "") {
        /* If image is shown by default --> apply forced reblur */
        let blurAmt = "blur(" + BLUR_LEVEL_PX + "px) ";
        selected.style.cssText += ";filter: " + blurAmt + " !important;";
      } else if (
        /* If image has been force unblured, then force reblur */
        cssText.substr(cssText.length - 29) === "filter: blur(0px) !important;"
      ) {
        let blurAmt = "blur(" + BLUR_LEVEL_PX + "px) ";
        selected.style.cssText += ";filter: " + blurAmt + " !important;";
      } else {
        /* If image has been forced reblured, then force unblur */
        selected.style.cssText += ";filter: blur(0px) !important;";
      }

      imgFoundCSS = selected.style.cssText;
    } else {
      /* If previous image already found, set this image to same blur to prevent opposite-blur bug (where overlaying & underlying imgs in opposite blur states) */
      selected.style.cssText += ";" + imgFoundCSS.match(/(filter.*$)/)[0];
    }
  }
}
