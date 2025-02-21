/* On extension load, add listeners for user key commands: Alt+K, Alt+L & send appropriate message to active tab */
chrome.commands.onCommand.addListener(function (command) {
  if (command === "reverse_status") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { message: "reverse_status" });
    });
  }
  if (command === "toggle_selected") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { message: "toggle_selected" });
    });
  }
});
