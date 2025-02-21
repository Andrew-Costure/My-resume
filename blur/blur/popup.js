const BLUR_ENABLED_FLAG = "enabled";
const BLUR_LEVEL_FLAG = "blurLevel";
const ALLOW_LIST_FLAG = "allowList";
const DEFAULT_BLUR = "50";
const MAX_BLUR = 100;

let allowList = [];
let currentDomain = "";

window.onload = () => {
  const enableButton = document.getElementById("enable");

  const blurLevelText = document.getElementById("blur-level-text");
  const blurLevelNumber = document.getElementById("blur-level");
  const blurSlider = document.getElementById("slider");
  const settings = document.getElementById("settings");
  const currentDomainLabel = document.getElementById("current-domain");
  const addToAllowList = document.getElementById("btn-whitelist-add");
  const removeFromAllowList = document.getElementById("btn-whitelist-remove");

  const copyrightNotice = document.getElementById("copyright");

  let enabled = false;

  addToAllowList.onclick = () => {
    getAllowList().then(() => {
      const currentDomainIsAllowListed = allowList.indexOf(currentDomain) >= 0;

      if (!currentDomainIsAllowListed) {
        allowList = allowList.concat(currentDomain);
      }

      setAllowList();
      updateAllowListButtons();
    });
  };

  removeFromAllowList.onclick = () => {
    console.log(`Removing ${currentDomain} from allow list`);
    const newIgnoredDomain = allowList.filter(
      (domain) => domain !== currentDomain
    );
    allowList = newIgnoredDomain;
    setAllowList();
    updateAllowListButtons();
  };

  blurSlider.oninput = () => {
    let selectedBlurLevel = blurSlider.value;
    blurLevelNumber.innerText = `${selectedBlurLevel}%`;
    chrome.storage.local.set({ [BLUR_LEVEL_FLAG]: selectedBlurLevel });
    updatePerformanceWarning(selectedBlurLevel);
  };

  enableButton.onclick = () => {
    chrome.storage.local.set({ [BLUR_ENABLED_FLAG]: !enabled });
    if (!enabled) {
      enableButton.style.opacity = 1;
    } else {
      enableButton.style.opacity = 0.5;
    }
    getAndSetExtensionEnabled();
    getAndSetBlurLevel();
  };

  const setCurrentDomain = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let url = new URL(tabs[0].url);
      currentDomain = url.hostname;
      currentDomainLabel.innerHTML = currentDomain;
    });
  };

  const getAllowList = () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(ALLOW_LIST_FLAG, (data) => {
        allowList = data.allowList || [];
        resolve();
      });
    });
  };

  const setAllowList = () => {
    chrome.storage.local.set({ [ALLOW_LIST_FLAG]: allowList });
  };

  const getAndSetExtensionEnabled = () => {
    chrome.storage.local.get(BLUR_ENABLED_FLAG, (data) => {
      if (!data.enabled) {
        enabled = false;
        enableButton.checked = false;
      } else {
        enabled = true;
        enableButton.checked = true;
      }
    });
  };

  const getAndSetBlurLevel = () => {
    chrome.storage.local.get(BLUR_LEVEL_FLAG, (data) => {
      if (!enabled) {
        settings.style.display = "none";
        return;
      }

      settings.style.display = "block";

      let blurLevel = data.blurLevel || DEFAULT_BLUR;

      blurSlider.value = blurLevel;
      blurSlider.style.display = "";
      blurLevelText.style.display = "";
      blurLevelNumber.innerText = `${blurLevel}%`;

      updatePerformanceWarning(blurLevel);
    });
  };

  const updatePerformanceWarning = (blurAmt) => {
    if (parseInt(blurAmt) >= MAX_BLUR / 2) {
      document.getElementById("performance-warning").style.opacity = "1";
    } else {
      document.getElementById("performance-warning").style.opacity = "0";
    }
  };

  const updateAllowListButtons = () => {
    if (allowList.includes(currentDomain)) {
      addToAllowList.style.display = "none";
      removeFromAllowList.style.display = "block";
    } else {
      addToAllowList.style.display = "block";
      removeFromAllowList.style.display = "none";
    }
  };

  const setCopyrightNotice = () => {
    const notice = `&#169; Fhazer System ${new Date().getFullYear()}`;
    copyrightNotice.innerHTML = notice;
  };

  getAndSetExtensionEnabled();
  getAndSetBlurLevel();
  setCurrentDomain();
  getAllowList().then(() => {
    updateAllowListButtons();
  });
  setCopyrightNotice();
};
