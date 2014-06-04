if (document.data === undefined) {
   var checker = function() {
      if (typeof GreenTurtleOptions == "undefined") {
         setTimeout(function() {
            checker()
         },10);
      } else {
         GreenTurtle.implementation.processors["microdata"].enabled = GreenTurtleOptions.microdataEnabled;
         GreenTurtle.attach(document);
      }
   }
   checker();
}