document.greenTurtleInvoked = false;

function getTransferSubject(subjects,subject) {
   var snode = subjects[subject];
   var tsnode = { subject: subject, predicates: {} };
   for (var predicate in snode.predicates) {
      var pnode = snode.predicates[predicate];
      var tpnode = { predicate: predicate, objects: [] };
      tsnode.predicates[predicate] = tpnode;
      for (var i=0; i<pnode.objects.length; i++) {
         var object = pnode.objects[i];
         if (object.type==RDFaProcessor.XMLLiteralURI || object.type==RDFaProcessor.HTMLLiteralURI) {
            var serializer = new XMLSerializer();
            var value = "";
            for (var x=0; x<object.value.length; x++) {
               if (object.value[x].nodeType==Node.ELEMENT_NODE) {
                  value += serializer.serializeToString(object.value[x]);
               } else if (object.value[x].nodeType==Node.TEXT_NODE) {
                  value += object.value[x].nodeValue;
               }
            } 
            tpnode.objects.push({ type: object.type, value: value});
         } else {
            tpnode.objects.push({ type: object.type, value: object.value});
         }
      }
   }
   return tsnode;
}

function log(msg) {
   console.log("Green Turtle: "+msg);
}

function detectGreenTurtle(waitPeriod,response) {
   var timer = setTimeout(function() {
      window.removeEventListener("green-turtle-response",handler,false);
      response(false);
   },waitPeriod);
   var makeRequest = function(msg,action) {
      msg.id = "R"+Date.now();
      responseQueue[msg.id] = action;
      return event;
   };
   
   var handler = function(event) {
      clearTimeout(timer);
      window.removeEventListener("green-turtle-response",handler,false);
      console.log("Green Turtle "+event.detail.version+" detected.");
      response(true);
   };
   window.addEventListener("green-turtle-response",handler,false);
   var event = new CustomEvent("green-turtle-request", {"detail": { type: "status"} });
   window.dispatchEvent(event);   
   

}

var responseQueue = {};

function setupDocumentTransfer() {
   var makeRequest = function(msg,action) {
      msg.id = "R"+Date.now();
      responseQueue[msg.id] = action;
      var event = new CustomEvent("green-turtle-request", {"detail": msg });
      return event;
   };
   
   window.addEventListener("green-turtle-response",function(event) {
      var action = responseQueue[event.detail.id];
      if (action) {
         delete responseQueue[event.detail.id];
         action(event);
      }
   },false);

   var checkEvent = makeRequest({ type: "status"},function(event) {
      if (event.detail.count) {
         chrome.extension.sendRequest({ harvestedTriples: true });
      }
      log("Found "+event.detail.count+" triples");
   });
   window.dispatchEvent(checkEvent);   
   var transferStatus = {};
   chrome.extension.onRequest.addListener(
      function(request,sender,sendResponse) {
         if (request.getSubjects) {
            var requestEvent = makeRequest({ type: "get-subjects"},function(event) {
               //console.log(event.detail);
               sendResponse({ setSubjects: true, subjects: event.detail.subjects});
            });
            window.dispatchEvent(requestEvent);
         } else if (request.getSubject) {
            log("Getting subject "+request.subject);
            var start = Date.now();
            var requestEvent = makeRequest({ type: "get-subject", subject: request.subject},function(event) {
               //console.log("response received, elapsed: "+(Date.now()-start));
               //console.log(event.detail.triples);
               sendResponse({ setSubject: true, subject: event.detail.triples});
            });
            window.dispatchEvent(requestEvent);
         }
      }
   );
}

function injectGreenTurtle() {
   chrome.extension.sendRequest({method: "getOptions"}, function(response) {
      if (!response.injectionEnabled) {
         manualTransfer();
         return;
      }
      var options = "window.GreenTurtleOptions = { microdataEnabled: "+response.microdataEnabled+" };"
      var optionsURL = "data:text/javascript;base64,"+btoa(options);
      log("Injecting Green Turtle RDFa ...");
      var optionsScript = document.createElement("script");
      optionsScript.setAttribute("type","text/javascript");
      optionsScript.setAttribute("src",optionsURL);
      document.head.appendChild(optionsScript);
      var scriptURL = chrome.extension.getURL("RDFa.js");
      var script = document.createElement("script");
      script.setAttribute("type","text/javascript");
      script.setAttribute("src",scriptURL);
      document.head.appendChild(script);
   });
}

function manualTransfer() {
   var rdfaProcessor = new GraphRDFaProcessor({ graph: new RDFaGraph()});
   chrome.extension.onRequest.addListener(
      function(request,sender,sendResponse) {
         if (request.getSubjects) {
            var subjects = [];
            for (var subject in rdfaProcessor.target.graph.subjects) {
               subjects.push(subject);
            }
            sendResponse({ setSubjects: true, subjects: subjects });
         } else if (request.getSubject) {
            sendResponse({ setSubject: true, subject: getTransferSubject(rdfaProcessor.target.graph.subjects,request.subject) });
         }
      });
   rdfaProcessor.process(document.documentElement);
   var count = rdfaProcessor.target.graph.tripleCount;
   if (count>0) {
      chrome.extension.sendRequest({ harvestedTriples: true });
      log("Found "+count+" triples.");
   } else {
      log("No triples found.");
   }
}

function findImplementation() {
   detectGreenTurtle(500,function(found){
      if (found) {
         if (!document.greenTurtleInvoked) {
            document.greenTurtleInvoked = true;
            setupDocumentTransfer();
         }
      } else {
         injectGreenTurtle();
      }
   });
}

var treeSource = document.getElementById("webkit-xml-viewer-source-xml");
if (!treeSource && document.head) {
   var loaded = function() {
      document.removeEventListener("rdfa.loaded",loaded,false);
      document.ignoreLoad = true;    
      detectGreenTurtle(100,function(found) {
         if (found || document.greenTurtleInvoked) {
            if (!document.greenTurtleInvoked) {
               document.greenTurtleInvoked = true;
               setupDocumentTransfer();
            }
         } else {
            manualTransfer();
         }
      });
   };
   document.addEventListener("rdfa.loaded",loaded,false);
   if (document.readyState=="complete") {
      findImplementation();
   } else {
      window.addEventListener("load",function() {
         if (!document.ignoreLoad) {
            findImplementation();
         }
      },false);
   }

} else {
   log("Non-HTML detected, running Green Turtle "+version.greenTurtle+" outside of document.");
   manualTransfer();
}
