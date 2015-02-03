JSONLDProcessor.prototype = new URIResolver();
JSONLDProcessor.prototype.constructor=JSONLDProcessor;
function JSONLDProcessor() {
   this.blankCounter = 0;
}
JSONLDProcessor.absoluteURIRE = /[\w\_\-]+:\S+/;

JSONLDProcessor.prototype.newBlankNode = function() {
   this.blankCounter++;
   return "_:"+this.blankCounter;
}

JSONLDProcessor.trim = function(str) {
   return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

JSONLDProcessor.builtinContexts = {
   "http://schema.org/" : {
        "@vocab": "http://schema.org/",
        "acceptsReservations": { "@type": "@id" },
        "additionalType": { "@type": "@id" },
        "applicationCategory": { "@type": "@id" },
        "applicationSubCategory": { "@type": "@id" },
        "arrivalTime": { "@type": "DateTime" },
        "availabilityEnds": { "@type": "DateTime" },
        "availabilityStarts": { "@type": "DateTime" },
        "availableFrom": { "@type": "DateTime" },
        "availableThrough": { "@type": "DateTime" },
        "birthDate": { "@type": "Date" },
        "bookingTime": { "@type": "DateTime" },
        "checkinTime": { "@type": "DateTime" },
        "checkoutTime": { "@type": "DateTime" },
        "codeRepository": { "@type": "@id" },
        "commentTime": { "@type": "Date" },
        "contentUrl": { "@type": "@id" },
        "dateCreated": { "@type": "Date" },
        "dateIssued": { "@type": "DateTime" },
        "dateModified": { "@type": "Date" },
        "datePosted": { "@type": "Date" },
        "datePublished": { "@type": "Date" },
        "deathDate": { "@type": "Date" },
        "departureTime": { "@type": "DateTime" },
        "discussionUrl": { "@type": "@id" },
        "dissolutionDate": { "@type": "Date" },
        "doorTime": { "@type": "DateTime" },
        "downloadUrl": { "@type": "@id" },
        "dropoffTime": { "@type": "DateTime" },
        "embedUrl": { "@type": "@id" },
        "endDate": { "@type": "Date" },
        "endTime": { "@type": "DateTime" },
        "expectedArrivalFrom": { "@type": "DateTime" },
        "expectedArrivalUntil": { "@type": "DateTime" },
        "expires": { "@type": "Date" },
        "featureList": { "@type": "@id" },
        "foundingDate": { "@type": "Date" },
        "gameLocation": { "@type": "@id" },
        "gamePlatform": { "@type": "@id" },
        "guidelineDate": { "@type": "Date" },
        "hasMap": { "@type": "@id" },
        "image": { "@type": "@id" },
        "installUrl": { "@type": "@id" },
        "isBasedOnUrl": { "@type": "@id" },
        "labelDetails": { "@type": "@id" },
        "lastReviewed": { "@type": "Date" },
        "license": { "@type": "@id" },
        "logo": { "@type": "@id" },
        "map": { "@type": "@id" },
        "maps": { "@type": "@id" },
        "memoryRequirements": { "@type": "@id" },
        "menu": { "@type": "@id" },
        "modifiedTime": { "@type": "DateTime" },
        "namedPosition": { "@type": "@id" },
        "orderDate": { "@type": "DateTime" },
        "ownedFrom": { "@type": "DateTime" },
        "ownedThrough": { "@type": "DateTime" },
        "paymentDue": { "@type": "DateTime" },
        "paymentUrl": { "@type": "@id" },
        "pickupTime": { "@type": "DateTime" },
        "prescribingInfo": { "@type": "@id" },
        "previousStartDate": { "@type": "Date" },
        "priceValidUntil": { "@type": "Date" },
        "publishingPrinciples": { "@type": "@id" },
        "relatedLink": { "@type": "@id" },
        "releaseDate": { "@type": "Date" },
        "releaseNotes": { "@type": "@id" },
        "replyToUrl": { "@type": "@id" },
        "requirements": { "@type": "@id" },
        "roleName": { "@type": "@id" },
        "sameAs": { "@type": "@id" },
        "scheduledTime": { "@type": "DateTime" },
        "screenshot": { "@type": "@id" },
        "serviceUrl": { "@type": "@id" },
        "significantLink": { "@type": "@id" },
        "significantLinks": { "@type": "@id" },
        "sport": { "@type": "@id" },
        "startDate": { "@type": "Date" },
        "startTime": { "@type": "DateTime" },
        "storageRequirements": { "@type": "@id" },
        "targetUrl": { "@type": "@id" },
        "temporal": { "@type": "DateTime" },
        "thumbnailUrl": { "@type": "@id" },
        "ticketToken": { "@type": "@id" },
        "trackingUrl": { "@type": "@id" },
        "uploadDate": { "@type": "Date" },
        "url": { "@type": "@id" },
        "validFrom": { "@type": "DateTime" },
        "validThrough": { "@type": "DateTime" },
        "validUntil": { "@type": "Date" },
        "warning": { "@type": "@id" },
        "webCheckinTime": { "@type": "DateTime" }
    }

}

JSONLDProcessor.prototype.process = function(data,options) {
   if (typeof data === "string") {
      data = JSON.parse(data)
   }
   
   var queue = [];
   queue.push(
      { current: data, 
        context: options.context == null ? 
                    this.emptyContext() : 
                    (typeof options.context == "string" ? this.fetchContext(options.context) : this.copyContext(options.context))
      }
   );
   if (options.baseURI) {
      queue[0].context.baseURI = this.parseURI(options.baseURI)
   }
   if (options.vocabulary) {
      queue[0].context.vocabulary = vocabulary;
   }
   var origin = options.origin;
   var processor = this;
   while (queue.length>0) {
      var item = queue.shift();
      
      var context = item.context;
      var subject = null;
      for (var key in item.current) {
         if (key[0] == "@") {
            if (key == "@context") {
               var spec = item.current[key];
               if (typeof spec == "string") {
                  context = this.fetchContext(spec,context);
               } else {
                  context = this.makeContext(spec,context);
               }
            } else if (key == "@id") {
               subject = this.resolveURI(item.current[key],context);
            } else if (key == "@type") {
               var type = this.expand(item.current[key],context);
               if (subject==null) {
                  subject = this.newBlankNode();
               }
               this.addTriple(origin,subject,RDFaProcessor.typeURI,{type: RDFaProcessor.objectURI, value: type});
            }
         } else {
            if (subject==null) {
               subject = this.newBlankNode();
            }
            predicate = this.expand(key,context);
            var value = item.current[key];
            if (typeof value == "string") {
               this.addTriple(origin,subject,predicate,{type: RDFaProcessor.PlainLiteralURI, value: value});
            } else {
               queue.push({ 
                  current: value, 
                  context: context, 
                  update: (function(subject,predicate) {
                     return function(objectSubject) {
                        processor.addTriple(origin,subject,predicate,{type: RDFaProcessor.objectURI, value: objectSubject});
                     }
                  })(subject,predicate)
               });
            }
         }
      }
      if (item.update) {
         item.update(subject);
      }
   }
}

JSONLDProcessor.prototype.expand = function(value,context) {
   value = JSONLDProcessor.trim(value);
   var uri = this.expandCompactURI(value,context);
   if (uri) {
      return uri;
   } else {
       var term = context.terms[value];
       if (term) {
          return term;
       }
       var lcvalue = value.toLowerCase();
       term = context.terms[lcvalue];
       if (term) {
          return term;
       }
       if (context.vocabulary && !JSONLDProcessor.absoluteURIRE.exec(value)) {
          return context.vocabulary+value
       }
   }
   return this.resolveURI(value,context);   
}

JSONLDProcessor.prototype.expandCompactURI = function(value,context) {
   var colon = value.indexOf(":");
   if (colon>=0) {
      var prefix = value.substring(0,colon);
      if (prefix=="_") {
         // blank node
         return "_:"+value.substring(colon+1);
      } else if (RDFaProcessor.NCNAME.test(prefix)) {
         var uri = context.terms[prefix];
         if (uri) {
            return uri+value.substring(colon+1);
         }
      }
   }
   return null;
}


JSONLDProcessor.prototype.resolveURI = function(href,context) {
   while (context!=null && context.baseURI==null) {
      context = context.parent;
   }
   var parsed = null;
   if (context && context.baseURI) {
      var uri = context.baseURI.resolve(href);
      parsed = this.parseURI(uri);
   } else {
      parsed = this.parseURI(href);
   }
   parsed.normalize();
   return parsed.spec;
}

JSONLDProcessor.prototype.emptyContext = function() {
   var context = { parent: null, terms: {} };
   return context;   
}

JSONLDProcessor.prototype.fetchContext = function(uri,parentContext) {
   var spec = JSONLDProcessor.builtinContexts[uri];
   if (spec == null) {
      throw "Non-builtin context references are not supported: "+uri;
   }
   return this.makeContext(spec,parentContext);
}

JSONLDProcessor.prototype.copyContext = function(context) {
   var newContext = this.emptyContext();
   newContext.parent = context.parent;
   newContext.language = context.language;
   newContext.vocabulary = context.vocabulary;
   newContext.baseURI = context.baseURI;
   for (k in context.terms) {
      newContext.terms[k] = context.terms[k];
   }
   return newContext;
}

JSONLDProcessor.prototype.makeContext = function(spec,parentContext) {
   var context = this.emptyContext();
   if (!Array.isArray(spec)) {
      spec = [spec];
   }
   for (var i=0; i<spec.length; i++) {
      var keys = Object.keys(spec[i]);
      for (var k = 0; k<keys.length; k++) {
         var key = keys[k];
         if (key[0] == "@") {
            if (key == "@lanaguge") {
               context.language = spec[i]["@language"];
            } else if (key == "@vocab") {
               // TODO: support compact URI & terms
               context.vocabulary = parentContext.baseURI ? parentContext.baseURI.resolve(spec[i]["@vocab"]) : this.parseURI(spec[i]["@vocab"]);
            } else if (key == "@base") {
               var href = spec[i]["@base"];
               if (href !== null) {
                  context.baseURI = parentContext.baseURI ? parentContext.baseURI.resolve(href) : this.parseURI(href);
               }
            } else {
               console.log("Ignoring unrecognized context directive "+key);
            }
         } else {
            var obj = spec[i][key];
            if (typeof obj == "string") {
               // TODO: expand compact IRI
               context.terms[key] = obj
            } else {
               console.log("Object values are not supported at this time: "+key+" → "+JSON.stringify(obj));
            }
         }
      }
   }
   return context;
}

JSONLDProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
}

GraphJSONLDProcessor.prototype = new JSONLDProcessor();
GraphJSONLDProcessor.prototype.constructor=JSONLDProcessor;
function GraphJSONLDProcessor(targetGraph) {
   JSONLDProcessor.call(this);
   this.graph = targetGraph;
}

GraphJSONLDProcessor.prototype.newBlankNode = function() {
   return this.graph.newBlankNode();
}
GraphJSONLDProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
   var snode = this.graph.subjects[subject];
   if (!snode) {
      snode = new RDFaSubject(this.graph,subject);
      this.graph.subjects[subject] = snode;
   }
   var pnode = snode.predicates[predicate];
   if (!pnode) {
      pnode = new RDFaPredicate(predicate);
      snode.predicates[predicate] = pnode;
   }

   for (var i=0; i<pnode.objects.length; i++) {
      if (pnode.objects[i].type==object.type && pnode.objects[i].value==object.value) {
         if (pnode.objects[i].origin!==origin) {
            if (!Array.isArray(pnode.objects[i].origin)) {
               var origins = [];
               origins.push(pnode.objects[i].origin);
               pnode.objects[i].origin = origins;
            }
            pnode.objects[i].origin.push(origin);
         }
         return;
      }
   }
   pnode.objects.push(object);   
   object.origin = origin;
   if (predicate==RDFaProcessor.typeURI) {
      snode.types.push(object.value);
   }
   
}
