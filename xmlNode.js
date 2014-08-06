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

  this.diff = function (newNode) {
    /*
     * node.diff represents the difference between the current node and another node
     */
    
    if(!(this instanceof node.diff)) return new node.diff(newNode);
    
    var oldNode   = node;
    var self      = this;
    this.UID      = (oldNode || newNode).UID;
    this.tagName  = (oldNode || newNode).tagName;
    this.old      = oldNode;
    this.new      = newNode;
    this.status   = 0;
    this.children = {};
    
    var status = { 
      "ignore": 0,
      "unchanged": 1,
      "added": 2,
      "deleted": 4,
      "modified": 8,
      "childrenModified": 16
    };
    
    
    var __construct = function(self){
      if (oldNode && !newNode) {
        self.status = status.deleted;
      } else if (newNode && !oldNode) {
        self.status = status.added;
      } else if (oldNode.outerXML == newNode.outerXML) {
        self.status = status.unchanged;
      } else if (oldNode.properties == newNode.properties
        && oldNode.declaration == newNode.declaration
        && oldNode.length() > 0
      ) {
        self.status = status.childrenModified;
        var keys = oldNode.childKeys.concat(newNode.childKeys).filter(function(e, i, array) {
          return array.indexOf(e) == i;
        });
        for (var i in keys){
          var k = keys[i];
          var oldChild = oldNode.childKeys.indexOf(k)<0 ? xmlNode() : oldNode.children[k];
          var newChild = newNode.childKeys.indexOf(k)<0 ? xmlNode() : newNode.children[k];
          
          self.children[k] = oldChild.diff(newChild);
        }
      } else {
        self.status = status.modified;
      }
    }(this);
    
    
    this.filter = function(terms){
      /*
       * filter the diff by an array of terms, such that only modifications,
       * additions, and deletions where the ID matches one of the terms are
       * considered
       */
      var matches = false;
      for (var i in terms) { if (self.UID.indexOf(terms[i]) != -1) matches = true };
      if (self.status != status.unchanged 
        && self.status != status.childrenModified
        && !matches
      ) {
        if (self.status == status.added) {
          self.status = status.ignore;
        } else {
          self.status = status.unchanged;
        }
      } else if (self.status == status.childrenModified && !matches) {
        for (var i in self.children) { self.children[i].filter(terms); }
      }
    }
    
    
    this.toString = function(sortFunction){
      /*
       * Return a string which is a valid diff of the XML files, with + prepended
       * to added elements, and - prepended to removed elements.
       * If sortFunction is provided, elements will be sorted using that function.
       */
       
      if(! sortFunction) {
        sortFunction = function(a,b){
          /*
           * this sort function mimics the way that Salesforce.com XML files are
           * sorted.
           */
          if (
            //sort IP addresses sensibly
            (aIP = a.match(/\.(\d+)\.(\d+)\.(\d+)\.(\d+)$/)) 
            && (bIP = b.match(/\.(\d+)\.(\d+)\.(\d+)\.(\d+)$/))
          ) {
            return (aIP[1]*0x1000000 + aIP[2]*0x10000 + aIP[3]*0x100 + aIP[4]*1) 
            - (bIP[1]*0x1000000 + bIP[2]*0x10000 + bIP[3]*0x100 + bIP[4]*1);
          } else {
            //sort, ignoring spaces
            return a.replace(/ /g,"") > b.replace(/ /g,"") ? 1 : -1;
          }
        }
      }
        
      if (self.status == status.unchanged) {
        return self.old.content.replace(/\n/g,"\n ");
      } else if (self.status == status.added) {
        return self.new.content.replace(/\n/g,"\n+");
      } else if (self.status == status.deleted) {
        return self.old.content.replace(/\n/g,"\n-");
      } else if (self.status == status.modified) {
        return self.old.content.replace(/\n/g,"\n-") 
          + self.new.content.replace(/\n/g,"\n+");
      } else if (self.status == status.childrenModified) {
        var allKeys = Object.keys(self.children).sort(sortFunction);
        var output = self.old.declaration ? "\n " + self.old.declaration : "" ;
        output += "\n <" + self.tagName + self.old.properties + ">";
        for (var i in allKeys) {
          output += self.children[allKeys[i]].toString();
        }
        output += "\n </" + self.tagName + ">";
        
        return output;
        
      } else { return ""; }
    }
  }
};