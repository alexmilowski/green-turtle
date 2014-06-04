function RDFaGraph()
{
   var dataContext = this;
   this.curieParser = {
      trim: function(str) {
         return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
      },
      parse: function(value,resolve) {
         value = this.trim(value);
         if (value.charAt(0)=='[' && value.charAt(value.length-1)==']') {
            value = value.substring(1,value.length-1);
         }
         var colon = value.indexOf(":");
         if (colon>=0) {
            var prefix = value.substring(0,colon);
            if (prefix=="") {
               // default prefix
               var uri = dataContext.prefixes[""];
               return uri ? uri+value.substring(colon+1) : null;
            } else if (prefix=="_") {
               // blank node
               return "_:"+value.substring(colon+1);
            } else if (DocumentData.NCNAME.test(prefix)) {
               var uri = dataContext.prefixes[prefix];
               if (uri) {
                  return uri+value.substring(colon+1);
               }
            }
         }

         return resolve ? dataContext.baseURI.resolve(value) : value;
      }
   };
   this.base =  null;
   this.toString = function(requestOptions) {
      var options = requestOptions && requestOptions.shorten ? { graph: this, shorten: true, prefixesUsed: {} } : null;
      if (requestOptions && requestOptions.blankNodePrefix) {
         options.filterBlankNode = function(id) {
            return "_:"+requestOptions.blankNodePrefix+id.substring(2);
         }
      }
      if (requestOptions && requestOptions.numericalBlankNodePrefix) {
         var onlyNumbers = /^[0-9]+$/;
         options.filterBlankNode = function(id) {
            var label = id.substring(2);
            return onlyNumbers.test(label) ? "_:"+requestOptions.numericalBlankNodePrefix+label : id;
         }
      }
      s = "";
      for (var subject in this.subjects) {
         var snode = this.subjects[subject];
         s += snode.toString(options);
         s += "\n";
      }
      var prolog = requestOptions && requestOptions.baseURI ? "@base <"+baseURI+"> .\n" : "";
      if (options && options.shorten) {
         for (var prefix in options.prefixesUsed) {
            prolog += "@prefix "+prefix+": <"+this.prefixes[prefix]+"> .\n";
         }
      }
      return prolog.length==0 ? s : prolog+"\n"+s;
   };
   this.blankNodeCounter = 0;
   this.clear = function() {
      this.subjects = {};
      this.prefixes = {};
      this.terms = {};
      this.blankNodeCounter = 0;
   }
   this.clear();
   this.prefixes[""] = "http://www.w3.org/1999/xhtml/vocab#";

   // w3c
   this.prefixes["grddl"] = "http://www.w3.org/2003/g/data-view#";
   this.prefixes["ma"] = "http://www.w3.org/ns/ma-ont#";
   this.prefixes["owl"] = "http://www.w3.org/2002/07/owl#";
   this.prefixes["rdf"] = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
   this.prefixes["rdfa"] = "http://www.w3.org/ns/rdfa#";
   this.prefixes["rdfs"] = "http://www.w3.org/2000/01/rdf-schema#";
   this.prefixes["rif"] = "http://www.w3.org/2007/rif#";
   this.prefixes["skos"] = "http://www.w3.org/2004/02/skos/core#";
   this.prefixes["skosxl"] = "http://www.w3.org/2008/05/skos-xl#";
   this.prefixes["wdr"] = "http://www.w3.org/2007/05/powder#";
   this.prefixes["void"] = "http://rdfs.org/ns/void#";
   this.prefixes["wdrs"] = "http://www.w3.org/2007/05/powder-s#";
   this.prefixes["xhv"] = "http://www.w3.org/1999/xhtml/vocab#";
   this.prefixes["xml"] = "http://www.w3.org/XML/1998/namespace";
   this.prefixes["xsd"] = "http://www.w3.org/2001/XMLSchema#";
   // non-rec w3c
   this.prefixes["sd"] = "http://www.w3.org/ns/sparql-service-description#";
   this.prefixes["org"] = "http://www.w3.org/ns/org#";
   this.prefixes["gldp"] = "http://www.w3.org/ns/people#";
   this.prefixes["cnt"] = "http://www.w3.org/2008/content#";
   this.prefixes["dcat"] = "http://www.w3.org/ns/dcat#";
   this.prefixes["earl"] = "http://www.w3.org/ns/earl#";
   this.prefixes["ht"] = "http://www.w3.org/2006/http#";
   this.prefixes["ptr"] = "http://www.w3.org/2009/pointers#";
   // widely used
   this.prefixes["cc"] = "http://creativecommons.org/ns#";
   this.prefixes["ctag"] = "http://commontag.org/ns#";
   this.prefixes["dc"] = "http://purl.org/dc/terms/";
   this.prefixes["dcterms"] = "http://purl.org/dc/terms/";
   this.prefixes["foaf"] = "http://xmlns.com/foaf/0.1/";
   this.prefixes["gr"] = "http://purl.org/goodrelations/v1#";
   this.prefixes["ical"] = "http://www.w3.org/2002/12/cal/icaltzd#";
   this.prefixes["og"] = "http://ogp.me/ns#";
   this.prefixes["rev"] = "http://purl.org/stuff/rev#";
   this.prefixes["sioc"] = "http://rdfs.org/sioc/ns#";
   this.prefixes["v"] = "http://rdf.data-vocabulary.org/#";
   this.prefixes["vcard"] = "http://www.w3.org/2006/vcard/ns#";
   this.prefixes["schema"] = "http://schema.org/";
   
   // terms
   this.terms["describedby"] = "http://www.w3.org/2007/05/powder-s#describedby";
   this.terms["license"] = "http://www.w3.org/1999/xhtml/vocab#license";
   this.terms["role"] = "http://www.w3.org/1999/xhtml/vocab#role";

   Object.defineProperty(this,"tripleCount",{
      enumerable: true,
      configurable: false,
      get: function() {
         var count = 0;
         for (var s in this.subjects) {
            var snode = this.subjects[s];
            for (var p in snode.predicates) {
               count += snode.predicates[p].objects.length;
            }
         }
         return count;
      }
   });
}

RDFaGraph.prototype.newBlankNode = function() {
   this.blankNodeCounter++;
   return "_:"+this.blankNodeCounter;
}

RDFaGraph.prototype.expand = function(curie) {
   return this.curieParser.parse(curie,true);  
}

RDFaGraph.prototype.shorten = function(uri,prefixesUsed) {
   for (prefix in this.prefixes) {
      var mapped = this.prefixes[prefix];
      if (uri.indexOf(mapped)==0) {
         if (prefixesUsed) {
            prefixesUsed[prefix] = mapped;
         }
         return prefix+":"+uri.substring(mapped.length);
      }
   }
   return null;
}

RDFaGraph.prototype.add = function(subject,predicate,object,options) {
   if (!subject || !predicate || !object) {
      return;
   }
   subject = this.expand(subject);
   predicate = this.expand(predicate);
   var snode = this.subjects[subject];
   if (!snode) {
      snode = new RDFaSubject(this,subject);
      this.subjects[subject] = snode;
   }
   if (options && options.origin) {
      snode.origins.push(options.origin);
   }
   if (predicate=="http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
      snode.types.push(object);
   }
   var pnode = snode.predicates[predicate];
   if (!pnode) {
      pnode = new RDFaPredicate(predicate);
      snode.predicates[predicate] = pnode;
   }
   
   if (typeof object == "string") {
      pnode.objects.push({
         type: RDFaProcessor.PlainLiteralURI,
         value: object
      });
   } else {
      pnode.objects.push({
         type: object.type ? this.expand(object.type) : RDFaProcessor.PlainLiteralURI,
         value: object.value ? object.value : "",
         origin: object.origin,
         language: object.language
      });
   }
   
}

RDFaGraph.prototype.addCollection = function(subject,predicate,objectList,options) {
   if (!subject || !predicate || !objectList) {
      return;
   }
   
   var lastSubject = subject;
   var lastPredicate = predicate;
   for (var i=0; i<objectList.length; i++) {
      var object = { type: options && options.type ? options.type : "rdf:PlainLiteral"};
      if (options && options.language) {
         object.language = options.language;
      }
      if (options && options.datatype) {
         object.datatype = options.datatype;
      }
      if (typeof objectList[i] == "object") {
         object.value = objectList[i].value ?  objectList[i].value : "";
         if (objectList[i].type) {
            object.type = objectList[i].type;
         }
         if (objectList[i].language) {
            object.language = objectList[i].language;
         }
         if (objectList[i].datatype) {
            object.datatype = objectList[i].datatype;
         }
      } else {
         object.value = objectList[i]
      }
      var bnode = this.newBlankNode();
      this.add(lastSubject,lastPredicate,{ type: "rdf:object", value: bnode});
      this.add(bnode,"rdf:first",object);
      lastSubject = bnode;
      lastPredicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";
   }
   this.add(lastSubject,lastPredicate,{ type: "rdf:object", value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"});
}

RDFaGraph.prototype.remove = function(subject,predicate) {
   if (!subject) {
      this.subjects = {};
      return;
   }
   subject = this.expand(subject);
   var snode = this.subjects[snode];
   if (!snode) {
      return;
   }
   if (!predicate) {
      delete this.subjects[subject];
      return;
   }
   predicate = this.expand(predicate);
   delete snode.predicates[predicate];
}

function RDFaSubject(graph,subject) {
   this.graph = graph;
   // TODO: subject or id?
   this.subject = subject
   this.id = subject;
   this.predicates =  {};
   this.origins = [];
   this.types = [];
}

RDFaSubject.prototype.toString = function(options) {
   var s = null;
   if (this.subject.substring(0,2)=="_:") {
      if (options && options.filterBlankNode) {
         s = options.filterBlankNode(this.subject);
      } else {
         s = this.subject;
      }
   } else if (options && options.shorten) {
      s = this.graph.shorten(this.subject,options.prefixesUsed);
      if (!s) {
         s = "<" + this.subject + ">";
      }
   } else {
      s = "<" + this.subject + ">";
   }
   var first = true;
   for (var predicate in this.predicates) {
      if (!first) {
         s += ";\n";
      } else {
         first = false;
      }
      s += " " + this.predicates[predicate].toString(options);
   }
   s += " .";
   return s;
}

RDFaSubject.prototype.toObject = function() {
   var o = { subject: this.subject, predicates: {} };
   for (var predicate in this.predicates) {
      var pnode = this.predicates[predicate];
      var p = { predicate: predicate, objects: [] };
      o.predicates[predicate] = p;
      for (var i=0; i<pnode.objects.length; i++) {
         var object = pnode.objects[i];
         if (object.type==RDFaProcessor.XMLLiteralURI) {
            var serializer = new XMLSerializer();
            var value = "";
            for (var x=0; x<object.value.length; x++) {
               if (object.value[x].nodeType==Node.ELEMENT_NODE) {
                  value += serializer.serializeToString(object.value[x]);
               } else if (object.value[x].nodeType==Node.TEXT_NODE) {
                  value += object.value[x].nodeValue;
               }
            } 
            p.objects.push({ type: object.type, value: value, language: object.language });
         } else if (object.type==RDFaProcessor.HTMLLiteralURI) {
            var value = object.value.length==0 ? "" : object.value[0].parentNode.innerHTML;
            p.objects.push({ type: object.type, value: value, language: object.language });
         } else {
            p.objects.push({ type: object.type, value: object.value, language: object.language });
         }
      }
   }
   return o;
   
}

RDFaSubject.prototype.getValues = function() {
   var values = [];
   for (var i=0; i<arguments.length; i++) {
      var property = this.graph.curieParser.parse(arguments[i],true)
      var pnode = this.predicates[property];
      if (pnode) {
         for (var j=0; j<pnode.objects.length; j++) {
            values.push(pnode.objects[j].value);
         }
      }
   }
   return values;
}

function RDFaPredicate(predicate) {
   this.id = predicate;
   this.predicate = predicate;
   this.objects = [];
}

RDFaPredicate.getPrefixMap = function(e) {
   var prefixMap = {};
   while (e.attributes) {
      for (var i=0; i<e.attributes.length; i++) {
         if (e.attributes[i].namespaceURI=="http://www.w3.org/2000/xmlns/") {
            var prefix = e.attributes[i].localName;
            if (e.attributes[i].localName=="xmlns") {
               prefix = "";
            }
            if (!(prefix in prefixMap)) {
               prefixMap[prefix] = e.attributes[i].nodeValue;
            }
         }
      }
      e = e.parentNode;
   }
   return prefixMap;
}

RDFaPredicate.prototype.toString = function(options) {
   var s = null;
   if (options && options.shorten && options.graph) {
      s = options.graph.shorten(this.predicate,options.prefixesUsed);
      if (!s) {
         s = "<" + this.predicate + ">"
      }
   } else {
      s = "<" + this.predicate + ">"
   }
   s += " ";
   for (var i=0; i<this.objects.length; i++) {
      if (i>0) {
         s += ", ";
      }
      if (this.objects[i].type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#object") {
         if (this.objects[i].value.substring(0,2)=="_:") {
            if (options && options.filterBlankNode) {
               s += options.filterBlankNode(this.objects[i].value);
            } else {
               s += this.objects[i].value;
            }
         } else if (options && options.shorten && options.graph) {
            u = options.graph.shorten(this.objects[i].value,options.prefixesUsed);
            if (u) {
               s += u;
            } else {
               s += "<" + this.objects[i].value + ">";
            }
         } else {
            s += "<" + this.objects[i].value + ">";
         }
      } else if (this.objects[i].type=="http://www.w3.org/2001/XMLSchema#integer" ||
                 this.objects[i].type=="http://www.w3.org/2001/XMLSchema#decimal" ||
                 this.objects[i].type=="http://www.w3.org/2001/XMLSchema#double" ||
                 this.objects[i].type=="http://www.w3.org/2001/XMLSchema#boolean") {
         s += this.objects[i].value;
      } else if (this.objects[i].type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral") {
         var serializer = new XMLSerializer();
         var value = "";
         for (var x=0; x<this.objects[i].value.length; x++) {
            if (this.objects[i].value[x].nodeType==Node.ELEMENT_NODE) {
               var prefixMap = RDFaPredicate.getPrefixMap(this.objects[i].value[x]);
               var prefixes = [];
               for (var prefix in prefixMap) {
                  prefixes.push(prefix);
               }
               prefixes.sort();
               var e = this.objects[i].value[x].cloneNode(true);
               for (var p=0; p<prefixes.length; p++) {
                  e.setAttributeNS("http://www.w3.org/2000/xmlns/",prefixes[p].length==0 ? "xmlns" : "xmlns:"+prefixes[p],prefixMap[prefixes[p]]);
               }
               value += serializer.serializeToString(e);
            } else if (this.objects[i].value[x].nodeType==Node.TEXT_NODE) {
               value += this.objects[i].value[x].nodeValue;
            }
         }
         s += '"""'+value.replace(/"""/g,"\\\"\\\"\\\"")+'"""^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral>';
      } else if (this.objects[i].type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML") {
         // We can use innerHTML as a shortcut from the parentNode if the list is not empty
         if (this.objects[i].value.length==0) {
            s += '""""""^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML>';
         } else {
            s += '"""'+this.objects[i].value[0].parentNode.innerHTML.replace(/"""/g,"\\\"\\\"\\\"")+'"""^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML>';
         }
      } else {
         var l = this.objects[i].value;
         if (l.indexOf("\n")>=0 || l.indexOf("\r")>=0) {
            s += '"""' + l.replace(/"""/g,"\\\"\\\"\\\"") + '"""';
         } else {
            s += '"' + l.replace(/"/g,"\\\"") + '"';
         }
         if (this.objects[i].type!="http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral") {
             s += "^^<"+this.objects[i].type+">";
         } else if (this.objects[i].language) {
             s += "@"+this.objects[i].language;
         }
      }
   }
   return s;
}
