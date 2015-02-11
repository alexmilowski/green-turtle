var implementation = {

   attach: function(document,options) {
      var hasFeature = document.implementation.hasFeature;
      document.implementation.hasFeature = function(feature,version) {
         if (feature=="RDFaAPI" && version=="1.1") { return true; }
         return hasFeature.apply(this,arguments);
      }
      
      var loaded = document.data ? true : false;
      if (!document.data) {
         DocumentData.attach(document,options);
         var makeEvent = function(msg) {
            if (!msg.id) {
               msg.id = "R"+Date.now();
            }
            var event = new CustomEvent("green-turtle-response", {"detail": msg });
            return event;
         };
         window.addEventListener("green-turtle-request",function(event) {
            if (event.detail.type=="status") {
               var response = { "type": "status", version: GreenTurtle.version, "loaded": loaded, count: document.data.graph.tripleCount, id: event.detail.id};
               window.dispatchEvent(makeEvent(response));
            } else if (event.detail.type=="get-subjects") {
               var subjects = document.data.getSubjects();
               var response = { "type": "subjects", "subjects": subjects, id: event.detail.id };
               window.dispatchEvent(makeEvent(response));
            } else if (event.detail.type=="get-subject") {
               var triples = null;
               var subject = event.detail.subject;
               if (document.data.getSubject) {
                  // Use the Green Turtle triples extension
                  var subjectNode = document.data.getSubject(subject);
                  triples = subjectNode ? subjectNode.toObject() : null;
               } else {
                  // Do it the hard way!
                  triples = { subject: subject, predicates: {} };
                  var projection = document.data.getProjection(subject);
                  var properties = projection.getProperties();
                  for (var i=0; i<properties.length; i++) {
                     var objects = [];
                     triples.predicates[properties[i]] = { predicate: predicate, objects: objects };
                     var values = projection.getAll(properties[i]);
                     for (var j=0; j<values.length; j++) {
                        if (subjects[values[j]]) {
                           objects.push({type: "http://www.w3.org/1999/02/22-rdf-syntax-ns#object",value: values[j]});
                        } else {
                           objects.push({ type:  "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral", value: values[j]});
                        }
                     }
                  }
               }
               var response = { type: "subject", subject: subject, triples: triples, id: event.detail.id };
               window.dispatchEvent(makeEvent(response));
            } else {
               console.log("Unrecognized message: "+JSON.stringify(event.detail));
            }
         },false);
      } else if (document.data._data_) {
         document.data._data_.graph.clear();
      }
      
      var processDoc = function() {
         var processor = new GraphRDFaProcessor(document.data._data_);
         // Note: This handler MUST execute before the rdfa.loaded event is sent
         processor.finishedHandlers.push(function(node) {
            for (var mediaType in implementation.processors) {
               var processor = implementation.processors[mediaType];
               processor.process(document,options);
            }
         });
         processor.finishedHandlers.push(function(node) {
            if (node.ownerDocument) {
               var event = node.ownerDocument.createEvent("HTMLEvents");
               event.initEvent("rdfa.loaded",true,true);
               node.ownerDocument.dispatchEvent(event);
            }
         });
         processor.process(document.documentElement,options);
         loaded = true;
         
      }
      
      if (document.readyState=="loading") {
         window.addEventListener("load",function() {
            processDoc();
         },false);
      } else {
         processDoc();
      }
      
   },

   parse: function(text,mediaType,options) {
      var parserFactory = this.processors[mediaType];
      if (!parserFactory) {
         throw "Unsupported media type "+mediaType;
      }
      var parser = parserFactory.createParser();
      if (options && options.errorHandler) {
         parser.onError = options.errorHandler;
      }
      var base = options ? options.baseURI : null;
      parser.parse(text,base);
      if (parser.errorCount>0) {
         throw base ? "Errors during parsing "+base+" of type "+mediaType : "Errors during parsing of type "+mediaType;
      }
      return parser.context;
   },
   
   createDocumentData: function(baseURI) {
      return new DocumentData(baseURI ? baseURI : window ? window.location.href : "about:blank");
   }
   
};

Object.defineProperty(implementation,"processors", {
   value: {},
   writable: false,
   configurable: false,
   enumerable: true
});

implementation.processors["application/ld+json"] = {
   createParser: function() {
      return {
         context: new RDFaGraph(),
         parse: function(data,options) {
            var processor = new GraphJSONLDProcessor(this.context);
            processor.process(data,options);
         },
         errorCount: 0
      }
   },
   process: function(node,options) {
      if (!this.enabled) {
         return;
      }
      var owner = node.nodeType==Node.DOCUMENT_NODE ? node : node.ownerDocument;
      if (!owner.data) {
         return;
      }
      var success = true;
      var scripts = owner.getElementsByTagNameNS("http://www.w3.org/1999/xhtml","script");
      for (var i=0; i<scripts.length; i++) {
         var type = scripts[i].getAttribute("type")
         if (type!="application/ld+json" && type!="text/json-ld") {
            continue;
         }
         if (scripts[i].src) {
            this.requestRemote(scripts[i].src,owner.data,options);
         } else {
            var parser = this.createParser();
            if (options && options.errorHandler) {
               parser.onError = options.errorHandler;
            }
            parser.parse(scripts[i].textContent,this.copyOptions(options,scripts[i].baseURI));
            if (parser.errorCount>0) {
               success = false;
            } else {
               owner.data.merge(parser.context.subjects,{ prefixes: parser.context.prefixes});
            }
         }
      }
      return success;
   },
   copyOptions: function(options,baseURI) {
      var newOptions = {};
      for (key in options) {
         newOptions[key] = options[key];
      }
      if (baseURI) {
         newOptions.baseURI = baseURI;
      }
      return newOptions;
   },
   requestRemote: function(uri,docdata,options) {
      var impl = this;
      var request = new XMLHttpRequest();
      request.onreadystatechange = function() {
         if (request.readyState === 4) {
            var parser = impl.createParser();
            if (options && options.errorHandler) {
               parser.onError = options.errorHandler;
            }
            parser.parse(request.responseText,impl.copyOptions(options,uri));
            if (parser.errorCount==0) {
               docdata.merge(parser.context.subjects,{ prefixes: parser.context.prefixes});
            }
         }
      }
      request.open("GET",uri,true);
      request.send();
   },
   enabled: true
};

implementation.processors["text/turtle"] = {
   createParser: function() {
      return new TurtleParser();
   },
   process: function(node,options) {
      if (!this.enabled) {
         return;
      }
      var owner = node.nodeType==Node.DOCUMENT_NODE ? node : node.ownerDocument;
      if (!owner.data) {
         return;
      }
      var success = true;
      var scripts = owner.getElementsByTagNameNS("http://www.w3.org/1999/xhtml","script");
      for (var i=0; i<scripts.length; i++) {
         if (scripts[i].getAttribute("type")!="text/turtle") {
            continue;
         }
         var parser = this.createParser();
         if (options && options.errorHandler) {
            parser.onError = options.errorHandler;
         }
         var base = options ? options.baseURI : null;
         parser.parse(scripts[i].textContent,base);
         if (parser.errorCount>0) {
            success = false;
         } else {
            owner.data.merge(parser.context.subjects,{ prefixes: parser.context.prefixes});
         }
      }
      return success;
   },
   enabled: true
};


implementation.processors["microdata"] = {
   process: function(node,options) {
      if (!this.enabled) {
         return;
      }
      var owner = node.nodeType==Node.DOCUMENT_NODE ? node : node.ownerDocument;
      if (!owner.data) {
         return false;
      }
      var processor = new GraphMicrodataProcessor(owner.data.graph);
      processor.process(node);
      return true;
   },
   enabled: false
};

Object.defineProperty(env,"implementation", {
   value: implementation,
   writable: false,
   configurable: false,
   enumerable: true
});

env.attach = function(document,options) {
   implementation.attach(document,options);
};

return env;

})();


}



