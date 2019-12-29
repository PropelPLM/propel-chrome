chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

	if(changeInfo.url.startsWith("https://docs.google.com")){
		chrome.pageAction.show(tabId);
	}

});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab){

    if(tab.url.startsWith("https://docs.google.com/document/d") || tab.url.startsWith("https://docs.google.com/spreadsheet/d") || tab.url.startsWith("https://docs.google.com/presentation/d")){
			chrome.pageAction.show(activeInfo.tabId);
		}

  });
}); 
