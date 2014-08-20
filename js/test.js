var testXMLParse = function (input, declaration, tagname, properties, innerXML, content, length, formatted) {
  
  var time = Date.now();
  var testNode = xmlNode(input);
  var time = Date.now() - time;
  var failures = [];
  
  if (testNode.declaration != declaration)
    failures.push("declaration");
  if (testNode.tagName != tagname)
    failures.push("tagname");
  if (testNode.properties != properties)
    failures.push("properties");
  if (testNode.children.length != length)
    failures.push("length");
  if (testNode.content != content)
    failures.push("content");
  if (testNode.innerXML != innerXML)
    failures.push("innerXML");
  if (testNode.formatted() != formatted)
    failures.push("formatted");
  
  return {"time":time, "failures":failures};
};

var testUIDdiff = function (left, right, output) {
  var time = Date.now();
  var result = xmlNode(left).uidDiff(xmlNode(right)).toUnifiedDiff();
  var time = Date.now() - time;
  
  return {}
}

var testResults = {
  XMLParsing: {
    emptyNode:   
      testXMLParse('','','','','', '', 0, ''),
    selfClosingTagName:
      testXMLParse('<a/>','','a','','', '', 0, '<a/>'),
    selfClosingProperties:
      testXMLParse('<a b="c"/>', '', 'a', ' b="c"', '', '', 0, '<a b="c"/>'),
    emptyTag:
      testXMLParse('<a></a>', '', 'a', '', '', '', 0, '<a/>'),
    sameTagNested:
      testXMLParse('<a><a></a></a>', '', 'a', '', '<a></a>', '', 1, '<a>\n  <a/>\n</a>'),
    sameTagRepeated:
      testXMLParse('<a><b></b><b></b></a>', '', 'a', '', '<b></b><b></b>', '', 2, '<a>\n  <b/>\n  <b/>\n</a>'),
    declaration:
      testXMLParse('<?xml?><a/>', '<?xml?>', 'a', '', '', '', 0, '<?xml?>\n<a/>'),
    singleChild:
      testXMLParse('<a><b/></a>', '', 'a', '', '<b/>', '', 1, '<a>\n  <b/>\n</a>'),
    content:
      testXMLParse('<a>aoeuidhtns</a>', '', 'a', '', '', 'aoeuidhtns', 0, '<a>aoeuidhtns</a>'),
    cData:
      testXMLParse('<a><![CDATA[<m></m><b></b></a>]]></a>', '', 'a', '', '', '<![CDATA[<m></m><b></b></a>]]>', 0, '<a><![CDATA[<m></m><b></b></a>]]></a>')
  }
};

$(function(){
  var categories = Object.keys(testResults);
  for (i=0; i<categories.length; i++) {
    var categoryName = categories[i];
    var resultDiv = $("<div/>");
    resultDiv.append($("<h2/>").text(categoryName));
    $("body").append(resultDiv);
    var tests = Object.keys(testResults[categoryName]);
    
    for (j=0; j<tests.length; j++) {
      var testName = tests[j];
      var failures = testResults[categoryName][testName].failures;
      var time     = testResults[categoryName][testName].time;
      var testDiv = $("<span/>").addClass("testResults");
      testDiv.append($("<span/>").addClass("time").text(time)).append($("<h3/>").text(testName));
      resultDiv.append(testDiv).append("<br/>");
      
      if (failures.length) {
        testDiv.addClass("failure");
        for (k=0; k<failures.length; k++)
          testDiv.append($("<span/>").text(failures[k])).append("<br/>");
      }
    }
  }
});
