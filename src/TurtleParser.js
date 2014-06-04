TurtleParser.prototype = new URIResolver();
TurtleParser.prototype.constructor=TurtleParser;

function TurtleParser() {
   this.reset();
   this.onError = function(lineNumber,msg) {
      console.log(lineNumber+": "+msg);
   };
}

TurtleParser.commentRE = /^#.*/;
TurtleParser.wsRE = /^\s+/;
TurtleParser.iriRE = /^\<((?:(?:[^\x00-\x20<>"{}|^`\\]|\\u[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]|\\U[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])*))\>/;
TurtleParser.singleQuoteLiteralRE = /^'((?:[^'\n\r\\]*|\\'|\\)*)'/;
TurtleParser.doubleQuoteLiteralRE = /^\"((?:[^"\n\r\\]*|\\"|\\)*)\"/;
TurtleParser.longDoubleQuoteLiteralRE = /^\"\"\"((?:[^"\\]*|\\"|\\|\"(?!\")|\"\"(?!\"))*)\"\"\"/;
TurtleParser.longSingleQuoteLiteralRE = /^'''((?:[^'\\]*|\\'|\\|'(?!')|''(?!'))*)'''/;
TurtleParser.typeRE = /^\^\^/;
TurtleParser.dotRE = /^\./;
TurtleParser.openSquareBracketRE = /^\[/;
TurtleParser.closeSquareBracketRE = /^\]/;
// PN_CHARS_BASE
// [A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]
// [\ud800-\udfff][\ud800-\udfff] - surrogate pairs
// PN_CHARS_U
// [A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]
// [\ud800-\udfff][\ud800-\udfff] - surrogate pairs
// [_]
// PN_CHARS
// [A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]
// [_]
// [\-\u00B7]|[0-9]|[\u0300-\u036F]|[\u203F-\u2040]
TurtleParser.prefixRE = /^((?:(?:[A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\ud800-\udfff][\ud800-\udfff])(?:(?:[A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\ud800-\udfff][\ud800-\udfff]|[_\.\-\u00B7]|[0-9]|[\u0300-\u036F]|[\u203F-\u2040])*(?:[A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\ud800-\udfff][\ud800-\udfff]|[_\-\u00B7]|[0-9]|[\u0300-\u036F]|[\u203F-\u2040]))?)?):/;
TurtleParser.blankNodeRE = /^(_:)/;
TurtleParser.localNameRE = /^((?:[A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\ud800-\udfff][\ud800-\udfff]|[_:]|[0-9]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[_~\.\-!$&'()*+,;=\/?#@%])(?:(?:[A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\ud800-\udfff][\ud800-\udfff]|[_\-\.:\u00b7]|[\u0300-\u036F]|[\u203F-\u2040]|[0-9]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[_~\.\-!$&'()*+,;=/?#@%])*(?:[A-Z]|[a-z]|[\u00C0-\u00D6]|[\u00D8-\u00F6]|[\u00F8-\u02FF]|[\u0370-\u037D]|[\u037F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\ud800-\udfff][\ud800-\udfff]|[_\-:\u00b7]|[\u0300-\u036F]|[\u203F-\u2040]|[0-9]|%[0-9A-Fa-f][0-9A-Fa-f]|\\[_~\.\-!$&'()*+,;=/?#@%]))?)/;
TurtleParser.langRE = /^@([a-zA-Z]+(?:-[a-zA-Z0-9]+)*)/;
TurtleParser.prefixIDRE = /^@prefix/;
TurtleParser.baseRE = /^@base/;
TurtleParser.sparqlPrefixRE = /^[Pp][Rr][Ee][Ff][Ii][Xx]/;
TurtleParser.sparqlBaseRE = /^[Bb][Aa][Ss][Ee]/;
TurtleParser.semicolonRE = /^;/;
TurtleParser.commaRE = /^,/;
TurtleParser.aRE = /^a/;
TurtleParser.openParenRE = /^\(/;
TurtleParser.closeParenRE = /^\)/;
TurtleParser.integerRE = /^([+-]?[0-9]+)/;
TurtleParser.decimalRE = /^([+-]?[0-9]*\.[0-9]+)/;
TurtleParser.doubleRE = /^([+-]?(?:[0-9]+\.[0-9]*[eE][+-]?[0-9]+|\.[0-9]+[eE][+-]?[0-9]+|[0-9]+[eE][+-]?[0-9]+))/;
TurtleParser.booleanRE = /^(true|false)/;

TurtleParser.typeURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
TurtleParser.objectURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#object";
TurtleParser.plainLiteralURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral";
TurtleParser.nilURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil";
TurtleParser.firstURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#first";
TurtleParser.restURI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";
TurtleParser.xsdStringURI = "http://www.w3.org/2001/XMLSchema#string";
TurtleParser.xsdIntegerURI = "http://www.w3.org/2001/XMLSchema#integer";
TurtleParser.xsdDecimalURI = "http://www.w3.org/2001/XMLSchema#decimal";
TurtleParser.xsdDoubleURI = "http://www.w3.org/2001/XMLSchema#double";
TurtleParser.xsdBooleanURI = "http://www.w3.org/2001/XMLSchema#boolean";

TurtleParser.prototype.reset = function() {
   this.context = new RDFaGraph();
   this.errorCount = 0;
   this.lineNumber = 1;
}

TurtleParser.dumpGraph = function(graph) {
   for (var subject in graph) {
      var snode = graph[subject];
      console.log(snode.toString());
   }
}

TurtleParser.prototype._match = function(re,text) {
   var match = re.exec(text);
   return match ? { text: match[0], remaining: text.substring(match[0].length), values: match.length>1 ? match.splice(1) : null} : null;
}

TurtleParser.prototype._trim = function(text) {
   var match = null;
   do {
      match = TurtleParser.wsRE.exec(text);
      if (match) {
         this.lineNumber += (match[0].split(/\n/).length-1);
         text = text.substring(match[0].length);
      }
      match = TurtleParser.commentRE.exec(text);
      if (match) {
         text = text.substring(match[0].length);
      }
   } while (match);      
   return text;
}

TurtleParser.prototype.reportError = function(msg) {
   this.onError(this.lineNumber,msg);
}

TurtleParser.prototype.parse = function(text,baseURI) {
   if (baseURI) {
      this.context.baseURI = this.parseURI(baseURI);
   }
   while (text.length>0) {
      text = this._trim(text);
      if (text.length>0) {
        text = this.parseStatement(text);
      }
   }
}

TurtleParser.prototype.parseStatement = function(text) {
   var match = this._match(TurtleParser.prefixIDRE,text);
   if (match) {
      // prefix
      var remaining = this._trim(match.remaining);
      match = this.parsePrefixName(remaining);
      if (!match) {
         this.reportError("Cannot parse prefix after @prefix: "+text.substring(20)+"...");
         this.errorCount++;
         return remaining;
      }
      var prefix = match.prefix;
      
      remaining = this._trim(match.remaining);
      match = this.parseIRIReference(remaining);
      if (!match) {
         this.reportError("Cannot parse IRI after @prefix: "+remaining.substring(20)+"...");
         this.errorCount++;
         return remaining;
      }
      this.context.prefixes[prefix] = this.context.baseURI ? this.context.baseURI.resolve(match.iri) : match.iri;
      try {
         this.parseURI(this.context.prefixes[prefix]);
      } catch (ex) {
         this.reportError(ex.toString());
         this.errorCount++;
      }
      
      remaining = this._trim(match.remaining);
      match = this._match(TurtleParser.dotRE,remaining);
      if (match) {
         return match.remaining;
      } else {
         this.reportError("Missing end . for @prefix statement.  Found: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
   } 
   match = this._match(TurtleParser.baseRE,text);
   if (match) {
      // base
      var remaining = this._trim(match.remaining);
      match = this.parseIRIReference(remaining);
      if (!match) {
         this.reportError("Cannot parse IRI after @base: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
      try {
         this.context.baseURI = this.context.baseURI ? this.parseURI(this.context.baseURI.resolve(match.iri)) : this.parseURI(match.iri);
      } catch (ex) {
         this.reportError(ex+"; IRI: "+match.iri);
         this.errorCount++;
      }
      
      remaining = this._trim(match.remaining);
      match = this._match(TurtleParser.dotRE,remaining);
      if (match) {
         return match.remaining;
      } else {
         this.reportError("Missing end . for @base statement.  Found: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
   }
   match = this._match(TurtleParser.sparqlPrefixRE,text);
   if (match) {
      // sparql prefix
      var remaining = this._trim(match.remaining);
      match = this.parsePrefixName(remaining);
      if (!match) {
         this.reportError("Cannot parse prefix after PREFIX: "+text.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
      var prefix = match.prefix;
      
      remaining = this._trim(match.remaining);
      match = this.parseIRIReference(remaining);
      if (!match) {
         this.reportError("Cannot parse IRI after PREFIX: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
      this.context.prefixes[prefix] = this.context.baseURI ? this.context.baseURI.resolve(match.iri) : match.iri;
      try {
         this.parseURI(this.context.prefixes[prefix]);
      } catch (ex) {
         this.reportError(ex.toString());
         this.errorCount++;
      }
      return match.remaining;
   }
   match = this._match(TurtleParser.sparqlBaseRE,text);
   if (match) {
      // sparql base
      var remaining = this._trim(match.remaining);
      match = this.parseIRIReference(remaining);
      if (!match) {
         this.reportError("Cannot parse IRI after BASE: "+remaining.substring(0,20)+"...");
         this.errorCount++;
         return remaining;
      }
      try {
         this.context.baseURI = this.context.baseURI ? this.parseURI(this.context.baseURI.resolve(match.iri)) : this.parseURI(match.iri);
      } catch (ex) {
         this.reportError(ex+"; IRI: "+match.iri);
         this.errorCount++;
      }
      
      return match.remaining;      
   }
   
   // triples
   text = this.parseTriples(text);
   text = this._trim(text);
   match = this._match(TurtleParser.dotRE,text);
   if (match) {
      return match.remaining;
   } else {
      this.reportError("Missing end . triples.  Found: "+text.substring(0,20)+"...");
      this.errorCount++;
      return text;
   }
   
}

TurtleParser.prototype.parseTriples = function(text) {

   var match =  this.parseIRI(text);
   if (match) {
      return this.parsePredicateObjectList(match.iri,this._trim(match.remaining));
   }
   match = this.parseBlankNode(text);
   if (match) {
      return this.parsePredicateObjectList(match.iri,this._trim(match.remaining));
   }
   // collection as subject
   match = this._match(TurtleParser.openParenRE,text);
   if (match) {
      // collection
      var subject = null;
      var remaining = match.remaining;
      var currentSubject = null;
      do {
      
         remaining = this._trim(remaining);
         
         // try closing the collection
         match = this._match(TurtleParser.closeParenRE,remaining);
         if (match) {
            remaining = match.remaining;
            if (currentSubject) {
               this.addTriple(currentSubject,TurtleParser.restURI,{ type: TurtleParser.objectURI, value: TurtleParser.nilURI});
            } else {
               subject = this.context.newBlankNode();
            }
            break;
         }
         
         var nextSubject = this.context.newBlankNode();
         if (!currentSubject) {
            subject = nextSubject;
         } else {
            this.addTriple(currentSubject,TurtleParser.restURI,{ type: TurtleParser.objectURI, value: nextSubject});
         }
         currentSubject = nextSubject;
         remaining = this.parseObject(currentSubject,TurtleParser.firstURI,remaining);
      } while (remaining.length>0);
      
      return this.parsePredicateObjectList(subject,this._trim(remaining));
   }
   // blank node property list as subject
   match = this._match(TurtleParser.openSquareBracketRE,text);
   if (match) {
      var subject = this.context.newBlankNode();
      var remaining = this._trim(match.remaining);
      // test for empty node
      match = this._match(TurtleParser.closeSquareBracketRE,remaining);
      if (match) {
         remaining = match.remaining;
      } else {
         remaining = this.parsePredicateObjectList(subject,remaining);
         match = this._match(TurtleParser.closeSquareBracketRE,this._trim(remaining));
         if (match) {
            remaining = match.remaining;
         } else {
            this.reportError("Missing end square bracket ']'.");
         }
      }
      return this.parsePredicateObjectList(subject,this._trim(remaining),true);
   }
   
   if (!match) {
      // end the parse
      this.reportError("Terminating: Cannot parse at "+text.substring(0,20)+" ...");
      this.errorCount++;
      return "";
   }
   
   return this.parsePredicateObjectList(match.iri,this._trim(match.remaining));
}

TurtleParser.prototype.parsePredicateObjectList = function(subject,text,allowEmpty) {
   var more = true;
   var remaining = null;
   do {
      var match = this.parseIRI(text);
      if (!match) {
         match = this._match(TurtleParser.aRE,text);
         if (match) {
            match.iri = TurtleParser.typeURI;
         }
      }
      if (!match) {   
         if (allowEmpty) {
            return text;
         }
         this.reportError("Terminating: Cannot parse predicate IRI.");
         this.errorCount++;
         return "";
      }
      remaining = this.parseObjectList(subject,match.iri,this._trim(match.remaining));
      match = this._match(TurtleParser.semicolonRE,this._trim(remaining));
      if (match) {
         do {
            text = this._trim(match.remaining);
            match = this._match(TurtleParser.semicolonRE,text);
         } while (match);
         allowEmpty = true;
      } else {
         more = false;
      }
   } while (more);
   return remaining;
}

TurtleParser.prototype.parseObjectList = function(subject,predicate,text) {
   var more = true;
   var remaining = null;
   do {
      remaining = this.parseObject(subject,predicate,text);
      var match = this._match(TurtleParser.commaRE,this._trim(remaining));
      if (match) {
         text = this._trim(match.remaining);
      } else {
         more = false;
      }
   } while (more);
   return remaining;
}

TurtleParser.prototype.parseObject = function(subject,predicate,text) {
   var match =  this.parseIRI(text);
   if (match) {
      // object reference, generate triple
      this.addTriple(subject,predicate,{ type: TurtleParser.objectURI, value: match.iri});
      return match.remaining;
   }
   var match =  this.parseBlankNode(text);
   if (match) {
      // object reference, generate triple
      this.addTriple(subject,predicate,{ type: TurtleParser.objectURI, value: match.iri});
      return match.remaining;
   }
   match = this._match(TurtleParser.openParenRE,text);
   if (match) {
      // collection
      var collectionSubject = subject;
      var collectionPredicate = predicate;
      var remaining = match.remaining;
      do {
      
         remaining = this._trim(remaining);
         
         // try closing the collection
         match = this._match(TurtleParser.closeParenRE,remaining);
         if (match) {
            this.addTriple(collectionSubject,collectionSubject==subject ? predicate : TurtleParser.restURI,{ type: TurtleParser.objectURI, value: TurtleParser.nilURI});
            return match.remaining;
         }
         
         var nextSubject = this.context.newBlankNode();
         // there must be an object
         if (collectionSubject==subject) {
            this.addTriple(subject,predicate,{ type: TurtleParser.objectURI, value: nextSubject});
         } else {
            this.addTriple(collectionSubject,TurtleParser.restURI,{ type: TurtleParser.objectURI, value: nextSubject});
         }
         collectionSubject = nextSubject;
         collectionPredicate = TurtleParser.firstURI;
         remaining = this.parseObject(collectionSubject,collectionPredicate,remaining);
      } while (remaining.length>0);
   }
   match = this._match(TurtleParser.openSquareBracketRE,text);
   if (match) {
      var newSubject = this.context.newBlankNode();
      this.addTriple(subject,predicate,{ type: TurtleParser.objectURI, value: newSubject});
      var remaining = this.parsePredicateObjectList(newSubject,this._trim(match.remaining),true);
      remaining = this._trim(remaining);
      match = this._match(TurtleParser.closeSquareBracketRE,remaining);
      if (match) {
         return match.remaining;
      } else {
         this.reportError("Missing close square bracket ']' for blank node "+newSubject+" predicate object list");
         this.errorCount++;
         return remaining;
      }
   }
   var match = this.parseLiteral(text);
   if (match) {
      var value = match.literal;
      if (match.type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral") {
         var xml = "<root>"+match.literal+"</root>";
         var parser = new DOMParser();
         var doc = parser.parseFromString(xml,"application/xml");
         value = doc.documentElement.childNodes;
      } else if (match.type=="http://www.w3.org/1999/02/22-rdf-syntax-ns#HTML") {
         var xml = "<html><head/><body>"+match.literal+"</body></html>";
         var parser = new DOMParser();
         var doc = parser.parseFromString(xml,"text/html");
         value = doc.body.childNodes;
      }
      this.addTriple(subject,predicate,{ type: match.type ? match.type : TurtleParser.plainLiteralURI, value: value, language: match.language});
      return match.remaining;
   }
   this.reportError("Terminating: Cannot parse literal at "+text.substring(0,20));
   this.errorCount++;
   return "";
}

TurtleParser.prototype.parsePrefixName = function(text) {
   var match = this._match(TurtleParser.prefixRE,text);
   if (match) {
      match.prefix = match.values[0];
   }
   return match;
}

TurtleParser.prototype.parseIRIReference = function(text) {
   var match = this._match(TurtleParser.iriRE,text);
   if (match) {
      match.iri = TurtleParser.expandURI(match.values[0]);
   }
   return match;
}

TurtleParser.prototype.parseIRI = function(text) {
   var match = this._match(TurtleParser.iriRE,text);
   if (match) {
      var expanded = TurtleParser.expandURI(match.values[0]);
      match.iri = this.context.baseURI ? this.context.baseURI.resolve(expanded) : expanded;
      try {
         this.parseURI(match.iri);
      } catch (ex) {
         this.reportError(ex.toString());
         this.errorCount++;
      }
      return match;
   }
   match = this._match(TurtleParser.prefixRE,text);
   if (match) {
      var prefix = match.values[0];
      var ns = this.context.prefixes[prefix];
      if (!ns) {
         this.reportError("No prefix mapping for "+prefix);
         this.errorCount++;
         return null;
      }
      var remaining = match.remaining;
      match = this._match(TurtleParser.localNameRE,remaining);
      if (match) {
         match.iri = ns+TurtleParser.expandName(match.values[0]);
         try {
            this.parseURI(match.iri);
         } catch (ex) {
            this.reportError(ex.toString());
            this.errorCount++;
         }
         return match;
      } else {
         return { iri: ns, remaining: remaining };
      }
   }
   return null;
}

TurtleParser.prototype.parseBlankNode = function(text) {
   var match = this._match(TurtleParser.blankNodeRE,text);
   if (match) {
      var remaining = match.remaining;
      match = this._match(TurtleParser.localNameRE,remaining);
      if (match) {
         match.iri = "_:"+TurtleParser.expandName(match.values[0]);
         return match;
      } 
      return null;
   }
   return null;
}

TurtleParser.prototype.parseLiteral = function(text) {
   var match = this._match(TurtleParser.longDoubleQuoteLiteralRE,text);
   if (!match) {
      match = this._match(TurtleParser.longSingleQuoteLiteralRE,text);
   }
   if (!match) {
      match = this._match(TurtleParser.singleQuoteLiteralRE,text);
   }
   if (!match) {
      match = this._match(TurtleParser.doubleQuoteLiteralRE,text);
   }
   
   if (match) {
      var literal = null;
      try {
         literal = TurtleParser.expandLiteral(match.values[0]);
      } catch (ex) {
         this.reportError(ex.toString());
         this.errorCount++;
      }
      var remaining = match.remaining;
      match = this._match(TurtleParser.langRE,remaining);
      if (match) {
         match.literal = literal;
         match.language = match.values[0];
         return match;
      }
      match = this._match(TurtleParser.typeRE,remaining);
      if (match) {
         var remaining = match.remaining;
         match = this.parseIRI(remaining);
         if (match) {
            match.literal = literal;
            match.type = match.iri;
            return match;
         } else {
            this.reportError("Missing type URI after ^^");
            this.errorCount++;
            return { literal: literal, remaining: remaining}
         }
      }
      return { literal: literal, remaining: remaining};
   }
   
   match = this._match(TurtleParser.doubleRE,text);
   if (match) {
      match.literal = match.values[0];
      match.type = TurtleParser.xsdDoubleURI;
      return match;
   }
   
   match = this._match(TurtleParser.decimalRE,text);
   if (match) {
      match.literal = match.values[0];
      match.type = TurtleParser.xsdDecimalURI;
      return match;
   }
   match = this._match(TurtleParser.integerRE,text);
   if (match) {
      match.literal = match.values[0];
      match.type = TurtleParser.xsdIntegerURI;
      return match;
   }
   match = this._match(TurtleParser.booleanRE,text);
   if (match) {
      match.literal = match.values[0];
      match.type = TurtleParser.xsdBooleanURI;
      return match;
   }
   return null;
   
}

TurtleParser.prototype.newSubject = function(subject) {
   var snode = this.context.subjects[subject];
   if (!snode) {
      snode = new RDFaSubject(this.context,subject);
      this.context.subjects[subject] = snode;
   }
   return snode;
}

TurtleParser.expandHex = function(hex) {
   var check = hex.split(/[0-9A-Fa-f]+/);
   for (var j=0; j<check.length; j++) {
      if (check[j].length>0) {
         throw "Bad hex in escape: "+hex;
      }
   }
   var code = parseInt(hex,16);
   if (isNaN(code)) {
      throw "Bad hex in escape: "+hex;
   }
   if (code<0x10000) {
      return String.fromCharCode(code);
   } else {
      // Evil: generate surrogate pairs
      var n = code - 0x10000;
      var h = n >> 10;
      var l = n & 0x3ff;
      return String.fromCharCode(h + 0xd800) + String.fromCharCode(l + 0xdc00);
   }
}

TurtleParser.escapedSequenceRE = /(\\t|\\b|\\n|\\r|\\f|\\"|\\'|\\\\|(?:\\U[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])|(?:\\u[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]))/;

TurtleParser.expandLiteral = function(literal) {
   var parts = literal.split(TurtleParser.escapedSequenceRE);
   var s = "";
   for (var i=0; i<parts.length; i++) {
      if (parts[i].length==0) {
         continue;
      }
      if (parts[i]=="\\t") {
         s += "\t";
      } else if (parts[i]=="\\b") {
         s += "\b";
      } else if (parts[i]=="\\n") {
         s += "\n";
      } else if (parts[i]=="\\r") {
         s += "\r";
      } else if (parts[i]=="\\f") {
         s += "\f";
      } else if (parts[i]=="\\\"") {
         s += "\"";
      } else if (parts[i]=="\\'") {
         s += "'";
      } else if (parts[i]=="\\\\") {
         s += "\\";
      } else if (parts[i].length==6 && parts[i].charAt(0)== '\\' && parts[i].charAt(1)=="u") {
         s += TurtleParser.expandHex(parts[i].substring(2));
      } else if (parts[i].length==10 && parts[i].charAt(0)== '\\' && parts[i].charAt(1)=="U") {
         s += TurtleParser.expandHex(parts[i].substring(2));
      } else {
         var u = parts[i].substring(0,2);
         if (u.length==2 && u=="\\U") {
            throw "Bad hex in \\U escape "+parts[i].substring(0,10);
         } else if (u.length==2 && u=="\\u") {
            throw "Bad hex in \\u escape "+parts[i].substring(0,6);
         }
         var pos = parts[i].indexOf("\\");
         if (pos>=0) {
            throw "Bad escape "+parts[i].substring(pos,pos+2);
         }
         s += parts[i];
      }
   }
   return s;
}

TurtleParser.escapedURIRE = /((?:\\U[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])|(?:\\u[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]))/;

TurtleParser.expandURI = function(uri) {
   var parts = uri.split(TurtleParser.escapedURIRE);
   var s = "";
   for (var i=0; i<parts.length; i++) {
      if (parts[i].length==0) {
         continue;
      }
      if (parts[i].length==6 && parts[i].charAt(0)== '\\' && parts[i].charAt(1)=="u") {
         s += TurtleParser.expandHex(parts[i].substring(2));
      } else if (parts[i].length==10 && parts[i].charAt(0)== '\\' && parts[i].charAt(1)=="U") {
         s += TurtleParser.expandHex(parts[i].substring(2));
      } else {
         var u = parts[i].substring(0,2);
         if (u.length==2 && u=="\\U") {
            throw "Bad hex in \\U escape "+parts[i].substring(0,10);
         } else if (u.length==2 && u=="\\u") {
            throw "Bad hex in \\u escape "+parts[i].substring(0,6);
         }
         var pos = parts[i].indexOf("\\");
         if (pos>=0) {
            throw "Bad escape "+parts[i].substring(pos,pos+2);
         }
         s += parts[i];
      }
   }
   return s;
}

TurtleParser.escapedNameCharRE = /(\\[_~\.\-!$&'()*+,;=/?#@%])/;
TurtleParser.expandName = function(name) {
   var parts = name.split(TurtleParser.escapedNameCharRE);
   var s = "";
   for (var i=0; i<parts.length; i++) {
      if (parts[i].length==0) {
         continue;
      }
      if (parts[i].charAt(0)=="\\") {
         s += parts[i].charAt(1);
      } else {
         s += parts[i];
      } 
   }
   return s;
}


TurtleParser.prototype.addTriple = function(subject,predicate,object) {
   //console.log("Triple: "+subject+" "+predicate+" "+JSON.stringify(object));
   var snode = this.newSubject(subject);
   var pnode = snode.predicates[predicate];
   if (!pnode) {
      pnode = new RDFaPredicate(predicate);
      snode.predicates[predicate] = pnode;
   }
   pnode.objects.push(object);   
   if (predicate==TurtleParser.typeURI) {
      snode.types.push(object.value);
   }
}
