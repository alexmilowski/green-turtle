window.addEventListener("load",function() {
   var baseURI = document.getElementById("uri");
   var input = document.getElementById("turtle");
   var output = document.getElementById("output");
   var parseButton = document.getElementById("parse");
   var loadButton = document.getElementById("load");
   function load(uri) {
      console.log("Loading: "+uri);
      var requester = new XMLHttpRequest();
      requester.onreadystatechange = function() {
         if (requester.readyState==4) {
            input.value = requester.responseText;
         }
      }
      requester.open("GET",uri,true);
      requester.send(null);
   }
   if (window.location.search.length>1) {
      var inputURI = window.location.search.substring(1);
      baseURI.value = inputURI;
      load(baseURI.value);
   }
   parseButton.onclick = function() {
      var errors = [];
      try {
         var result = document.data.implementation.parse(input.value,"text/turtle",
            { baseURI: baseURI.value.length>0 ? baseURI.value : null,
              errorHandler: function(line,msg) { errors.push({ line: line, message: msg}); }
            }
         );
         output.innerHTML = "";
         output.appendChild(document.createTextNode(result.toString()));
      } catch (ex) {
         console.log(ex);
         output.innerHTML = "Syntax errors:\n";
         for (var i=0; i<errors.length; i++) {
            output.appendChild(document.createTextNode(errors[i].line+": "+errors[i].message+"\n"));
         }
      }
   };
   loadButton.onclick = function() {
      load(baseURI.value);
   };
},false);