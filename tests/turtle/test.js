var positiveSyntaxTest = "http://www.w3.org/ns/rdftest#TestTurtlePositiveSyntax";
var negativeSyntaxTest = "http://www.w3.org/ns/rdftest#TestTurtleNegativeSyntax";
var positiveEvalTest = "http://www.w3.org/ns/rdftest#TestTurtleEval";
var negativeEvalTest = "http://www.w3.org/ns/rdftest#TestTurtleNegativeEval";

function compareGraph(A,B,map)
{
   for (var subject in B) {
      if (!A[map.applyReverse(subject)]) {
         return false;
      }
   }
   for (var subject in A) {
      var snodeA = A[subject];
      var snodeB = B[map.applyForward(subject)];
      if (!snodeB) {
         return false;
      }
      for (var predicate in snodeB.predicates) {
         if (!snodeA.predicates[predicate]) {
            return false;
         }
      }
      for (var predicate in snodeA.predicates) {
         var predicateA = snodeA.predicates[predicate];
         var predicateB = snodeB.predicates[predicate];
         if (!predicateB) {
            return false;
         }
         if (predicateA.objects.length!=predicateB.objects.length) {
            return false;
         }
         for (var i=0; i<predicateA.objects.length; i++) {
            var value = predicateA.objects[i].value;
            if (predicateA.objects[i].type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#object") {
               value = map.applyForward(value);
            }
            if (value!=predicateB.objects[i].value) {
               return false;
            }
            if ((predicateA.objects[i].type || predicateB.objects[i].type) && predicateA.objects[i].type!=predicateB.objects[i].type) {
               return false;
            }
            if ((predicateA.objects[i].language || predicateB.objects[i].language) && predicateA.objects[i].language!=predicateB.objects[i].language) {
               return false;
            }
         }
      }
   }
   return true;
}

function dumpGraph(graph) {
   var s = "";
   var subjects = [];
   for (var subject in graph) {
      subjects.push(subject);
   }
   subjects.sort();
   for (var i=0; i<subjects.length; i++) {
      var snode = graph[subjects[i]];
      var predicates = [];
      var subjectStr = subjects[i].substring(0,2)=="_:" ? subjects[i]+"" : "<"+subjects[i]+">";
      for (var predicate in snode.predicates) {
         predicates.push(predicate);
      }
      predicates.sort();
      for (var j=0; j<predicates.length; j++) {
         var pnode = snode.predicates[predicates[j]];
         s += subjectStr+" "+pnode+" .\n";
      }
   }
   return s;
}

function test(entry) {
   var requester = new XMLHttpRequest();
   requester.open("GET",entry.action,false);
   requester.send(null);
   entry.shouldParse = entry.type!=negativeSyntaxTest;
   entry.passed = false;
   try {
      var baseURI = "http://www.w3.org/2013/TurtleTests/" + entry.action.substring(entry.action.lastIndexOf("/")+1);
      entry.output = document.data.implementation.parse(requester.responseText,"text/turtle",{ baseURI: baseURI});
      entry.parsed = true;
      if (entry.type==positiveSyntaxTest) {
         entry.passed = true;
      } else if (entry.type==positiveEvalTest) {
         requester = new XMLHttpRequest();
         requester.open("GET",entry.result,false);
         requester.send(null);
         try {
            var expected = document.data.implementation.parse(requester.responseText,"text/turtle",{ baseURI: baseURI});
            try {
               entry.passed = compareGraph(entry.output.subjects,expected.subjects,entry.subjectMap);
            } catch (ex) {
               console.log(ex.toString());
            }
            if (!entry.passed) {
               entry.output.expected = requester.responseText;
               entry.output.text = dumpGraph(entry.output.subjects);
            }
         } catch (ex) {
            entry.passed = false;
            console.log("ERROR: Cannot parse expected result: "+entry.result);
         }
      }
   } catch (ex) {
      entry.parsed = false;
      if (entry.type==negativeSyntaxTest || entry.type==negativeEvalTest) {
         entry.passed = true;
      } 
   }
}

function generateEARL(earlProlog,target,entries)
{
   var now = new Date();
   var dateStr = now.format("yyyy-mm-dd")
   var dateTimeStr = now.format("yyyy-mm-dd'T'HH:MM:sso")
   dateTimeStr = dateTimeStr.substring(0,dateTimeStr.length-2)+":"+dateTimeStr.substring(dateTimeStr.length-2);
   var requester = new XMLHttpRequest();
   requester.open("GET",earlProlog,false);
   requester.send(null);
   var parts = requester.responseText.split(/({date}|{dateTime})/);
   for (var i=0; i<parts.length; i++) {
      if (parts[i]=="{date}") {
         target.appendChild(document.createTextNode(dateStr));
      } else if (parts[i]=="{dateTime}") {
         target.appendChild(document.createTextNode(dateTimeStr));
      } else {
         target.appendChild(document.createTextNode(parts[i]));
      }
   }
   
   for (var i=0; i<entries.length; i++) {
      var subject = "http://www.w3.org/2013/TurtleTests/manifest.ttl"+entries[i].subject.substring(entries[i].subject.indexOf("#"));
      var s = "[ a earl:Assertion; \n\
  earl:assertedBy <http://www.milowski.com#alex>; \n\
  earl:subject <https://code.google.com/p/green-turtle/>; \n\
  earl:test <";
      s += subject +"> ;\n";
      s += "  earl:result [\n\
    a earl:TestResult; \n\
    earl:outcome ";
      s += entries[i].passed ? "earl:passed; \n" : "earl:failed; \n"
      s += "    dc:date \""+dateTimeStr+"\"^^xsd:dateTime ];\n"
      s += "  earl:mode earl:automatic ] .\n\n";
      target.appendChild(document.createTextNode(s));
   }
   // check report
   try {
      document.data.implementation.parse(target.textContent,"text/turtle", {baseURI: window.location.href});
   } catch (ex) {
      alert("EARL format is invalid.");
   }
}
window.addEventListener("load",function() {
   var table = document.getElementById("output");
   var child = document.head.firstElementChild;
   var manifestURI = null;
   var mappingsURI = null;
   var earlURI = null;
   while (child) {
      var rel = child.getAttribute("rel");
      if (rel=="manifest") {
         manifestURI = child.href;
      } else if (rel=="mappings") {
         mappingsURI = child.href;
      } else if (rel=="earl") {
         earlURI = child.href;
      }
      child = child.nextElementSibling;
   }
   console.log("Loading manifest from: "+manifestURI);
   var requester = new XMLHttpRequest();
   requester.open("GET",manifestURI,false);
   requester.send(null);
   var turtle = document.data.implementation.parse(requester.responseText,"text/turtle",{ baseURI: manifestURI});
   document.data.merge(turtle.subjects,{prefixes: turtle.prefixes, mergeBlankNodes: true});
   var manifestSubject = document.data.getSubjects("rdf:type","mf:Manifest")[0];
   //console.log("Manifest subject: "+manifestSubject);
   var currentSubject = document.data.getValues(manifestSubject,"mf:entries")[0];
   var entries = [];
   while (currentSubject!="http://www.w3.org/1999/02/22-rdf-syntax-ns#nil") {
      //console.log("Item subject: "+currentSubject);
      var entrySubject = document.data.getValues(currentSubject,"rdf:first")[0];
      //console.log("Entry: "+entrySubject);
      var entry = {
         subject: entrySubject,
         action: document.data.getValues(entrySubject,"mf:action")[0],
         type: document.data.getValues(entrySubject,"rdf:type")[0],
         name: document.data.getValues(entrySubject,"mf:name")[0],
         comment: document.data.getValues(entrySubject,"rdfs:comment")[0]
      };
      var results = document.data.getValues(entrySubject,"mf:result");
      if (results.length>0) {
         entry.result = results[0];
      }
      entries.push(entry);
      currentSubject = document.data.getValues(currentSubject,"rdf:rest")[0];
   }
   
   console.log("Loading mappings from "+mappingsURI);
   
   var requester = new XMLHttpRequest();
   requester.open("GET",mappingsURI,false);
   requester.send(null);
   var turtle = document.data.implementation.parse(requester.responseText,"text/turtle",{ baseURI: manifestURI});
   var mapData = document.data.implementation.createDocumentData(manifestURI);
   mapData.merge(turtle.subjects,{prefixes: turtle.prefixes, mergeBlankNodes: true});
   mapData.setMapping("rdf","http://www.w3.org/1999/02/22-rdf-syntax-ns#");
   //console.log(turtle.toString());
   for (var i=0; i<entries.length; i++) {
      var entry = entries[i];
      entry.subjectMap = { forward: {}, reverse: {} ,
         applyForward: function(s) {
            var mapped = this.forward[s];
            return mapped ? mapped : s;
         },
         applyReverse: function(s) {
            var mapped = this.reverse[s];
            return mapped ? mapped : s;
         }
      };
      var fromSubjects = mapData.getValues(entry.subject,"http://www.milowski.com/testing/from");
      var toSubjects = mapData.getValues(entry.subject,"http://www.milowski.com/testing/to");
      if (fromSubjects.length==0) {
         continue;
      }
      console.log("Loading subject map for "+entry.subject);
      var currentFromSubject = fromSubjects[0];
      var currentToSubject = toSubjects[0];
      while (currentFromSubject && currentFromSubject!="http://www.w3.org/1999/02/22-rdf-syntax-ns#nil") {
         var from = mapData.getValues(currentFromSubject,"rdf:first")[0];
         var to = mapData.getValues(currentToSubject,"rdf:first")[0];
         entry.subjectMap.forward[from] = to;
         entry.subjectMap.reverse[to] = from;
         console.log(from+" -> "+to);
         currentFromSubject = mapData.getValues(currentFromSubject,"rdf:rest")[0];
         currentToSubject = mapData.getValues(currentToSubject,"rdf:rest")[0];
      }
   }
   
   var success = 0;
   for (var i=0; i<entries.length; i++) {
      var entry = entries[i];
      console.log("Testing: "+entry.name+", "+entry.comment);
      test(entry);
      var row = document.createElement("tr");
      table.appendChild(row);
      var shortType = entry.type.substring(entry.type.indexOf("#")+1);
      row.innerHTML = "<td><a target=\"new\" href=\"parser.xhtml?"+entry.action+"\">"+entry.name+"</a></td><td>"+shortType+"</td><td class=\""+(entry.shouldParse ? entry.parsed ? "pass" : "fail" : entry.parsed ? "fail" : "pass")+"\">"+entry.parsed+"</td><td class=\""+(entry.passed ? "pass" : "fail")+"\">"+(entry.passed ? "pass" : "fail")+"</td><td></td>";
      if (entry.output && entry.output.expected) {
         var cell = row.cells[4];
         cell.innerHTML = "<pre/><p>versus</p><pre/>";
         cell.firstChild.appendChild(document.createTextNode(entry.output.text));
         cell.lastChild.appendChild(document.createTextNode(entry.output.expected));
      }
      if (entry.passed) {
         success++;
      }
   }
   document.getElementById("summary").innerHTML = success+"/"+entries.length+" passed";
   generateEARL(earlURI,document.getElementById("earl"),entries);
},false);