# Green Turtle

An RDFa 1.1 implementation in JavaScript for browsers.

Note: This project has transitioned from its former [Google Code project](http://code.google.com/p/green-turtle).

## Conformance

Green Turtle passes all the tests for XML, XHTML1, XHTML5, HTML4, and HTML5 as provided by the [RDFa WG](http://rdfa.info/test-suite/) except for the following notable issues:

 * [XML Test 0332](http://rdfa.info/test-suite/test-cases/rdfa1.1/xml/0332.xml) uses a bare `lang` attribute instead of an `xml:lang` attribute.  I believe this is a bug in the test.  Green Turtle does the right thing with respect to `xml:lang` attributes in XML and `lang` attributes in HTML.  A `lang` attribute in arbitrary XML has no special meaning.
 * [XHTML1 Test 0198](http://rdfa.info/test-suite/test-cases/rdfa1.1/xhtml1/0198.xhtml) and [XHTML5 Test 0198](http://rdfa.info/test-suite/test-cases/rdfa1.1/xhtml5/0198.xhtml) both have extra namespaces serialized in the XMLLiteral as expected output.  The input for the test cases does not have XML namespace attributes.  Instead, they use a `prefix` attribute to declare the prefixes used in the RDFa annotations.  Meanwhile, when the literal is serialized, they are not in the in-scope namespaces.  The RDFa specification says nothing about doing any kind of merging of prefixes and in-scope namespaces.  I believe these test cases are incorrect.  The correct serialization will not contain the `rdf:` and `foaf:` namespace declarations as they are not present in the source document.

I have submitted these issue to the working group for consideration.

## Test Suite

To run the tests yourself, you will need Java and Ant installed and then do the following:

1. Build Green Turtle by running [ant](http://ant.apache.org) in the root directory.
2. Cache the test cases:


    <pre>cd tests/harness
    ./make-cache.sh
    ./download-xml.sh
    ./download-xhtml1.sh
    ./download-xhtml5.sh
    ./download-html4.sh
    ./download-html5.sh
    </pre>


3. Run the server:

    <pre>../server/server.sh web.xml</pre>
    
4. Visit [http://localhost:8888/](http://localhost:8888/) in your browser.
5. Select the markup language from the drop-down list box and hit the 'Test' button.  The system will run the test cases rather silently unless you look at the console.  Eventually, it will output a table of the status of all the test cases.



