MicrodataProcessor.prototype = new URIResolver();
MicrodataProcessor.prototype.constructor=MicrodataProcessor;
function MicrodataProcessor() {
   this.blankCounter = 0;
   this.vocabularies = [ 
      { namespaceURI: "http://schema.org/",
        isMember: function(uri) {
           return uri.indexOf(this.namespaceURI)==0;
        },
        getProperty: function(name) {
           return this.namespaceURI+name;
        }
      }
   ];
}
MicrodataProcessor.absoluteURIRE = /[\w\_\-]+:\S+/;

MicrodataProcessor.prototype.newBlankNode = function() {
   this.blankCounter++;
   return "_:"+this.blankCounter;
}

MicrodataProcessor.prototype.createBaseURI = function(baseURI) {
   var hash = baseURI.indexOf("#");
   if (hash>=0) {
      baseURI = baseURI.substring(0,hash);
   }
   return this.parseURI(baseURI);
}

MicrodataProcessor.trim = function(str) {
   return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

MicrodataProcessor.tokenize = function(str) {
   return MicrodataProcessor.trim(str).split(/\s+/);
}


MicrodataProcessor.prototype.getVocabulary = function(uri) {
   for (var i=0; i<this.vocabularies.length; i++) {
      if (this.vocabularies[i].isMember(uri)) {
         return this.vocabularies[i];
      }
   }
   var makeVocab = function(ns) {
      return {
         namespaceURI: ns,
         getProperty: function(name) {
            return this.namespaceURI+name;
         }
      };      
   };
   var hash = uri.indexOf("#")
   if (hash>=0) {
      return makeVocab(uri.substring(0,hash+1));
   }
   var lastSlash = uri.lastIndexOf("/");
   if (lastSlash>=0) {
      return makeVocab(uri.substring(0,lastSlash+1));
   }
   return makeVocab(uri);
}

MicrodataProcessor.prototype.getProperty = function(value,vocabulary) {
   if (MicrodataProcessor.absoluteURIRE.exec(value)) {
      return value;
   }
   return vocabulary ? vocabulary.getProperty(value) : null;
}

MicrodataProcessor.valueMappings = {
   "meta" : function(node,base) { return node.getAttribute("content"); },
   "audio" : function(node,base) { return base.resolve(node.getAttribute("src")); },
   "a" : function(node,base) { return base.resolve(node.getAttribute("href")); },
   "object" : function(node,base) { return base.resolve(node.getAttribute("data")); },
   "time" : function(node,base) { var datetime = node.getAttribute("datetime"); return datetime ? datetime : node.textContent; }
};
MicrodataProcessor.valueMappings["embed"] = MicrodataProcessor.valueMappings["audio"];
MicrodataProcessor.valueMappings["iframe"] = MicrodataProcessor.valueMappings["audio"];
MicrodataProcessor.valueMappings["img"] = MicrodataProcessor.valueMappings["audio"];
MicrodataProcessor.valueMappings["source"] = MicrodataProcessor.valueMappings["audio"];
MicrodataProcessor.valueMappings["track"] = MicrodataProcessor.valueMappings["audio"];
MicrodataProcessor.valueMappings["video"] = MicrodataProcessor.valueMappings["audio"];
MicrodataProcessor.valueMappings["area"] = MicrodataProcessor.valueMappings["a"];
MicrodataProcessor.valueMappings["link"] = MicrodataProcessor.valueMappings["a"];
MicrodataProcessor.prototype.getValue = function(node,base) {
   var converter = MicrodataProcessor.valueMappings[node.localName];
   return converter ? converter(node,base) : node.textContent;
}

MicrodataProcessor.objectURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
MicrodataProcessor.PlainLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
MicrodataProcessor.typeURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

MicrodataProcessor.prototype.process = function(node) {
   if (node.nodeType==Node.DOCUMENT_NODE) {
      node = node.documentElement;
   }
   var queue = [];
   queue.push({ current: node, context: this.push(null,null) });
   while (queue.length>0) {
      var item = queue.shift();
      var current = item.current;
      var context = item.context;
      var base = this.createBaseURI(current.baseURI);
      var subject = null;
      var vocabulary = context.vocabulary;
      var itemScope = current.hasAttribute("itemscope");
      if (itemScope) {
         //console.log("Item at "+current.tagName+", parent.subject="+context.subject);
         var itemType = current.getAttribute("itemtype");
         var itemId = current.getAttribute("itemid");
         if (itemType) {
            vocabulary = this.getVocabulary(itemType);
            subject = itemId ? itemId : this.newBlankNode();
            this.newSubjectOrigin(current,subject);
            this.addTriple(current,subject,MicrodataProcessor.typeURI, {type: MicrodataProcessor.objectURI, value: itemType});
         }
      }
      var itemProp = current.getAttribute("itemprop");
      if (itemProp) {
         //console.log("Property "+itemProp+" at "+current.tagName+", parent.subject="+context.subject);
         var tokens = MicrodataProcessor.tokenize(itemProp);
         if (itemScope) {
            // Only make a triple if there is both a parent subject and new subject
            if (context.parent.subject && subject) {
               // make a triple with the new subject as the object
               this.addTriple(current, context.subject, prop, { type: MicrodataProcessor.objectURI, value: subject});
            }
         } else if (vocabulary) {
            if (!subject) {
               subject = context.subject;
            }
            if (subject) {
               var value = this.getValue(current,base);
               // make a triple with the new subject and predicate
               for (var i=0; i<tokens.length; i++) {
                  var prop = tokens[i].length>0 ? this.getProperty(tokens[i],vocabulary) : null;
                  if (!prop) {
                     continue;
                  }
                  this.addTriple(current, subject, prop, { type: MicrodataProcessor.PlainLiteralURI, value: value});
               }
            }
         }
      }
      for (var child = current.lastChild; child; child = child.previousSibling) {
         if (child.nodeType==Node.ELEMENT_NODE) {
            queue.unshift({ current: child, context: this.push(context,subject,vocabulary)});
         }
      }
   }
}

MicrodataProcessor.prototype.push = function(parent,subject,vocabulary) {
   return {
      parent: parent,
      subject: subject ? subject : (parent ? parent.subject : null),
      vocabulary: vocabulary ? vocabulary : (parent ? parent.vocabulary : null)
   };
}


MicrodataProcessor.prototype.newSubjectOrigin = function(origin,subject) {}

MicrodataProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
}

GraphMicrodataProcessor.prototype = new MicrodataProcessor();
GraphMicrodataProcessor.prototype.constructor=MicrodataProcessor;
function GraphMicrodataProcessor(targetGraph) {
   MicrodataProcessor.call(this);
   this.graph = targetGraph;
}

GraphMicrodataProcessor.prototype.newBlankNode = function() {
   return this.graph.newBlankNode();
}
GraphMicrodataProcessor.prototype.newSubjectOrigin = function(origin,subject) {
   var snode = this.graph.subjects[subject];
   if (!snode) {
      snode = new RDFaSubject(this.graph,subject);
      this.graph.subjects[subject] = snode;
   }
   if (!origin.data) {
      Object.defineProperty(origin,"data", {
            value: snode,
            writable: false,
            configurable: true,
            enumerable: true
         });
   }
}

GraphMicrodataProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
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
   if (predicate==MicrodataProcessor.typeURI) {
      snode.types.push(object.value);
   }
   
}



