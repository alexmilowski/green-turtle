CallbackProcessor.prototype = new RDFaProcessor();
CallbackProcessor.prototype.constructor=RDFaProcessor;
function CallbackProcessor() {
   RDFaProcessor.call(this);
}

CallbackProcessor.prototype.newSubjectOrigin = function(origin,subject) {
   console.log("New origin for "+subject);
}

CallbackProcessor.prototype.addTriple = function(origin,subject,predicate,object) {
   console.log("New triple: "+subject+", predicate "+predicate+", object "+object.value+", "+object.language+", "+object.type);
}

window.addEventListener("load",function() {

   var processor = new CallbackProcessor();
   processor.process(document);
   
},false);