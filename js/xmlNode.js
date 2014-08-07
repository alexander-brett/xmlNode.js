xmlNode = function (xmlData, identifiers, depth) {
  if(!(this instanceof xmlNode)){
    return new xmlNode(xmlData, identifiers, depth)
  }
  
    
  function repeat(x,n){
    //repeats a string x n times
    var s='';for (;;) {if(n&1)s+=x;n>>=1;if(n) x+=x;else break}return s;
  }

  /*
   * an object representing a node in an xml object. Has children indexed by their IDs,
   * as defined by the identifiers object argument
   */
   
  var node = this;

  this.outerXML    = "";
  this.identifiers = {};
  this.children    = {};
  this.childKeys   = [];
  this.depth       = depth || 0;
  this.declaration = "";
  this.tagName     = "";
  this.innerXML    = "";
  this.properties  = "";
  this.UID         = "";
  this.indent      = "";
  this.content     = "";
  
  //the following regex
  var xmlGlobalRegex = /(<\?[\s\S]*\?>\s*)?<(\w+)( [^>]*)?(?:\/>|>([\s\S]*)<\/\2>)/g;
  
  this.length = function() {
    //the length of a node will be defined by the number of children
    return Object.keys(this.children).length
  };
  
  var __construct = function(){
    var xmlArray;
    var matches;
    if (typeof xmlData === "string") {
      node.outerXML = "\n" + xmlData.trim();
      xmlArray = /(<\?[\s\S]*\?>\s*)?<(\w+)( [^>]*)?(?:\/>|>([\s\S]*)<\/\2>)/.exec(node.outerXML);
    } else if (xmlData) {
      node.outerXML = "\n" + xmlData[0];
      xmlArray = xmlData;
    }
    
    if (xmlArray && xmlArray.length == 5) {
      node.declaration = xmlArray[1] || "";
      node.tagName     = xmlArray[2] || "";
      node.properties  = xmlArray[3] || "";
      node.innerXML    = xmlArray[4] || "";
      if(identifiers && Object.keys(identifiers).indexOf(node.tagName) > -1){
        node.identifiers = identifiers[node.tagName];
      }
    }
    
    while (matches = xmlGlobalRegex.exec(node.innerXML)) {
        var child = xmlNode(matches, node.identifiers, node.depth + 1);
        node.children[child.UID] = child;
    }
    
    node.childKeys = Object.keys(node.children).sort();
    
    if(Object.keys(node.identifiers).indexOf("ID") > -1){
      node.UID = node.tagName;
      for (var i in node.identifiers.ID) {
        for (var j in node.childKeys){
          if (node.childKeys[j].indexOf(node.identifiers.ID[i]) > -1){
            node.UID += "." + node.childKeys[j];
          }
        }
      }
    } else /*0if (self.length() == 0)*/{
      node.UID = node.tagName + "." + node.innerXML;
    }
    
    node.content = function(){
      if((l = node.length())>0){
        var output = "\n" + node.declaration + "<" + node.tagName + node.properties + ">";
        for (i=0; i<l; i++) {
          output += node.children[node.childKeys[i]].content;
        }
        output += "\n</" + node.tagName + ">";
        return output;
      } else {
        return node.outerXML;
      }
    }();
  
  }();

  
};