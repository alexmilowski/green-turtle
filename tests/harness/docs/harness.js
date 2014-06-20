function TestHarness() {

}

TestHarness.prototype.init = function(oncomplete) {
   this.statusMessage = document.getElementById("message");
   this.output = document.getElementById("output");
   this.htmlLoader = document.getElementById("loader");
   this.showMessage("Loading test manifest...");
   var current = this;
   document.getElementById("stop").onclick = function() {
      current.results[current.hostLanguages[current.host]] = { total: current.totalCurrent, pass: current.totalCurrentPass};
      current.host = current.hostLanguages.length;
   }
   HTTP("GET","/tests/manifest.json",{
      onSuccess: function(status,doc,text) {
         current.manifest = JSON.parse(text);
         current.showMessage("");
         oncomplete();
      },
      onFailure: function(status,doc,text) {
         this.showMessage("Failed to load manifest, status "+status);
      }
   })
}

TestHarness.prototype._clear = function(e) {
   while (e.firstChild) {
      e.removeChild(e.firstChild);
   }
}

TestHarness.prototype.showMessage = function(msg) {
   this._clear(this.statusMessage);
   this.statusMessage.appendChild(document.createTextNode(msg));
}

TestHarness.prototype.start = function() {
   this.showMessage("Running tests...");
   this.results = {};
   this.totalCurrent = 0;
   this.totalCurrentPass = 0;
   this.hostLanguages = ["xhtml1", "xml"];
   this.skip = ["0109"];
   //this.hostLanguages = ["html5","xhtml5","xhtml1","xml"];
   this.host = 0;
   this.currentTest = -1;
   this.nextTest();
}

TestHarness.prototype.nextTest = function() {
   if (this.host<this.hostLanguages.length) {
      this.currentTest++;
      if (this.currentTest<this.manifest["@graph"].length) {
         this.runCurrentTest();
      } else {
         this.results[this.hostLanguages[this.host]] = { total: this.totalCurrent, pass: this.totalCurrentPass};
         this.host++;
         this.currentTest = -1;
         this.totalCurrent = 0;
         this.totalCurrentPass = 0;
         this.nextTest();
      }
   } else {
      var msg = "Finished: ";
      for (var host in this.results) {
         var item = this.results[host];
         msg += host+" ("+item.pass+"/"+item.total+") ";
      }
      this.showMessage(msg);
   }
}

TestHarness.prototype.parseHTML = function(markup) {
   var doc = document.implementation.createHTMLDocument("");
  
   doc.documentElement.innerHTML = markup; 
   var firstElement = doc.documentElement.firstElementChild;  
  
   doc.replaceChild(firstElement, doc.documentElement);  
   return doc;     
}

TestHarness.prototype.trim = function(str) {
   return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');   
}

TestHarness.prototype.runCurrentTest = function() {
   var testContext = {
      info: this.manifest["@graph"][this.currentTest],
      hostLanguage: this.hostLanguages[this.host]
   };
   for (var i=0; i<this.skip.length; i++) {
      if (testContext.info.num==this.skip[i]) {
         this.nextTest();
         return;
      }
   }
   var rdfa_1_1 = false;
   for (var i=0; !rdfa_1_1 && i<testContext.info.versions.length; i++) {
      if (testContext.info.versions[i]=="rdfa1.1") {
         rdfa_1_1 = true;
      }
   }
   if (!rdfa_1_1) {
      this.nextTest();
      return;
   }
   this.showMessage("Running test "+testContext.info.num+" for "+testContext.hostLanguage+" ...");
   var match = false;
   for (var i=0; !match && i<testContext.info.hostLanguages.length; i++) {
      if (testContext.info.hostLanguages[i]==testContext.hostLanguage) {
         match = true;
      }
   }
   if (!match) {
      this.nextTest();
      return;
   }
   var app = this;
   testContext.inputURL = "/tests/"+testContext.hostLanguage+"/"+testContext.info.num+"."+testContext.hostLanguage.replace(/\d+/,"");
   testContext.outputURL = "/tests/"+testContext.hostLanguage+"/"+testContext.info.num+".sparql";
   testContext.status = this.createTestResult(testContext);
   if (testContext.info.queryParam) {
      app.testResult(testContext,"success","SKIP","Skipped for queryParam "+testContext.info.queryParam);
      this.nextTest();
      return;
   }
   this.totalCurrent++;
   if (testContext.hostLanguage.indexOf("html")==0) {
      // html, use loader
      this.htmlLoader.onload = function() {
         testContext.doc = app.htmlLoader.contentDocument;
         setTimeout(function() {
            app.executeTest(testContext);
         },1);
      }
      this.htmlLoader.src = testContext.inputURL;
   } else {
      HTTP("GET",testContext.inputURL,{
         returnHeaders: true,
         onSuccess: function(status,doc,text,headers) {
            if (!doc) {
               var contentType = headers["Content-Type"];
               var semicolon = contentType.indexOf(";");
               if (semicolon>0) {
                  contentType = contentType.substring(0,semicolon);
               }
               contentType = app.trim(contentType);
               app.testResult(testContext,"fail","ERROR","Unsupported content type: "+contentType);
               setTimeout(function() { app.nextTest(); },1)
               return;
            }
            testContext.doc = doc;
            setTimeout(function() {
               app.executeTest(testContext);
            },1);
         },
         onFailure: function(status,doc,text) {
            app.testResult(testContext,"fail","ERROR","failed to retrieve document , status "+status);
            setTimeout(function() { app.nexTest(); },1);
         }
      });
   }
}

TestHarness.prototype.createTestResult = function(testContext) {
   var row = document.createElement("tr");
   var cell = document.createElement("td");
   cell.appendChild(document.createTextNode(testContext.hostLanguage));
   row.appendChild(cell);
   cell = document.createElement("td");
   cell.appendChild(document.createTextNode(testContext.info.num+" ("));
   var a = document.createElement("a");
   cell.appendChild(a);
   a.setAttribute("href",testContext.inputURL);
   a.appendChild(document.createTextNode("I"));
   cell.appendChild(document.createTextNode("/"));
   var a = document.createElement("a");
   cell.appendChild(a);
   a.setAttribute("href",testContext.outputURL);
   a.appendChild(document.createTextNode("O"));
   cell.appendChild(document.createTextNode(")"));
   row.appendChild(cell);
   cell = document.createElement("td");
   cell.appendChild(document.createTextNode("GET"));
   row.appendChild(cell);
   cell.className = "inprogress";
   cell = document.createElement("td");
   cell.appendChild(document.createTextNode(""));
   row.appendChild(cell);
   this.output.appendChild(row);
   return row;
}

TestHarness.prototype.testResult = function(testContext,className,status,message) {
   var statusCell = testContext.status.firstChild.nextSibling.nextSibling;
   var messageCell = statusCell.nextSibling;
   this._clear(statusCell);
   statusCell.appendChild(document.createTextNode(status));
   statusCell.className = className;
   this._clear(messageCell);
   messageCell.appendChild(document.createTextNode(message));
}

TestHarness.prototype.executeTest = function(testContext) {
   this.testResult(testContext,"inprogress","HARVESTING","Harvesting triples...");
   GreenTurtle.attach(testContext.doc);
   this.testResult(testContext,"inprogress","GET-COMPARISON","Getting output for comparison...");
   var app = this;
   HTTP("GET",testContext.outputURL,{
      onSuccess: function(status,doc,text) {
         setTimeout(function() { app.compareTest(testContext,text)},1);
      },
      onFailure: function(status,doc,text) {
         app.testResult(testContext,"fail","ERROR","Could not retrieve "+testContext.outputURL+", status "+status);
         setTimeout(function() { app.nexTest(); },1);
      }
   })
}

TestHarness.prototype.parseLiteral = function(line) {
   var quoteRE = /^"/;
   var quoteTextRE = /^([^"\\]+)/;
   var escapedBackslashRE = /^\\\\/;
   var escapedNewlineRE = /^\\n/;
   var escapedQuoteRE = /^\\"/;
   var martch = null;
   var literal = "";
   do {
      match = quoteRE.exec(line);
      if (match) {
         //console.log("Literal: \""+literal+"\"");
         line = line.substring(match[0].length);
         return {
            line: line,
            literal: literal
         }
      }
      match = quoteTextRE.exec(line);
      if (match) {
         literal += match[1];
         line = line.substring(match[0].length);
      } else {
         match = escapedQuoteRE.exec(line);
         if (match) {
             literal += "\"";
             line = line.substring(match[0].length);
         } else {
            match = escapedBackslashRE.exec(line);
            if (match) {
                literal += "\\";
                line = line.substring(match[0].length);
            } else {
               match = escapedNewlineRE.exec(line);
               if (match) {
                   literal += "\n";
                   line = line.substring(match[0].length);
               }
            }
         }
      }
   } while (match);
   return {
      line: line,
      literal: literal,
      error: "Bad end of quoted literal: "+line
   }
   
}


TestHarness.prototype.compareTest = function(testContext,sparql) {
   console.log("test: "+testContext.hostLanguage+"/"+testContext.info.num);
   
   var graph = {};
   var wsRE = /^\s+/;
   var uriRE = /^\<([^>]*)\>/;
   var quoteRE = /^"/;
   var multilineQuoteRE = /^"""/;
   var endMultilineQuoteRE = /"""/;
   var quoteTextRE = /^([^"]+)/;
   var escapedQuoteRE = /^\\"/;
   var tripleQuoteRE = /^""""/;
   var literalRE = /^"([^"]*)"/;
   var multilineRE = /^"""/;
   var typeRE = /^\^\^/;
   var dotRE = /^\./;
   var prefixRE = /^(\w+:)/;
   var curieRE = /^(\w+:)(\w+)/;
   var langRE = /^@(\w+)/;
   var prefixes = {};
   this.testResult(testContext,"inprogress","COMPARING","Parsing SPARQL");
   var lines = sparql.split(/\n/);
   var start = 0;
   var match = null;
   while (start<lines.length && lines[start].indexOf("ASK WHERE")<0) {
      if (lines[start].charAt(0)=="#") {
         start++;
         continue;
      }
      var prefixPos = lines[start].indexOf("PREFIX");
      if (prefixPos>=0) {
         var prefixLine = lines[start].substring(prefixPos+6);
         match = wsRE.exec(prefixLine);
         if (match) {
            prefixLine = prefixLine.substring(match[0].length);
         }
         match = prefixRE.exec(prefixLine);
         if (match) {
            var prefix = match[1];
            prefixLine = prefixLine.substring(match[0].length);
            match = wsRE.exec(prefixLine);
            if (match) {
               prefixLine = prefixLine.substring(match[0].length);
            }
            match = uriRE.exec(prefixLine);
            if (match) {
               prefixes[prefix] = match[1];
            }
         }
      }
      start++;
   }
   if (start==lines.length) {
      this.testResult(testContext,"fail","ERROR","Cannot parse SPARQL: "+sparql);
      this.nextTest();
      return;
   }
   var ok = true;
   for (var i=start+1; i<lines.length; i++) {
      if (lines[i].indexOf("}")>=0) {
         break;
      }
      if (lines[i].match(/\s*FILTER/)) {
         continue;
      }
      var line = lines[i];
      var subject = null;
      var predicate = null;
      var object = null;
      var type = null;
      var language = null;
      //console.log("Parsing: "+line);
      match = wsRE.exec(line);
      if (match) {
         line = line.substring(match[0].length);
      }
      match = uriRE.exec(line);
      if (match) {
         subject = match[1];
         line = line.substring(match[0].length);
      } else {
         match = curieRE.exec(line);
         if (match) {
            var base = prefixes[match[1]];
            if (base) {
               subject = base+match[2];
            } else {
               console.log("undefined prefix: "+match[1]);
               this.testResult(testContext,"fail","ERROR","Cannot parse statement (undefined prefix): "+line);
               ok = false;
               break;
            }
            line = line.substring(match[0].length);
         } else {
            console.log("bad subject: "+line);
            this.testResult(testContext,"fail","ERROR","Cannot parse statement (bad subject): "+line);
            ok = false;
            break;
         }
      }
      match = wsRE.exec(line);
      if (match) {
         line = line.substring(match[0].length);
      }
      match = uriRE.exec(line);
      if (match) {
         predicate = match[1];
         line = line.substring(match[0].length);
      } else {
         match = curieRE.exec(line);
         if (match) {
            var base = prefixes[match[1]];
            if (base) {
               predicate = base+match[2];
            } else {
               console.log("undefined prefix: "+match[1]);
               this.testResult(testContext,"fail","ERROR","Cannot parse statement (undefined prefix): "+line);
               ok = false;
               break;
            }
            line = line.substring(match[0].length);
         } else {
            console.log("bad predicate: "+line);
            this.testResult(testContext,"fail","ERROR","Cannot parse statement (bad predicate): "+line);
            ok = false;
            break;
         }
      }
      match = wsRE.exec(line);
      if (match) {
         line = line.substring(match[0].length);
      }
      match = uriRE.exec(line);
      if (match) {
         object = match[1];
         type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
         line = line.substring(match[0].length);
      } else {
         match = curieRE.exec(line);
         if (match) {
            var base = prefixes[match[1]];
            if (base) {
               object = base+match[2];
               type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
            } else {
               console.log("undefined prefix: "+match[1]);
               this.testResult(testContext,"fail","ERROR","Cannot parse statement (undefined prefix): "+line);
               ok = false;
               break;
            }
            line = line.substring(match[0].length);
         } else {
         /*
            match = literalRE.exec(line);
            if (match) {
               object = match[1];
               type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
               line = line.substring(match[0].length);
               */
            match = multilineQuoteRE.exec(line);
            if (match) {
               var literal = line.substring(match[0].length)+"\n";
               for (i++; i<lines.length; i++) {
                  line = lines[i];
                  match = endMultilineQuoteRE.exec(line);
                  if (match) {
                     literal += line.substring(0,match.index);
                     line = line.substring(match.index+match[0].length);
                     break;
                  } else {
                     literal += line + "\n";
                  }
               }
               //console.log("Literal: \"\"\""+literal+"\"\"\"");
               object = literal;
               type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
            } else {
               match = quoteRE.exec(line);
               if (match) {
                  line = line.substring(match[0].length);
                  var result = this.parseLiteral(line);
                  if (result.error) {
                     console.log("bad object, "+result.error);
                     this.testResult(testContext,"fail","ERROR","Cannot parse statement (bad object): "+result.error);
                     ok = false;
                     break;
                  } else {
                     line = result.line;
                     object = result.literal;
                     type = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
                  }
               } else {
                  console.log("bad object: "+line);
                  this.testResult(testContext,"fail","ERROR","Cannot parse statement (bad object): "+line);
                  ok = false;
                  break;
               }
            }
            match = typeRE.exec(line);
            if (match) {
               line = line.substring(match[0].length);
               match = uriRE.exec(line);
               if (match) {
                  type = match[1];
                  line = line.substring(match[0].length);
               } else {
                  match = curieRE.exec(line);
                  if (match) {
                     var base = prefixes[match[1]];
                     if (base) {
                        type = base+match[2];
                     } else {
                        console.log("undefined prefix: "+match[1]);
                        this.testResult(testContext,"fail","ERROR","Cannot parse statement (undefined prefix): "+line);
                        ok = false;
                        break;
                     }
                     line = line.substring(match[0].length);
                  } else {
                     console.log("bad object: "+line);
                     this.testResult(testContext,"fail","ERROR","Cannot parse statement (bad type on object): "+line);
                     ok = false;
                     break;
                  }
               }
            }
            match = langRE.exec(line);
            if (match) {
               line = line.substring(match[0].length);
               language = match[1];
            }
         }
      }
      match = wsRE.exec(line);
      if (match) {
         line = line.substring(match[0].length);
      }
      match = dotRE.exec(line);
      if (match) {
         line = line.substring(match[0].length);
         // hack for base problem
         /*
         subject = subject.replace("http://http://rdfa.info","http://localhost:8888");
         predicate = predicate.replace("http://http://rdfa.info","http://localhost:8888");
         if (type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#object") {
            object = object.replace("http://http://rdfa.info","http://localhost:8888");
         }*/
         //console.log("subject="+subject+", predicate="+predicate+", object="+object);
         var snode = graph[subject];
         if (!snode) {
            snode = { subject: subject, predicates: {}};
            graph[subject] = snode;
         }
         var pnode = snode.predicates[predicate];
         if (!pnode) {
            pnode = { predicate: predicate, objects: []};
            snode.predicates[predicate] = pnode;
         }
         pnode.objects.push({ type: type, value: object, language: language});
      } else {
         this.testResult(testContext,"fail","ERROR","Cannot parse statement (missing end .): "+line);
         ok = false;
         break;
      }
      
   }
   if (!ok) {
      this.nextTest();
      return;
   }
   this.testResult(testContext,"inprogress","COMPARING","Comparing triples..");
   
   var testGraph = testContext.doc.data.graph;
   for (var subject in graph) {
      var snode = graph[subject];
      var testSnode = testGraph.subjects[subject];
      if (!testSnode) {
         console.log("Missing subject: "+subject);
         ok = false;
         continue;
      }
      for (var predicate in snode.predicates) {
         var pnode = snode.predicates[predicate];
         var testPnode = testSnode.predicates[predicate];
         if (!testPnode) {
            console.log("Missing predicate "+predicate+" for subject "+subject);
            ok = false;
            continue;
         }
         for (var i=0; i<pnode.objects.length; i++) {
            var o = pnode.objects[i];
            var testO = null;
            for (var j=0; !testO && j<testPnode.objects.length; j++) {
               var value = testPnode.objects[j].value;
               if (testPnode.objects[j].type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral") {
                  var serializer = new XMLSerializer();
                  var xml = "";
                  for (var i=0; i<value.length; i++) {
                     xml = serializer.serializeToString(value[i]);
                  }
                  //console.log("Serialized: "+xml);
                  value = xml;
               }
               if (testPnode.objects[j].type==o.type && value==o.value) {
                  testO = testPnode.objects[j];
               }
            }
            if (!testO) {
               console.log("Missing object "+o.value+" for subject "+subject+" predicate "+predicate);
               ok = false;
            }
         }
         for (var i=0; i<testPnode.objects.length; i++) {
            var testO = testPnode.objects[i];
            var value = testO.value;
            if (testO.type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral") {
               var serializer = new XMLSerializer();
               var xml = "";
               for (var i=0; i<value.length; i++) {
                  xml = serializer.serializeToString(value[i]);
               }
               //console.log("Serialized: "+xml);
               value = xml;
            }
            var o = null;
            for (var j=0; !o && j<pnode.objects.length; j++) {
               if (pnode.objects[j].type==testO.type && pnode.objects[j].value==value) {
                  o = pnode.objects[j];
               }
            }
            if (!o) {
               console.log("Extra object "+value+" for subject "+subject+" predicate "+predicate);
               ok = false;
            }
         }
      }
      for (var predicate in testSnode.predicates) {
         var pnode = snode.predicates[predicate];
         if (!pnode) {
            console.log("Extra predicate "+predicate+" for subject "+subject);
            ok = false;
         }
         
      }
   }
   for (var subject in testGraph.subjects) {
      var snode = graph[subject];
      if (!snode) {
         console.log("Extra subject: "+subject);
         ok = false;
      }
   }
   if (testContext.info.expectedResults) {
      if (ok) {
         this.totalCurrentPass++;
         this.testResult(testContext,"success","PASS","");
      } else {
         this.testResult(testContext,"fail","FAIL","");
      }
   } else {
      if (ok) {
         this.testResult(testContext,"fail","FAIL","");
      } else {
         this.totalCurrentPass++;
         this.testResult(testContext,"success","PASS","");
      }
   }
   this.nextTest();
}
var harness = new TestHarness();