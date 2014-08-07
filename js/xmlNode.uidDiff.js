xmlNode.prototype.uidGen = function (schema) {
  /*
   * uidGen adds the UID, childUIDs, and childrenByUID attributes to the node.
   *
   * The UID is generated according to the schema, the children's UIDs are
   * enumerated in childUIDs, and childrenByUID maps UIDs to children.
   *
   * This function could be overridden provided those constraints held.
   */

  if (!this.UID) {
    
    this.UID = this.tagName;
    this.childUIDs = [];
    this.childrenByUID = {};
    
    if (schema && Object.keys(schema).indexOf(this.tagName) > -1) {
      schema = schema[node.tagName];
    }
    
    for (i=0; i<this.children.length; i++) {
      var UID = this.children[i].uidGen(schema);
      this.childrenByUID[UID] = this.children[i];
      this.childUIDs.push(UID);
    } 
    
    if(Object.keys(schema).indexOf("ID") > -1){
      for (var i in schema.ID) {
        for (var j in this.childUIDs) {
          if (this.childUIDs[j].indexOf(schema.ID[i]) > -1) {
            this.UID += "." + this.childUIDs[j];
          }
        }
      }
    } else {
      this.UID += "." + this.innerXML;
    }
  }
  
  return this.UID;
}

xmlNode.prototype.uidDiff = function (identifiers, newNode, oldNode) {
  /*
   * xmlNode.uidDiff represents the difference between the current node and another node.
   * The algorithm requires some way of assigning a unique identifier to each node.
   */
  
  if(this instanceof xmlNode) return new this.uidDiff(identifiers, newNode, (oldNode || this));
  
  var diff      = this;
  diff.old      = oldNode;
  diff.new      = newNode;
  diff.UID      = "";
  diff.tagName  = (diff.old || diff.new).tagName;
  diff.status   = 0;
  diff.children = {};
  
  var status = { 
    "ignore": 0,
    "unchanged": 1,
    "added": 2,
    "deleted": 4,
    "modified": 8,
    "childrenModified": 16
  };
  
  
  var __construct = function(){
    if (diff.old && !diff.new) {
      diff.status = status.deleted;
    } else if (diff.new && !diff.old) {
      diff.status = status.added;
    } else if (diff.old.formatted() == diff.new.formatted()) {
      diff.status = status.unchanged;
    } else if (
      diff.old.properties == diff.new.properties
      && diff.old.declaration == diff.new.declaration
      && diff.old.children.length > 0
      && diff.new.children.length > 0
    ) {
      diff.status = status.childrenModified;
      var keys = diff.old.childKeys.concat(diff.new.childKeys).filter(function(e, i, array) {
        return array.indexOf(e) == i;
      });
      for (var i in keys){
        var k = keys[i];
        var oldChild = diff.old.childKeys.indexOf(k) < 0 ? xmlNode() : diff.old.children[k];
        var newChild = diff.new.childKeys.indexOf(k) < 0 ? xmlNode() : diff.new.children[k];
        
        diff.children[k] = oldChild.uidDiff(newChild);
      }
    } else {
      diff.status = status.modified;
    }
  }();
  
  
  this.filter = function(terms){
    /*
     * filter the diff by an array of terms, such that only modifications,
     * additions, and deletions where the ID matches one of the terms are
     * considered
     */
    var matches = false;
    for (var i in terms) { if (diff.UID.indexOf(terms[i]) != -1) matches = true };
    if (diff.status != status.unchanged 
      && diff.status != status.childrenModified
      && !matches
    ) {
      if (diff.status == status.added) {
        diff.status = status.ignore;
      } else {
        diff.status = status.unchanged;
      }
    } else if (diff.status == status.childrenModified && !matches) {
      for (var i in diff.children) { diff.children[i].filter(terms); }
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
      
    if (diff.status == status.unchanged) {
      return diff.old.formatted().replace(/\n/g,"\n ");
    } else if (self.status == status.added) {
      return diff.new.formatted().replace(/\n/g,"\n+");
    } else if (diff.status == status.deleted) {
      return diff.old.formatted().replace(/\n/g,"\n-");
    } else if (diff.status == status.modified) {
      return diff.old.formatted().replace(/\n/g,"\n-") 
        + diff.new.formatted().replace(/\n/g,"\n+");
    } else if (diff.status == status.childrenModified) {
      var allKeys = Object.keys(diff.children).sort(sortFunction);
      var output = diff.old.declaration ? "\n " + diff.old.declaration : "" ;
      output += "\n <" + diff.tagName + diff.old.properties + ">";
      for (var i in allKeys) {
        output += diff.children[allKeys[i]].toString();
      }
      output += "\n </" + diff.tagName + ">";
      
      return output;
      
    } else { return ""; }
  }
};