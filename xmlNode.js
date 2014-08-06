xmlNode = function (xmlString, identifiers, depth, parentID) {
  if(!(this instanceof xmlNode)){
    return new xmlNode(xmlString, identifiers, depth, parentID)
  }
  
    
  function repeat(x,n){
    //repeats a string, x, n times
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
  
  this.length = function() {
    //the length of a node will be defined by the number of children
    return Object.keys(this.children).length
  };

  var __construct = function (self) {
    if (xmlString) self.outerXML = (xmlString.indexOf("\n") == 0 ? "" : "\n") + repeat(" ",4*depth) + xmlString;
    
    if (x = self.outerXML.match(/<\?[\s\S]*\?>/)) self.declaration = x[0];
    
    //x = self.outerXML.match(/<(\w+)\/>/);
    //NB this tool can't handle self-closing tags yet
    
    if (x = self.outerXML.match(/<(\w+)([^>]*)>([\s\S]*?)<\/\1>/)) {
      self.tagName     = x[1];
      self.properties  = x[2];
      self.innerXML    = x[3];
      if(identifiers && Object.keys(identifiers).indexOf(self.tagName) > -1){
        self.identifiers = identifiers[self.tagName];
      }
    } else if ( x = self.outerXML.match(/<(\w+)([^>]*)\/>/)) {
      self.tagName     = x[1];
      self.properties  = x[2];
    }
    
    var matches = self.innerXML.match(/<(\w+)[^>]*>[\s\S]*?<\/\1>|<\w+\/>/g);
    if(matches){
      for (var i = 0; i < matches.length; i++) {
        var child = xmlNode(matches[i], self.identifiers,self.depth + 1);
        self.children[child.UID] = child;
      }
      self.childKeys = Object.keys(self.children).sort();
    }
    
    if(Object.keys(self.identifiers).indexOf("ID") > -1){
      self.UID = self.tagName;
      for (var i in self.identifiers.ID) {
        for (var j in self.childKeys){
          if (self.childKeys[j].indexOf(self.identifiers.ID[i]) > -1){
        self.UID += "." + self.childKeys[j];
          }
        }
      }
    } else if (self.length() == 0){
      self.UID = self.tagName + "." + self.innerXML;
    }
  }(this);
  
    

  

  this.diff = function (newNode) {
    /*
     * node.diff represents the difference between the current node and another node
     */
    console.log(node);
    
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
        return self.old.outerXML.replace(/\n/g,"\n ");
      } else if (self.status == status.added) {
        return self.new.outerXML.replace(/\n/g,"\n+");
      } else if (self.status == status.deleted) {
        return self.old.outerXML.replace(/\n/g,"\n-");
      } else if (self.status == status.modified) {
        return self.old.outerXML.replace(/\n/g,"\n-") 
          + self.new.outerXML.replace(/\n/g,"\n+");
      } else if (self.status == status.childrenModified) {
        var allKeys = Object.keys(self.children).sort(sortFunction);
        var output = self.old.declaration ? "\n " + self.old.declaration : "" ;
        output += "\n " + repeat("    ",self.old.depth) + "<" + self.tagName;
        if (self.old.properties) output += self.old.properties;
        output += ">";
        for (var i in allKeys) { output += self.children[allKeys[i]].toString(); }
        output += "\n "  + repeat("    ",self.old.depth) + "</" + self.tagName + ">";
        
        return output;
        
      } else { return ""; }
    }
  }
};