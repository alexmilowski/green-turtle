window.addEventListener("load",function() {
   document.getElementById("test").onclick = function() {
      jsonld = document.getElementById("jsonld").value;
      window.graph = new RDFaGraph();
      var processor = new GraphJSONLDProcessor(window.graph);
      processor.process(jsonld,{ baseURI: document.baseURI });
   }
},false);