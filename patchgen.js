function repeat(x,n){var s = '';for(;;){if(n&1)s+=x;n>>=1;if(n)x+=x;else break}return s}

xmlNode = function (xmlString, identifiers, depth) {
    var self         = this;
    self.outerXML    = "\n" + repeat("    ",depth) + xmlString;
    self.identifiers = {};
    self.children    = {};
    self.depth       = depth || 0;
    self.declaration = "";
    self.tagName     = "";
    self.innerXML    = "";
    self.properties  = "";
    self.UID         = "";
    self.indent      = "";
    self.length      = function () { return Object.keys(self.children).length };

    var __construct = function (self) {

	if (x = self.outerXML.match(/<\?[\s\S]*\?>/)) self.declaration = x[0];

	//x = self.outerXML.match(/<(\w+)\/>/);
	//NB this tool can't handle self-closing tags yet
	
	if (x = self.outerXML.match(/<(\w+)([^>]*)>([\s\S]*?)<\/\1>/)) {
	    self.tagName     = x[1];
	    self.properties  = x[2];
	    self.innerXML    = x[3];
	    if(Object.keys(identifiers).indexOf(self.tagName) > -1){
		self.identifiers = identifiers[self.tagName];
	    }
	} else if ( x = self.outerXML.match(/<(\w+)([^>]*)\/>/)) {
	    self.tagName     = x[1];
	    self.properties  = x[2];
	}

	for each(match in self.innerXML.match(/<(\w+)[^>]*>[\s\S]*?<\/\1>|<\w+\/>/g)) {
	    child = new xmlNode(match, self.identifiers,self.depth + 1);
	    self.children[child.UID] = child;
	}

	if(Object.keys(self.identifiers).indexOf("ID") > -1){
	    self.UID = self.tagName;
	    for each(UID in Object.keys(self.children)){
		if (self.identifiers.ID.indexOf(UID.slice(0,UID.indexOf("."))) > -1) self.UID += "." + UID;
	    }
	} else if (!self.identifiers.length){
	    self.UID = self.tagName + "." + self.innerXML;
	}
    }(this);

};

xmlDiff = function (oldNode, newNode) {
    var self      = this;
    self.UID      = (oldNode || newNode).UID;
    self.tagName  = (oldNode || newNode).tagName;
    self.old      = oldNode;
    self.new      = newNode;
    self.children = {};
    var status = { 
	"unchanged": 0,
	"added": 1,
	"deleted": 2,
	"modified": 4,
	"childrenModified": 8
    };

    var __construct = function(self){
	if (!oldNode && !newNode) { return false;
	} else if (oldNode && !newNode) { self.status = status.deleted;
	} else if (newNode && !oldNode) { self.status = status.added;
	} else if (oldNode.outerXML == newNode.outerXML) { self.status = status.unchanged;
	} else if (oldNode.properties == newNode.properties
		   && oldNode.declaration == newNode.declaration
		   && oldNode.length() > 0) {
	    self.status = status.childrenModified;
	    var keys = Object.keys(oldNode.children)
		.concat(Object.keys(newNode.children))
		.sort()
		.filter(function(e, i, array) {
		    return array.indexOf(e) == i;
		});	    
	    for each(k in keys){ 
		self.children[k] = new xmlDiff(oldNode.children[k],newNode.children[k]);
	    }
	} else {
	    self.status = status.modified;
	}
    }(this);


    self.toString = function(){
	if (self.status == status.unchanged) {
	    return self.old.outerXML.toString().replaceAll("\n","\n ");
	} else if (self.status == status.added) {
	    return self.new.outerXML.toString().toString().replaceAll("\n","\n+");
	} else if (self.status == status.deleted) {
	    return self.old.outerXML.toString().replaceAll("\n","\n-");
	} else if (self.status == status.modified) {
	    return self.old.outerXML.toString().replaceAll("\n","\n-") 
		+ self.new.outerXML.toString().replaceAll("\n","\n+");
	} else if (self.status == status.childrenModified) {
	    var output = "";
	    if(self.old.declaration) output += " " + self.old.declaration;
	    output += "\n " + repeat("    ",self.old.depth) + "<" + self.tagName;
	    if(self.old.properties)output += " " + self.old.properties;
	    output += ">";
	    for each (child in self.children) {
		output += child.toString();
	    }
	    output += "\n"  + repeat("    ",self.old.depth+1) + "</" + self.tagName + ">";
	    return output;
	}
    }

    self.filter = function(term){
	if (self.status == status.childrenModified) {
	    for each (child in self.children) {
		
	    }
	}
    }
}



identification = {
    "Profile":{
	"applicationVisibilities": { "ID": ["application"] },
	"classAccesses":           { "ID": ["apexClass"] },
	"fieldPermissions":        { "ID": ["field"] },
	"layoutAssignments":       { "ID": ["layout","recordType"] },
	"objectPermissions":       { "ID": ["object"] },
	"pageAccesses":            { "ID": ["apexPage"] },
	"recordTypeVisibilities":  { "ID": ["recordType"] },
	"tabVisibilities":         { "ID": ["tab"] },
	"userPermissions":         { "ID": ["name"] }
    }
}

f = "src/profiles/Admin.profile";
oldContent = $EXEC('git show HEAD:"Salesforce/'+f+'"');
newContent = $EXEC('cat "' + f + '"');
oldData = new xmlNode(oldContent, identification);
newData = new xmlNode(newContent, identification);
diff = new xmlDiff(oldData, newData);

print(diff.toString());
