xmlNode = function (xmlData, depth) {

  /*
   * an object representing a node in an xml object. Has children indexed by their IDs,
   * as defined by the identifiers object argument
   */
   
  // regardless of how it was called, return an instance
  if (!(this instanceof xmlNode)) return new xmlNode(xmlData, depth);
  
  
  var repeat = function (x,n) { //repeats a string x n times, fast. Used for indentation.
    var s='';for(;;){if(n&1)s+=x;n>>=1;if(n)x+=x;else break}return s;
  }
  
  
  var node = this;

  this.outerXML    = "";
  this.children    = [];
  this.depth       = depth || 0;
  this.declaration = "";
  this.tagName     = "";
  this.innerXML    = "";
  this.properties  = "";
  this.indent      = "\n" + repeat("  ", this.depth);
  this.content     = "";
  
  //the following regex identifies xml components
  var xmlGlobalRegex = /(<\?[\s\S]*\?>\s*)?<(\w+)( [^>]*)?(?:\/>|>([\s\S]*)<\/\2>)/g;
  
  var __construct = function(){
    /*
     * Recursively build the xmlNode, based on parsing the outer xml, then parsing
     * the inner xml, each time passing an array of matches into the child constructor
     * in order to reduce the number of times the regex gets called.
     */
     
    var xmlArray;
    var matches;
    
    if (typeof xmlData === "string") {
      node.outerXML = "\n" + xmlData.trim();
      xmlArray = /(<\?[\s\S]*\?>)?\s*<(\w+)( [^>]*)?(?:\/>|>([\s\S]*)<\/\2>)/.exec(node.outerXML);
    } else if (xmlData) {
      node.outerXML = "\n" + xmlData[0];
      xmlArray = xmlData;
    }
    
    if (xmlArray && xmlArray.length == 5) {
      node.declaration = xmlArray[1] || "";
      node.tagName     = xmlArray[2] || "";
      node.properties  = xmlArray[3] || "";
      node.innerXML    = xmlArray[4] || "";
    }
    
    while (matches = xmlGlobalRegex.exec(node.innerXML)) {
        node.children.push(xmlNode(matches, node.depth+1));
    }
    
  }();

  node.formatted = function () {
    if (!node.tagName) return "";
      
    var output = (node.declaration ? node.indent + node.declaration : "")
      + node.indent + "<" + node.tagName + node.properties;
    
    if (node.innerXML) {
      output += ">";
      if ((l = node.children.length) > 0) {
        for (i=0; i<l; i++) output += node.children[i].formatted();
        output += node.indent;
      } else {
        output += node.innerXML;
      }
      output += "</" + node.tagName + ">";
    }else {
      output += "/>"
    }
    return output;
  };

};