// (C) 2008 Alex Milowski, atomojo.org

var _HTTP_HEADER_NAME = new RegExp("^([a-zA-Z0-9_-]+):");

function _HTTP_parseHeaders(headerText)
{
   var headers = {};
   if (headerText) {
      var eol = headerText.indexOf("\n");
      while (eol>=0) {
         var line = headerText.substring(0,eol);
         headerText = headerText.substring(eol+1);
         while (headerText.length>0 && !headerText.match(_HTTP_HEADER_NAME)) {
            eol = headerText.indexOf("\n");
            var nextLine = eol<0 ? headerText : headerText.substring(0,eol);
            line = line+' '+nextLine;
            headerText = eol<0 ? "" : headerText.substring(eol+1);
         }
         // Parse the name value pair
         var colon = line.indexOf(':');
         var name = line.substring(0,colon);
         var value = line.substring(colon+1);
         headers[name] = value;
         eol = headerText.indexOf("\n");
      }
      if (headerText.length>0) {
         var colon = headerText.indexOf(':');
         var name = headerText.substring(0,colon);
         var value = headerText.substring(colon+1);
         headers[name] = value;
      }
   }
   return headers;
}

/** 
 * The following keys can be sent:
 * onSuccess (required)  a function called when the response is 2xx
 * onFailure             a function called when the response is not 2xx
 * username              The username for basic auth
 * password              The password for basic auth
 * overrideMimeType      The mime type to use for non-XML response mime types
 * timeout               A timeout value in milliseconds for the response
 * onTimeout             A function to call if the request times out.
 * body                  A string containing the entity body of the request
 * contentType           The content type of the entity body of the request
 * headers               A hash of optional headers
 */
function HTTP(method,url,options)
{
      
   //alert(method+" "+url+" "+options.username);
   
   var requester = null;
   if (window.XMLHttpRequest) {
     requester = new XMLHttpRequest()
   } else if (window.ActiveXObject) {
     requester = new ActiveXObject("Microsoft.XMLHTTP")
  }

   var timeout = null;
   if (!options.synchronizedRequest) {

      requester.onreadystatechange = function() {
         if (requester.readyState==4) {
            if (timeout) {
               clearTimeout(timeout);
            }
            try {
               if (requester.status) {
               }
            } catch (ex) {
               if (options.onFailure) {
                  options.onFailure(
                     0,
                     null,
                     null,
                     null
                  );
               }
               return;
            }
            if (!requester.status || requester.status==0 || (requester.status>=200 && requester.status<300)) {
               if (options.onSuccess) {
                  options.onSuccess(
                     requester.status,
                     requester.responseXML,
                     requester.responseText,
                     options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
                  );
               }
            } else {
               if (options.onFailure) {
                  options.onFailure(
                     requester.status,
                     requester.responseXML,
                     requester.responseText,
                     options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
                  );
               }
            }
         }
      }
   }
   
   if (options.overrideMimeType && requester.overrideMimeType) {
      requester.overrideMimeType(options.overrideMimeType);
   }
   if (options.username) {
      requester.open(method,url,!options.synchronizedRequest,options.username,options.password);
   } else {
      requester.open(method,url,!options.synchronizedRequest);
   }
   if (options.timeout && !options.synchronizedRequest) {
      timeout = setTimeout(
          function() {
             var callback = options.onTimeout ? options.onTimeout : options.onFailure;
             callback(0,"Operation timeout.");
          },
          options.timeout
      );
   }
   if (options.headers) {
      for (var name in options.headers) {
         requester.setRequestHeader(name,options.headers[name]);
      }
   }
   if (options.body) {
      requester.setRequestHeader("Content-Type",options.contentType);
      requester.send(options.body);
   } else {
      requester.send(null);
   }
   if (options.synchronizedRequest) {
      if (requester.status==0 || (requester.status>=200 && requester.status<300)) {
         options.onSuccess(
            requester.status,
            requester.responseXML,
            requester.responseText,
            options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
         );
      } else {
         if (options.onFailure) {
            options.onFailure(
               requester.status,
               requester.responseXML,
               requester.responseText,
               options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
            );
         }
      }
      return {
         abort: function() {
         }
      };
   } else {
      return {
         abort: function() {
            clearTimeout(timeout);
            requester.abort();
         }
      };
   }
}


