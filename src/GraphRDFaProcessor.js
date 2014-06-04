GraphRDFaProcessor.prototype = new RDFaProcessor();
GraphRDFaProcessor.prototype.constructor=RDFaProcessor;
function GraphRDFaProcessor(target) {
   RDFaProcessor.call(this,target);
}

GraphRDFaProcessor.prototype.getObjectSize = function(obj) {
   var size = 0;
   for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
         size++;
      }
   }
   return size;
};


GraphRDFaProcessor.prototype.init = function() {
   var thisObj = this;
   this.finishedHandlers.push(function(node) {
      for (var subject in thisObj.target.graph.subjects) {
         var snode = thisObj.target.graph.subjects[subject];
         if (thisObj.getObjectSize(snode.predicates)==0) {
            delete thisObj.target.graph.subjects[subject];
         }
      }
   });
}
GraphRDFaProcessor.prototype.newBlankNode = function() {
   return this.target.graph.newBlankNode();
}

GraphRDFaProcessor.prototype.newSubjectOrigin = function(origin,subject) {
   var snode = this.newSubject(null,subject);
   for (var i=0; i<snode.origins.length; i++) {
      if (snode.origins[i]===origin) {
         return;
      }
   }
   snode.origins.push(origin);
   if (!origin.data) {
      Object.defineProperty(origin,"data", {
            value: snode,
            writable: false,
            configurable: true,
            enumerable: true
         });
   }
}

GraphRDFaProcessor.prototype.newSubject = function(origin,subject) {
   var snode = this.target.graph.subjects[subject];
   if (!snode) {
      snode = new RDFaSubject(this.target.graph,subject);
      this.target.graph.subjects[subject] = snode;
   }
   return snode;
}


GraphRDFaProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
   var snode = this.newSubject(origin,subject);
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

GraphRDFaProcessor.rdfaCopyPredicate = "http://www.w3.org/ns/rdfa#copy";
GraphRDFaProcessor.rdfaPatternType = "http://www.w3.org/ns/rdfa#Pattern";

GraphRDFaProcessor.prototype.copyProperties = function() {
   var copySubjects = [];
   var patternSubjects = {};
   for (var subject in this.target.graph.subjects) {
      var snode = this.target.graph.subjects[subject];
      var pnode = snode.predicates[GraphRDFaProcessor.rdfaCopyPredicate];
      if (!pnode) {
         continue;
      }
      copySubjects.push(subject);
      for (var i=0; i<pnode.objects.length; i++) {
         if (pnode.objects[i].type!=RDFaProcessor.objectURI) {
            continue;
         }
         var target = pnode.objects[i].value;
         var patternSubjectNode = this.target.graph.subjects[target];
         if (!patternSubjectNode) {
            continue;
         }
         var patternTypes = patternSubjectNode.predicates[RDFaProcessor.typeURI];
         if (!patternTypes) {
            continue;
         }
         var isPattern = false;
         for (var j=0; j<patternTypes.objects.length && !isPattern; j++) {
            if (patternTypes.objects[j].value==GraphRDFaProcessor.rdfaPatternType && 
                patternTypes.objects[j].type==RDFaProcessor.objectURI) {
               isPattern = true;
            }
         }
         if (!isPattern) {
            continue;
         }
         patternSubjects[target] = true;
         for (var predicate in patternSubjectNode.predicates) {
            var targetPNode = patternSubjectNode.predicates[predicate];
            if (predicate==RDFaProcessor.typeURI) {
               if (targetPNode.objects.length==1) {
                  continue;
               }
               for (var j=0; j<targetPNode.objects.length; j++) {
                  if (targetPNode.objects[j].value!=GraphRDFaProcessor.rdfaPatternType) {
                      var subjectPNode = snode.predicates[predicate];
                      if (!subjectPNode) {
                         subjectPNode = new RDFaPredicate(predicate);
                         snode.predicates[predicate] = subjectPNode;
                      }
                      subjectPNode.objects.push(
                         { type: targetPNode.objects[j].type, 
                           value: targetPNode.objects[j].value, 
                           language: targetPNode.objects[j].language, 
                           origin: targetPNode.objects[j].origin}
                      );
                      snode.types.push(targetPNode.objects[j].value);
                  }
               }
            } else {
               var subjectPNode = snode.predicates[predicate];
               if (!subjectPNode) {
                  subjectPNode = new RDFaPredicate(predicate);
                  snode.predicates[predicate] = subjectPNode;
               }
               for (var j=0; j<targetPNode.objects.length; j++) {
                   subjectPNode.objects.push(
                      { type: targetPNode.objects[j].type, 
                        value: targetPNode.objects[j].value, 
                        language: targetPNode.objects[j].language, 
                        origin: targetPNode.objects[j].origin}
                   );
               }
            }
         }
      }
   }
   for (var i=0; i<copySubjects.length; i++) {
      var snode = this.target.graph.subjects[copySubjects[i]];
      delete snode.predicates[GraphRDFaProcessor.rdfaCopyPredicate];
   }
   for (var subject in patternSubjects) {
      delete this.target.graph.subjects[subject];
   }
}

