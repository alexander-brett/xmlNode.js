function repeat(x,n){var s = '';for(;;){if(n&1)s+=x;n>>=1;if(n)x+=x;else break}return s}

xmlNode = function (xmlString, identifiers, depth, parentID) {
    var self         = this;
    if(xmlString.indexOf("\n") == 0) self.outerXML = repeat("    ",depth) + xmlString;
    else self.outerXML = "\n" + repeat("    ",depth) + xmlString;
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
	} else if (self.length() == 0){
	    self.UID = self.tagName + "." + self.innerXML;
	}
    }(this);

};

xmlDiff = function (oldNode, newNode, filter) {
    var self      = this;
    self.UID      = (oldNode || newNode).UID;
    self.tagName  = (oldNode || newNode).tagName;
    self.old      = oldNode;
    self.new      = newNode;
    self.status   = 0;
    self.children = {};
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
		   && oldNode.length() > 0) {
	    self.status = status.childrenModified;
	    var keys = Object.keys(oldNode.children)
		.concat(Object.keys(newNode.children))
		.sort()
		.filter(function(e, i, array) {
		    return array.indexOf(e) == i;
		})
		.sort();
	    for each(k in keys){

		var oldChild, newChild;
		if ( Object.keys(oldNode.children).indexOf(k)<0 ) oldChild = false;
		else oldChild = oldNode.children[k];

		if ( Object.keys(newNode.children).indexOf(k)<0 ) newChild = false;
		else newChild = newNode.children[k];

		self.children[k] = new xmlDiff(oldChild,newChild);
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
	    if(self.old.declaration) output += "\n " + self.old.declaration;
	    output += "\n " + repeat("    ",self.old.depth) + "<" + self.tagName;
	    if(self.old.properties)output += self.old.properties;
	    output += ">";
	    for each (k in Object.keys(self.children).sort() ) {
		output += self.children[k].toString();
	    }
	    output += "\n "  + repeat("    ",self.old.depth) + "</" + self.tagName + ">";
	    return output;
	} else {return "";}
    }

    self.filter = function(term){
	if (self.status != status.unchanged 
	    && self.status != status.childrenModified
	    && self.UID.indexOf(term) == -1) {
	    if (self.status == status.added) self.status = status.ignore;
	    else {self.status = status.unchanged}
	}

	if (self.status == status.childrenModified) {
	    var unchanged = true;
	    for each (child in self.children) {
		child.filter(term);
		if (child.status != status.unchanged) unchanged = false; 
	    }
	    if (unchanged) { self.status = status.unchanged; }
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
    },
    "PermissionSet":{
	"applicationVisibilities": { "ID": ["application"] },
	"classAccesses":           { "ID": ["apexClass"] },
	"fieldPermissions":        { "ID": ["field"] },
	"layoutAssignments":       { "ID": ["layout","recordType"] },
	"objectPermissions":       { "ID": ["object"] },
	"pageAccesses":            { "ID": ["apexPage"] },
	"recordTypeVisibilities":  { "ID": ["recordType"] },
	"tabVisibilities":         { "ID": ["tab"] },
	"userPermissions":         { "ID": ["name"] }
    },
    "CustomObject":{
	"actionOverrides": {"ID": ["actionName"]},
	"fieldSets":       {
	    "ID": ["fullName"],
	    "displayedFields":{ "ID":["field"]}
	},
	"fields": {
	    "ID":["fullName"],
	    "picklist":{
		"picklistValues":{ "ID":["fullName"]}
	    }
	},
	"listViews": {"ID":["fullName"]}
    }
}

//f = "src/profiles/Admin.profile";
for each(f in `git diff --name-only --relative --ignore-space-change src/profiles/`.trim().split("\n")) {
	 //["src/profiles/Finance-Credit Controller.profile"]){//, "src/profiles/Admin.profile"]){
    oldContent = $EXEC('git show HEAD:"Salesforce/'+f+'"');
    newContent = $EXEC('cat "' + f + '"');
    oldData = new xmlNode(oldContent, identification);
    newData = new xmlNode(newContent, identification);
    diff = new xmlDiff(oldData, newData, "ActionPlanCreationController");
    diff.filter("ActionPlanCreationController");
    print("diff -u a/Salesforce/"+f+" b/Salesforce/"+f+"\n--- a/Salesforce/"+f+"\n+++ b/Salesforce/"+f+"\n@@ -1,0 +1,0 @@" + diff.toString());
    //print(Object.keys(diff.children).join("\n"));
}
