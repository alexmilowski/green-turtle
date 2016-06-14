function RDFaEnvironment(owner) {
   this.query = function(query,template) {
      if (!query) {
         return owner.getProjections(template);
      }
      var projections = [];
      for (var subject in owner._data_.graph.subjects) {
         var snode = owner._data_.graph.subjects[subject];
         for (var key in query) {
            var predicate = owner._data_.graph.curieParser.parse(key,true);
            var pnode = snode.predicates[predicate];
            if (!pnode) {
               snode = null;
               break;
            }
            var value = owner._data_.graph.curieParser.parse(query[key],false);
            var object = null;
            for (var i=0; !object && i<pnode.objects.length; i++) {
               if (pnode.objects[i].value==value) {
                  object = pnode.objects[i];
               }
            }
            if (!object) {
               snode = null;
               break;
            }
         }
         if (snode) {
            projections.push(DocumentData.toProjection(owner,snode,template));
         }
      }
      return projections;
   }
}

function Projection(owner,subject) {
   this._data_ = { 
      owner: owner,
      subject: subject,
      properties: {}
   };
}

Projection.prototype.getProperties = function() {
   var propertyNames = [];
   for (var property in this._data_.properties) {
      propertyNames.push(property);
   }
   return propertyNames;
}

Projection.prototype.getSubject = function() {
   return this._data_.subject;
}

Projection.prototype.get = function(uriOrCurie) {
   var property = this._data_.owner._data_.graph.curieParser.parse(uriOrCurie,true);
   var objects = this._data_.properties[property];
   return objects ? objects[0] : null;
}

Projection.prototype.getAll = function(uriOrCurie) {
   var property = this._data_.owner._data_.graph.curieParser.parse(uriOrCurie,true);
   return this._data_.properties[property];
}

DocumentData.prototype = new URIResolver();
DocumentData.prototype.constructor = DocumentData;
function DocumentData (uri) {
   this._data_ = { 
      graph: new RDFaGraph()
   };
   this._data_.graph.baseURI = this.parseURI(uri)
   this._data_.baseURI = this._data_.graph.baseURI;

   var dataContext = this._data_;
   Object.defineProperty(this,"rdfa", {
      value: new RDFaEnvironment(this),
      writable: false,
      configurable: false,
      enumerable: true
   });
   Object.defineProperty(this,"graph", {
      value: this._data_.graph,
      writable: false,
      configurable: false,
      enumerable: true
   });
   Object.defineProperty(this,"implementation", {
      value: GreenTurtle.implementation,
      writable: false,
      configurable: false,
      enumerable: true
   });
}

DocumentData.nameChar = '[-A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u10000-\uEFFFF\.0-9\u00B7\u0300-\u036F\u203F-\u2040]';
DocumentData.nameStartChar = '[\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u0131\u0134-\u013E\u0141-\u0148\u014A-\u017E\u0180-\u01C3\u01CD-\u01F0\u01F4-\u01F5\u01FA-\u0217\u0250-\u02A8\u02BB-\u02C1\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D6\u03DA\u03DC\u03DE\u03E0\u03E2-\u03F3\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E-\u0481\u0490-\u04C4\u04C7-\u04C8\u04CB-\u04CC\u04D0-\u04EB\u04EE-\u04F5\u04F8-\u04F9\u0531-\u0556\u0559\u0561-\u0586\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0641-\u064A\u0671-\u06B7\u06BA-\u06BE\u06C0-\u06CE\u06D0-\u06D3\u06D5\u06E5-\u06E6\u0905-\u0939\u093D\u0958-\u0961\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8B\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AE0\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B36-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0E01-\u0E2E\u0E30\u0E32-\u0E33\u0E40-\u0E45\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EAE\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0F40-\u0F47\u0F49-\u0F69\u10A0-\u10C5\u10D0-\u10F6\u1100\u1102-\u1103\u1105-\u1107\u1109\u110B-\u110C\u110E-\u1112\u113C\u113E\u1140\u114C\u114E\u1150\u1154-\u1155\u1159\u115F-\u1161\u1163\u1165\u1167\u1169\u116D-\u116E\u1172-\u1173\u1175\u119E\u11A8\u11AB\u11AE-\u11AF\u11B7-\u11B8\u11BA\u11BC-\u11C2\u11EB\u11F0\u11F9\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2126\u212A-\u212B\u212E\u2180-\u2182\u3041-\u3094\u30A1-\u30FA\u3105-\u312C\uAC00-\uD7A3\u4E00-\u9FA5\u3007\u3021-\u3029_]';
DocumentData.NCNAME = new RegExp('^' + RDFaProcessor.nameStartChar + RDFaProcessor.nameChar + '*$');

DocumentData.toProjection = function(owner,snode,template) {

   var projection = new Projection(owner,snode.subject);
   for (var predicate in snode.predicates) {
      var pnode = snode.predicates[predicate];
      var values = [];
      projection._data_.properties[predicate] = values;
      for (var i=0; i<pnode.objects.length; i++) {
         values.push(pnode.objects[i].value);
      }
   }
   if (template) {
      for (var key in template) {
         var predicate = template[key];
         predicate = owner._data_.graph.curieParser.parse(predicate,true);
         var values = projection._data_.properties[predicate];
         if (values) {
            // TODO: API issue: is this the first value or all values?
            projection[key] = values.length==1 ? values[0] : values;
         }
      }
   }
   return projection;
};


DocumentData.prototype.getProperties = function(subject) {
   
   var properties = [];

   if (subject) {
      subject = this._data_.graph.curieParser.parse(subject,true);
      snode = this._data_.graph.subjects[subject];
      if (snode) {
         for (var predicate in snode.predicates) {
            properties.push(predicate);
         }
      }
   } else {
      var uniqueProperties = {};
      for (var graphSubject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[graphSubject];
         if (snode) {
            for (var predicate in snode.predicates) {
               if (!uniqueProperties[predicate]) {
                  uniqueProperties[predicate] = true;
                  properties.push(predicate);
               }
            }
         }
      }
   }
   return properties;
};

DocumentData.prototype.getSubjects = function(property,value) {
   var subjects = [];
   if (property) {
      property = this._data_.graph.curieParser.parse(property,true);
   }
   if (property && value) {
      var expanded = this._data_.graph.curieParser.parse(value,true);
      for (var subject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[subject];
         var pnode = snode.predicates[property];
         if (pnode) {
            for (var i=0; i<pnode.objects.length; i++) {
               if (pnode.objects[i].value==value || pnode.objects[i].value==expanded) {
                  subjects.push(subject);
                  break;
               }
            }
         }
      }
   } else if (property) {
      for (var subject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[subject];
         var pnode = snode.predicates[property];
         if (pnode) {
            subjects.push(subject);
         }
      }
   } else if (value) {
      var expanded = this._data_.graph.curieParser.parse(value,true);
      for (var subject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[subject];
         for (var predicate in snode.predicates) {
            var pnode = subject.predicates[predicate];
            if (pnode) {
               var object = null;
               for (var i=0; !object && i<pnode.objects.length; i++) {
                  if (pnode.objects[i].value==value || node.objects[i].value==expanded) {
                     object = pnode.objects[i];
                  }
               }
               if (object) {
                  subjects.push(subject);
                  break;
               }
            }
         }
      }
   } else {
      for (var subject in this._data_.graph.subjects) {
         subjects.push(subject);
      }
   }
   return subjects;
};

// TODO: is there a way to merge this with getValueOrigin ?  The code is almost the same
DocumentData.prototype.getValueOrigins = function(subject,property) {
   var values = [];
   var convert = function(pnode) {
      if (pnode) {
         for (var i=0; i<pnode.objects.length; i++) {
            if (Array.isArray(pnode.objects[i].origin)) {
               for (var j=0; j<pnode.objects[i].origin.length; j++) {
                  values.push({ origin: pnode.objects[i].origin[j], value: pnode.objects[i].value });
               }
            } else {
               values.push({ origin: pnode.objects[i].origin, value: pnode.objects[i].value });
            }
         }
      }
   }
   if (property) {
      property = this._data_.graph.curieParser.parse(property,true);
   }
   if (subject) {
      subject = this._data_.graph.curieParser.parse(subject,true);
      var snode = this._data_.graph.subjects[subject];
      if (snode) {
         if (property) {
            convert(snode.predicates[property]);
         } else {
            for (var predicate in snode.predicates) {
               convert(snode.predicates[predicate]);
            }
         }
      }
   } else if (property) {
      for (var graphSubject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[graphSubject];
         convert(snode.predicates[property]);
      }
   } else {
      for (var graphSubject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[graphSubject];
         for (var predicate in snode.predicates) {
            convert(snode.predicates[predicate]);
         }
      }
   }
   return values;
}
DocumentData.prototype.getValues = function(subject,property) {
   var values = [];
   if (property) {
      property = this._data_.graph.curieParser.parse(property,true);
   }
   if (subject) {
      subject = this._data_.graph.curieParser.parse(subject,true);
      var snode = this._data_.graph.subjects[subject];
      if (snode) {
         if (property) {
            var pnode = snode.predicates[property];
            if (pnode) {
               for (var i=0; i<pnode.objects.length; i++) {
                  values.push(pnode.objects[i].value);
               }
            }
         } else {
            for (var predicate in snode.predicates) {
               var pnode = snode.predicates[predicate];
               for (var i=0; i<pnode.objects.length; i++) {
                  values.push(pnode.objects[i].value);
               }
            }
         }
      }
   } else if (property) {
      for (var graphSubject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[graphSubject];
         var pnode = snode.predicates[property];
         if (pnode) {
            for (var i=0; i<pnode.objects.length; i++) {
               values.push(pnode.objects[i].value);
            }
         }
      }
   } else {
      for (var graphSubject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[graphSubject];
         for (var predicate in snode.predicates) {
            var pnode = snode.predicates[predicate];
            for (var i=0; i<pnode.objects.length; i++) {
               values.push(pnode.objects[i].value);
            }
         }
      }
   }
   return values;
};

Object.defineProperty(DocumentData.prototype,"prefixes",{
   enumerable: true,
   get: function() {
      return Object.keys(this._data_.graph.prefixes);
   }
});

DocumentData.prototype.setMapping = function(prefix,uri) {
   this._data_.graph.prefixes[prefix] = uri;
};

DocumentData.prototype.getMapping = function(prefix) {
   return this._data_.graph.prefixes[prefix];
};

DocumentData.prototype.expand = function(curie) {
   return this._data_.graph.expand(curie);  
}

DocumentData.prototype.shorten = function(uri) {
   return this._data_.graph.shorten(uri);
}

DocumentData.prototype.getSubject = function(subject) {
   if (!subject) { return null; }

   subject = this._data_.graph.curieParser.parse(subject,true);
 
   var snode = this._data_.graph.subjects[subject];
   return snode ? snode : null;
}

DocumentData.prototype.getProjection = function(subject, template) {
   if (!subject) { return null }

   subject = this._data_.graph.curieParser.parse(subject,true);
   
   var snode = this._data_.graph.subjects[subject];
   if (!snode) {
      return null;
   }

   return DocumentData.toProjection(this,snode,template);
}

DocumentData.prototype.getProjections = function(property, value, template) {
   if (property) {
      property = this._data_.graph.curieParser.parse(property,true);
   }
   var projections = [];
   if (typeof value == "undefined" && typeof template == "undefined") {
      template = property;
   }
   if (property && value) {
      var expanded = this._data_.graph.curieParser.parse(value,true);
      for (var subject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[subject];
         var pnode = snode.predicates[property];
         if (pnode) {
            for (var i=0; i<pnode.objects.length; i++) {
               if (pnode.objects[i].value==value || pnode.objects[i].value==expanded) {
                  projections.push(DocumentData.toProjection(this,snode,template));
                  break;
               }
            }
         }
      }
   } else if (property) {
      for (var subject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[subject];
         if (snode.predicates[property]) {
            projections.push(DocumentData.toProjection(this,snode,template));
         }
      }
   } else {
      for (var subject in this._data_.graph.subjects) {
         var snode = this._data_.graph.subjects[subject];
         projections.push(DocumentData.toProjection(this,snode,template));
      }
   }
   return projections;
};

DocumentData.prototype.merge = function(graph,options) {
   var mergeBlank = options && options.mergeBlankNodes ? true : false;
   var max = 0;
   if (!mergeBlank) {
      for (var subject in this._data_.graph.subjects) {
         var match = /_:([0-9]+)/.exec(subject);
         if (match) {
            var n = parseInt(match[1]);
            if (n>max) {
               max = n;
            }
         }
      }
   }
   if (graph) {
      var blankMap = {};
      var subjectMap = mergeBlank ? 
         function(u) { return u; } :
         function(u) { 
            var mapSubject = blankMap[u];
            if (!mapSubject && /_:([0-9]+)/.test(u)) {
               max++;
               mapSubject = "_:"+max;
               blankMap[u] = mapSubject;
            }
            return mapSubject ? mapSubject : u;
         };
      var subjects = typeof graph.subjects != "undefined" ? graph.subjects : graph;
      for (var subject in subjects) {
         var mapSubject = subjectMap(subject);
         var snode = subjects[subject];
         subject = mapSubject ? mapSubject : subject;
         var target = this._data_.graph.subjects[subject];
         if (target) {
            for (var predicate in snode.predicates) {
               var pnode = snode.predicates[predicate];
               var targetPredicate = target.predicates[predicate];
               if (targetPredicate) {
                  for (var i=0; i<pnode.objects.length; i++) {
                     var object = pnode.objects[i];
                     var toAdd = [];
                     for (var j=0; j<targetPredicate.objects.length; j++) {
                        if ((object.type==RDFaProcessor.XMLLiteralURI || object.type==RDFaProcessor.HTMLLiteralURI) && (targetPredicate.objects[j].type!=object.type || targetPredicate.objects[j].value!==object.value)) {
                           toAdd.push(object);
                        } else if (targetPredicate.objects[j].type!=object.type || targetPredicate.objects[j].value==object.value) {
                           toAdd.push(object);
                        }
                     }
                     // map object subjects
                     for (var j=0; j<toAdd.length; j++) {
                        // Do not add duplicate objects to the graph
                        var found = null;
                        for (var i=0; !found && i<targetPredicate.objects.length; i++) {
                           if (targetPredicate.objects[i].value==toAdd[j].value && targetPredicate.objects[i].type==toAdd[j].type) {
                              found = targetPredicate.objects[i];
                           }
                        }
                        if (found) {
                           continue;
                        }
                        if (toAdd[j].type==RDFaProcessor.objectURI) {
                           toAdd[j].value = subjectMap(toAdd[j].value);
                        }
                        targetPredicate.objects.push(toAdd[j]);
                     }
                  }
               } else {
                  target.predicates[predicate] = pnode;
                  // map object subjects
                  for (var i=0; i<pnode.objects.length; i++) {
                     if (pnode.objects[i].type==RDFaProcessor.objectURI) {
                        pnode.objects[i].value = subjectMap(pnode.objects[i].value);
                     }
                  }
               }
            }
         } else {
            this._data_.graph.subjects[subject] = snode;
            snode.subject = subject;
            // map object subjects
            for (var predicate in snode.predicates) {
               var pnode = snode.predicates[predicate];
               for (var i=0; i<pnode.objects.length; i++) {
                  if (pnode.objects[i].type==RDFaProcessor.objectURI) {
                     pnode.objects[i].value = subjectMap(pnode.objects[i].value);
                  }
               }
            }
         }
      }
   }
   if (options && options.prefixes) {
      for (var prefix in options.prefixes) {
         if (!this._data_.graph.prefixes[prefix]) {
            this._data_.graph.prefixes[prefix] = options.prefixes[prefix];
         }
      }
   }
}

Element.prototype.getElementsByType = function() {
   var typeList = [];
   for (var i=0; i<arguments.length; i++) {
      typeList.push(this.ownerDocument.data.graph.curieParser.parse(arguments[i],false));
   }
   var walker = this.ownerDocument.createTreeWalker(this,NodeFilter.SHOW_ELEMENT,
     { acceptNode: function(e) {
          if (!e.data) { return NodeFilter.FILTER_SKIP; }
          for (var i=0; i<typeList.length; i++) {
             if (e.data.types.indexOf(typeList[i])>=0) {
                return e.getAttributeNode("typeof") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
             }
          }
          return NodeFilter.FILTER_SKIP;
       }        
     },
     false);
   var results = [];
   results.item = function(index) {
      return this[index];
   }
   while (walker.nextNode()) {
      results.push(walker.currentNode); 
   }
   return results;
}

Element.prototype.getFirstElementByType = function() {
   var typeList = [];
   for (var i=0; i<arguments.length; i++) {
      typeList.push(this.ownerDocument.data.graph.curieParser.parse(arguments[i],false));
   }
   var walker = this.ownerDocument.createTreeWalker(this,NodeFilter.SHOW_ELEMENT,
     { acceptNode: function(e) {
          if (!e.data) { return NodeFilter.FILTER_SKIP; }
          for (var i=0; i<typeList.length; i++) {
             if (e.data.types.indexOf(typeList[i])>=0) {
                return e.getAttributeNode("typeof") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
             }
          }
          return NodeFilter.FILTER_SKIP;
       }        
     },
     false);
   return walker.nextNode() ? walker.currentNode : null;
}

DocumentData.attach = function(target,options) {

   var getBaseURI = function(node) {
      var baseURI = node.baseURI;
      if (!baseURI) {
         var baseTags = document.getElementsByTagName("base");
         baseURI = baseTags.length ? baseTags[0].href : document.URL;
      }
      return baseURI;
   };

   var baseURI = options && options.baseURI ?
      options.baseURI :
      getBaseURI(target.nodeType == Node.DOCUMENT_NODE ?
         target.documentElement : target.graph);
         

   Object.defineProperty(target,"data", {
      value: new DocumentData(baseURI),
      writable: false,
      configurable: false,
      enumerable: true
   });

   target.getElementsByType = function(type) {
      return this.getElementsByProperty("http://www.w3.org/1999/02/22-rdf-syntax-ns#type",type);
   };

   target.getElementsBySubject = function(subject) {
      var nodes = [];
      nodes.item = function(index) {
         return this[index];
      };
      subject = this.data._data_.graph.curieParser.parse(subject,true);
      var snode = this.data._data_.graph.subjects[subject];
      if (snode) {
         for (var i=0; i<snode.origins.length; i++) {
            nodes.push(snode.origins[i]);
         }
      }
      return nodes;
   };

   target.getElementsByProperty = function(property,value) {
      var nodes = [];
      nodes.item = function(index) {
         return this[index];
      };
      if (value) {
         value = this.data._data_.graph.curieParser.parse(value,false);
      }
      var noValue = typeof value == "undefined";
      property = this.data._data_.graph.curieParser.parse(property,true);
      for (var subject in this.data._data_.graph.subjects) {
         var snode = this.data._data_.graph.subjects[subject];
         var pnode = snode.predicates[property];
         if (pnode) {
            for (var i=0; i<pnode.objects.length; i++) {
               if (noValue || pnode.objects[i].value==value) {
                  if (Array.isArray(pnode.objects[i].origin)) {
                     nodes.push.apply(nodes,pnode.objects[i].origin);
                  } else {
                     nodes.push(pnode.objects[i].origin);
                  }
               }
            }
         }
      }
      return nodes;
   };
   
   target.getElementSubject = function(e) {
      for (var subject in this.data._data_.graph.subjects) {
         var snode = this.data._data_.graph.subjects[subject];
         if (snode.origins.indexOf(e)>=0) {
            return subject;
         }
      }
      return null;
   };
}

