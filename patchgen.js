//repeats a string n times, fast
function repeat(x,n){var s='';for(;;){if(n&1)s+=x;n>>=1;if(n)x+=x;else break}return s}

idData = JSON.parse(readFully("deployments/xmlmappings.json"));
Files = (`git diff --name-only --relative src/profiles/` 
	 + `git diff --name-only --relative src/permissionsets/`).split("\n");
l = Files.length;
for (var i in Files){
    var f = Files[i];
    if(!f) continue;
    oldContent = $EXEC('git show HEAD:"Salesforce/'+f+'"');
    newContent = readFully(f);

    oldData = new xmlNode(oldContent, idData);
    newData = new xmlNode(newContent, idData);

    diff = new xmlDiff(oldData, newData);
    diff.filter(arguments[0].split(','));

    if( (output = diff.toString()).trim() ) {
	print("diff -u a/Salesforce/" + f + " b/Salesforce/" + f
	      + "\n--- a/Salesforce/" + f
	      + "\n+++ b/Salesforce/" + f 
	      + "\n@@ -1,0 +1,0 @@" + output);
    }

    java.lang.System.err.print("\r" + i + " / " + l + "...");
}
