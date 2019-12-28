"use strict";

chrome.runtime.onInstalled.addListener(function (details) {
  console.log('previousVersion', details.previousVersion);
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url.startsWith("https://docs.google.com")) {
    chrome.pageAction.show(tabId);
  }
});
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    if (tab.url.startsWith("https://docs.google.com")) {
      chrome.pageAction.show(activeInfo.tabId);
    }
  });
});