if (typeof document.data === "undefined" && document.baseURI != "about:blank") {
   var href = safari.extension.baseURI+"RDFa.min.1.2.1.js";
   console.log("Injecting "+href+" into "+document.baseURI);
   var script = document.createElement("script");
   script.setAttribute("type","text/javascript");
   script.setAttribute("src",href);
   document.head.appendChild(script);
}
