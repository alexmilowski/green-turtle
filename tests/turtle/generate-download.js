window.addEventListener("load",function() {
   var output = document.getElementById("script");
   function download(files) {
      for (var i=0; i<files.length; i++) {
         var pos = files[i].lastIndexOf("/");
         var file = files[i].substring(pos+1);
         output.appendChild(document.createTextNode("curl "+files[i]+" > "+file+"\n"));
      }
   }
   var child = document.head.firstElementChild;
   while (child && child.localName!="link") {
      child = child.nextElementSibling;
   }
   var manifestURI = child.href;
   console.log("Loading manifest from: "+manifestURI);
   var requester = new XMLHttpRequest();
   requester.open("GET",manifestURI,false);
   requester.send(null);
   var turtle = document.data.implementation.parse(requester.responseText,"text/turtle",{ baseURI: "http://www.w3.org/2013/TurtleTests/manifest.ttl"});
   document.data.merge(turtle.subjects,{prefixes: turtle.prefixes, mergeBlankNodes: true});
   var manifestSubject = document.data.getSubjects("rdf:type","mf:Manifest")[0];
   var currentSubject = document.data.getValues(manifestSubject,"mf:entries")[0];
   while (currentSubject!="http://www.w3.org/1999/02/22-rdf-syntax-ns#nil") {
      var entrySubject = document.data.getValues(currentSubject,"rdf:first")[0];
      download(document.data.getValues(entrySubject,"mf:action"));
      download(document.data.getValues(entrySubject,"mf:result"));
      currentSubject = document.data.getValues(currentSubject,"rdf:rest")[0];
   }
},false);