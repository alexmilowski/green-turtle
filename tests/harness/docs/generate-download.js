function download(type,files) {
   var s = "";
   for (var i=0; i<files.length; i++) {
      var pos = files[i].lastIndexOf("/");
      var file = files[i].substring(pos+1);
      s += "curl "+files[i]+" > tests/cache/"+type+"/"+file+"\n";
   }
   return s;
}

function generateDownloads(manifestURI) {
   var output = document.getElementById("script");
   while (output.firstChild) {
      output.removeChild(output.firstChild);
   }
   var pos = manifestURI.lastIndexOf("/");
   for (pos--; pos>=0 && manifestURI.charAt(pos)!="/"; pos--);
   var baseURI = "http://rdfa.info/test-suite/rdfa1.1"+manifestURI.substring(pos);
   var type = manifestURI.substring(pos).substring(1);
   type = type.substring(0,type.indexOf("/"));
   console.log("Loading manifest from: "+manifestURI+", base: "+baseURI+", type: "+type);
   var requester = new XMLHttpRequest();
   requester.open("GET",manifestURI,false);
   requester.send(null);
   console.log("Parsing manifest...");
   var turtle = document.data.implementation.parse(requester.responseText,"text/turtle",{ baseURI: baseURI});
   //console.log(turtle.toString());
   var dataDoc = document.implementation.createDocument("http://www.w3.org/1999/xhtml","html",null);
   dataDoc.documentElement.setAttributeNS("http://www.w3.org/XML/1998/namespace","base",window.location.href);
   GreenTurtle.attach(dataDoc);
   console.log("Merging ...");
   dataDoc.data.merge(turtle.graph,turtle.prefixes);
   console.log("Processing ...");
   var manifestSubject = dataDoc.data.getSubjects("rdf:type","mf:Manifest")[0];
   var currentSubject = dataDoc.data.getValues(manifestSubject,"mf:entries")[0];
   var script = "";
   var count = 0;
   while (currentSubject!="http://www.w3.org/1999/02/22-rdf-syntax-ns#nil") {
      console.log(currentSubject);
      var entrySubject = dataDoc.data.getValues(currentSubject,"rdf:first")[0];
      pos = entrySubject.lastIndexOf("/");
      var file = entrySubject.substring(pos+1);
      entrySubject = "http://rdfa.info/test-suite/test-cases/rdfa1.1/"+type+"/manifest#"+file.substring(0,file.indexOf("."));
      //console.log(entrySubject);
      var actionSubject = dataDoc.data.getValues(entrySubject,"mf:action")[0];
      //console.log(actionSubject);
      script += download(type,dataDoc.data.getValues(actionSubject,"qt:data"));
      script += download(type,dataDoc.data.getValues(actionSubject,"qt:query"));
      count++;
      if (count>20) {
         output.appendChild(document.createTextNode(script));
         script = "";
      }
      currentSubject = dataDoc.data.getValues(currentSubject,"rdf:rest")[0];
   }
   output.appendChild(document.createTextNode(script));
}

window.addEventListener("load",function() {
   var go = document.getElementById("go").onclick = function() {
      generateDownloads(document.getElementById("source").value);
   };
   
},false);