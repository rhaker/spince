// receive message from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	// check if message is blacklist site
	if ( request.message === "blacklistSite" ) {  
	
		// change the icon to inactive
		chrome.browserAction.setIcon({path:"img/iconOff38.png"});
	
	// check if message is whitelist site
	} else if ( request.message === "whitelistSite" ) {  
	
		// change the icon to inactive
		chrome.browserAction.setIcon({path:"img/icon.png"});
		
	// check if message is ajax pText
	} else if ( request.message === "ajaxLink" ) {  
				
		// ajax the link to the active tab
		$.ajax({
			url: request.hrefLater,
			cache: false,
			dataType: 'text',
			success: function (response) {				
				
				// send back pText to content script for linkNo
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
					chrome.tabs.sendMessage(tabs[0].id, {"message": "pTextLink", "randNo": request.randNo, "linkNo": request.linkNo, "pText": response}, function(response) {});  
				});
				
			},
			error: function (xhr, ajaxOptions, thrownError){				
				
				// send back error message
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
					chrome.tabs.sendMessage(tabs[0].id, {"message": "pTextLinkError", "randNo": request.randNo, "linkNo": request.linkNo, "pText": "none"}, function(response) {})  					
				});
				
			}        
		});

	}

});
