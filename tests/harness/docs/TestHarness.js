function TestHarness() {
   
}

TestHarness.prototype.init = function(iframe)
{
   this.htmlLoader = iframe;
   this.index = 0;
}

TestHarness.prototype.nextTest = function() {
   if (this.index>=this.entries.length) {
      this.generateReport();
      return;
   }
   var entry = this.entries[this.index];
   this.index++;
   var app = this;
   if (this.type.indexOf("html")==0) {
      // html, use loader
      this.htmlLoader.onload = function() {
         setTimeout(function() {
            app.test(entry,app.htmlLoader.contentDocument,function() {
               app.nextTest()
            });
         },1);
      }
      this.htmlLoader.src = entry.data;
   } else {
      HTTP("GET",entry.data,{
         returnHeaders: true,
         onSuccess: function(status,doc,text,headers) {
            if (!doc) {
               var contentType = headers["Content-Type"];
               var semicolon = contentType.indexOf(";");
               if (semicolon>0) {
                  contentType = contentType.substring(0,semicolon);
               }
               contentType = app.trim(contentType);
               console.log("Unsupported content type: "+contentType);
               return;
            }
            setTimeout(function() {
               app.test(entry,doc,function() {
                  app.nextTest()
               });
            },1);
         },
         onFailure: function(status,doc,text) {
            console.log("failed to retrieve document , status "+status);
         }
      });
   }
   
}

TestHarness.prototype.test = function(entry,dataDoc,oncomplete)
{
   console.log("["+(this.index-1)+"] Processing "+entry.name);
   document.data.implementation.attach(dataDoc,{ 
      baseURI: entry.baseURI, 
      baseURIMap: function(uri) {
         var prefix = "http://localhost:8888/tests/cache";
         if (uri.match(/^http:\/\/localhost:8888\/tests\/cache/)) {
            uri = "http://rdfa.info/test-suite/test-cases/rdfa1.1"+uri.substring(prefix.length);
         }
         return uri;
      }
   });
   var app = this;
   HTTP("GET",entry.query,{
      synchronizedRequest: true,
      onSuccess: function(status,doc,text) {
         app.compare(entry,dataDoc,text);
         if (oncomplete) {
            oncomplete();
         }
      },
      onFailure: function(status,doc,text) {
         console.log("Could not retrieve "+entry.query+", status "+status);
         return;
      }
   });
}

TestHarness.prototype.compare = function(entry,dataDoc,sparql) {
   var id = null;
   entry.turtle = dataDoc.data.graph.toString();
   entry.sparql = sparql;
   entry.passed = false;
   entry.failed = false;
   HTTP("POST","/sparql/new",{
      synchronizedRequest: true,
      contentType: "text/turtle",
      body: entry.turtle,
      onSuccess: function(status,doc,text) {
         id = doc.documentElement.getAttribute("id");
      },
      onFailure: function(status,doc,text) {
         entry.failed = true;
         console.log("Could not post turtle ("+status+"): "+text);
      }
   });
   if (id==null) {
      return;
   }
   console.log("Query context "+id);
   var askResult = false;
   HTTP("POST","/sparql/query/"+id,{
      synchronizedRequest: true,
      contentType: "text/sparql",
      body: entry.sparql,
      onSuccess: function(status,doc,text) {
         entry.ask = doc.documentElement.textContent=="true";
      },
      onFailure: function(status,doc,text) {
         entry.failed = true;
         console.log("Could not post turtle ("+status+"): "+text);
      }
   });
   
   if (entry.failed) {
      return;
   }

   entry.passed = entry.result ? entry.ask : !entry.ask;
 
   console.log(entry.passed ? "PASS" : "FAIL");
}

TestHarness.prototype.generateReport = function() {
   var makeShowOutput = function(entry) {
      return function() {
         console.log(entry.turtle);
         return false;
      }
   }
   var makeShowSparql = function(entry) {
      return function() {
         console.log(entry.sparql);
         return false;
      }
   }
   var success = 0;
   for (var i=0; i<this.entries.length; i++) {
      var entry = this.entries[i];
      var row = document.createElement("tr");
      this.output.appendChild(row);
      row.innerHTML = "<td><a href=\"#\">[T]</a><a href=\"#\">[Q]</a> <a href=\""+entry.data+"\" target=\"new\">"+entry.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')+"</a></td><td class=\""+(entry.failed ? "fail" : "pass")+"\">"+!entry.failed+"</td><td class=\""+(entry.passed ? "pass" : "fail")+"\">"+(entry.passed ? "pass" : "fail")+"</td><td></td>";
      row.cells[0].firstChild.onclick = makeShowOutput(entry);
      row.cells[0].firstChild.nextElementSibling.onclick = makeShowSparql(entry);
      if (!entry.passed) {
         var cell = row.cells[3];
         cell.innerHTML = "<pre/><p>versus</p><pre/>";
         cell.firstChild.appendChild(document.createTextNode(entry.turtle));
         cell.lastChild.appendChild(document.createTextNode(entry.sparql));
      } else {
         success++;
      }
   }
   
   this.summary.innerHTML = success+" / "+this.entries.length;

   this.generateEARL();
}

TestHarness.prototype.generateEARL = function() {
   var now = new Date();
   var dateStr = now.format("yyyy-mm-dd")
   var dateTimeStr = now.format("yyyy-mm-dd'T'HH:MM:sso")
   var requester = new XMLHttpRequest();
   requester.open("GET",this.earlURI,false);
   requester.send(null);
   var parts = requester.responseText.split(/({date})/);
   for (var i=0; i<parts.length; i++) {
      if (parts[i]=="{date}") {
         this.earl.appendChild(document.createTextNode(dateStr));
      } else {
         this.earl.appendChild(document.createTextNode(parts[i]));
      }
   }

   for (var i=0; i<this.entries.length; i++) {
      var s = "[ a earl:Assertion; \n\
  earl:assertedBy <http://www.milowski.com#alex>; \n\
  earl:subject <https://code.google.com/p/green-turtle/>; \n\
  earl:test <";
      s += this.entries[i].subject +"> ;\n";
      s += "  earl:result [\n\
    a earl:TestResult; \n\
    earl:outcome ";
      s += this.entries[i].passed ? "earl:passed; \n" : "earl:failed; \n"
      s += "    dc:date \""+dateTimeStr+"\"^^xsd:dateTime ];\n"
      s += "  earl:mode earl:automatic ] .\n\n";
      this.earl.appendChild(document.createTextNode(s));
   }
   // check report
   try {
      document.data.implementation.parse(this.earl.textContent,"text/turtle");
   } catch (ex) {
      alert("EARL format is invalid: "+ex.toString());
   }

}

TestHarness.sourceBase = "http://rdfa.info/test-suite/test-cases/rdfa1.1/";
TestHarness.prototype.mapURI = function(uri) {
   if (uri.indexOf(TestHarness.sourceBase)==0) {
      uri = window.location.origin+"/tests/cache/"+uri.substring(TestHarness.sourceBase.length);
   }
   return uri;
}

TestHarness.prototype.generate = function(manifestURI)
{
   var pos = manifestURI.lastIndexOf("/");
   for (pos--; pos>=0 && manifestURI.charAt(pos)!="/"; pos--);
   this.baseURI = "http://rdfa.info/test-suite/rdfa1.1"+manifestURI.substring(pos);
   this.type = manifestURI.substring(pos).substring(1);
   this.type = this.type.substring(0,this.type.indexOf("/"));
   
   // load manifest
   console.log("Loading manifest from: "+manifestURI+", base: "+this.baseURI+", type: "+this.type);
   var requester = new XMLHttpRequest();
   requester.open("GET",manifestURI,false);
   requester.send(null);
   console.log("Parsing manifest...");
   var data = document.data.implementation.createDocumentData();
   var turtle = document.data.implementation.parse(requester.responseText,"text/turtle",{ baseURI: this.baseURI});
   data.merge(turtle.subjects,{ prefixes: turtle.prefixes });
   console.log("Processing ...");

   // load entries
   var manifestSubject = data.getSubjects("rdf:type","mf:Manifest")[0];
   var currentSubject = data.getValues(manifestSubject,"mf:entries")[0];
   this.entries = [];
   while (currentSubject!="http://www.w3.org/1999/02/22-rdf-syntax-ns#nil") {
      var entrySubject = data.getValues(currentSubject,"rdf:first")[0];
      var entry = {
         subject: entrySubject
      };
      entry.name = data.getValues(entry.subject,"mf:name")[0];
      entry.comment = data.getValues(entry.subject,"rdfs:comment")[0];
      entry.classification = data.getValues(entry.subject,"test:classification")[0];
      entry.result = "true"==data.getValues(entry.subject,"mf:result")[0];
      
      var actionSubject = data.getValues(entry.subject,"mf:action")[0];
      entry.baseURI = data.getValues(actionSubject,"qt:data")[0];
      entry.data = this.mapURI(entry.baseURI);
      entry.query = this.mapURI(data.getValues(actionSubject,"qt:query")[0]);
      
      this.entries.push(entry);
      
      currentSubject = data.getValues(currentSubject,"rdf:rest")[0];
   }
   
   if (this.only>=0) {
      var save = this.entries[this.only];
      this.entries = [ save ];
   }
   console.log(this.entries.length+" tests");
   
   this.index = 0;
   this.nextTest();
}

var testHarness = new TestHarness();

window.addEventListener("load",function() {
   
   var child = document.head.firstElementChild;
   var earlURI = null;
   while (child) {
      var rel = child.getAttribute("rel");
      if (rel=="earl") {
         testHarness.earlURI = child.href;
      }
      child = child.nextElementSibling;
   }
   testHarness.init(document.getElementById("loader"));
   testHarness.output = document.getElementById("output");
   testHarness.earl = document.getElementById("earl");
   testHarness.summary = document.getElementById("summary");
   var go = document.getElementById("go").onclick = function() {
      testHarness.output.innerHTML = "<tr><th>Test</th><th>Parsed</th><th>Outcome</th><th>Details</th></tr>";
      testHarness.summary.innerHTML = "";
      testHarness.earl.innerHTML = "";
      var only = document.getElementById("only").value;
      testHarness.only = only.length==0 ? -1 : parseInt(only);
      testHarness.generate(document.getElementById("source").value);
   };
   
},false);