try {
  chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
     //console.log(sender.tab ? "from a content script: " + sender.tab.id+", "+sender.tab.url : "from the extension" );
     if (request.harvestedTriples) {
         chrome.pageAction.show(sender.tab.id);
         sendResponse({});
     } else if (request.method == "getOptions") {
        var injectionValue = localStorage["injection.enabled"];
        if (injectionValue===undefined) {
           localStorage["injection.enabled"] = "true";
           injectionValue = "true";
        }
        sendResponse({microdataEnabled: localStorage["microdata.enabled"]=="true", injectionEnabled: injectionValue=="true"});
     } else {
        sendResponse({}); // snub them.
     }
  });
  chrome.pageAction.onClicked.addListener(function(tab) {
     var url = chrome.extension.getURL("viewer.xhtml");
     chrome.tabs.create({"url": url, "selected": true},
        function(viewerTab) {
           chrome.tabs.sendRequest(viewerTab.id, { viewerInit: true, url: tab.url, id: tab.id});
        }
     );
  });
} catch (ex) {
   console.log("Error setting up rdfa extension: "+ex);
}
