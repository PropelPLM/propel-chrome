"use strict";

let loginCard = document.getElementById('loginCard');
let attachmentCard = document.getElementById('attachmentCard');
let loginButton = document.getElementById('loginButton');
let clearCache = document.getElementById('clearCache');
let responseMessage = document.getElementById('responseMessage');
let itemNumber = document.getElementById('itemNumber');
let sendRequest = document.getElementById('sendRequest');
let itemAttached = document.getElementById('itemAttached');
let attachmentName = document.getElementById('attachmentName');
let attachmentDescription = document.getElementById('attachmentDescription');

var xhttp = new XMLHttpRequest();

var CALLBACK_URL = chrome.identity.getRedirectURL();

var AUTH_PARAMS = {
  response_type: 'code',
  client_id : '3MVG9nkapUnZB56GJOCGtc9vgBXQ6nneQqP0.sx2durVmMJOIFk6QVvJXpbzq.m9sikwpLqnWTpKRERlydP6I',
  client_secret : 'F3A306C2F6C038E25E285E7C8D68A873900DB7B7F8704154D64BF8BE855B0D93',
  redirect_uri : CALLBACK_URL
};
var AUTH_URL = 'https://login.salesforce.com/services/oauth2/authorize?prompt=login&response_type=' + AUTH_PARAMS.response_type +'&client_id=' + AUTH_PARAMS.client_id + '&redirect_uri=' + AUTH_PARAMS.redirect_uri;

$(".close").click(function(){
	$(".slds-theme_error, .slds-theme_success").fadeOut();
});

function getUrlVars(url) {
    var vars = {};
    var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function doStuffWithDom(domContent) {
    console.log('I received the following DOM content:\n' + domContent);
    let parser = new DOMParser();
		let doc = parser.parseFromString(domContent, "text/xml");

		var data = {};

		data["name"] = doc.querySelectorAll('[property="og:title"]')[0].textContent.replace(' - Google Docs','');
		data["description"] = doc.querySelectorAll('[property="og:description"]')[0].attributes[1].textContent;

		setDefaultValues(data);

}

function setDefaultValues(data) {

	$("#attachmentName").val(data.name);
	$("#attachmentDescription").val(data.description);

}

function clearValues() {

	$("#itemNumber").val("");

}

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {

	chrome.tabs.sendMessage(tabs[0].id, {text: 'report_back'}, doStuffWithDom);

});


/* If access token and refresh, hide login button */
chrome.storage.sync.get(['accessToken', 'refreshToken', 'instanceURL'], function(result){

  if(result.accessToken && result.refreshToken) {
    loginCard.style.display = "none";
  } else {
  	attachmentCard.style.display = "none";
  }
});

loginButton.onclick = function(element) {
  chrome.identity.launchWebAuthFlow({url: AUTH_URL, interactive: true}, function(responseUrl) { 

    var accessCode = getUrlVars(responseUrl)['code'];

    axios.post("https://login.salesforce.com/services/oauth2/token?grant_type=authorization_code&code=" + accessCode + "&client_id=" + AUTH_PARAMS.client_id + "&client_secret=" + AUTH_PARAMS.client_secret + "&redirect_uri=" + CALLBACK_URL)
	  .then(function (response) {

	  	console.log(response);
      // store access token and refresh token in chrome storage
      chrome.storage.sync.set({accessToken: response.data.access_token});
      chrome.storage.sync.set({refreshToken: response.data.refresh_token});
      chrome.storage.sync.set({instanceURL: response.data.instance_url});

      //sessionInfo.innerHTML = response.instance_url;

      loginCard.style.display = "none";
      attachmentCard.style.display = "block";

	  })
	  .catch(function (error) {
	    
	  });
  });
};

sendRequest.onclick = function(element) {
   $(".slds-spinner_container").show();

  if(!$("#itemNumber").val() || !$("#attachmentName").val() || !$("#attachmentDescription").val()) {
  	$(".slds-spinner_container").hide();
    errorMessage.innerHTML = "Please fill out all required fields.";
    $(".slds-theme_error").fadeIn();
    return;
  }

  chrome.storage.sync.get(['accessToken', 'refreshToken', 'instanceURL'], function(result){
    var conn = new jsforce.Connection({
      instanceUrl : result.instanceURL,
      accessToken : result.accessToken,
      refreshToken: result.refreshToken,
      oauth2 : {
        clientId : AUTH_PARAMS.client_id,
        clientSecret : AUTH_PARAMS.client_secret,
        redirectUri : AUTH_PARAMS.redirect_uri
      }
    });
    conn.oauth2.refreshToken(result.refreshToken, (err, results) => {
      if (err) return err;

      chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {

        var d = new Date();
        var data = {
		    	"itemName": itemNumber.value,
          "objectName": "Item__c",
          "link": tabs[0].url,
          "docName": attachmentName.value,
          "description": attachmentDescription.value
		    };

				axios.post(result.instanceURL + "/services/apexrest/plmjay/api/v2/attachment", data, {
				  headers: {
				    "Authorization": "Bearer " + results.access_token,
				   }
				})
			  .then(function (response) {
			  		console.log(response);
	          responseMessage.innerHTML = "Successfully associated GDrive file with Revision " + response.data.plmjay__Item_Revision__r.Name + ".";
	         	$(".slds-theme_success").fadeIn();
	         	clearValues();
	      })
			  .catch(function () {
	          errorMessage.innerHTML = "Couldn't associate GDrive file to Item. Make sure the Item exists in Propel and try again.";
	          $(".slds-theme_error").fadeIn();
			  })
			  .finally(function () {
			    	$(".slds-spinner_container").delay(2000).hide();
			  });  

      });

    
    });
  });
};