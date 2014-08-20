var testXMLParse = function (input, declaration, tagname, properties, innerXML, content, length, formatted) {
  var failures = [];
  var time = Date.now();
  var testNode = xmlNode(input);
  time = Date.now() - time;
  
  if (testNode.declaration != declaration)  failures.push("declaration");
  if (testNode.tagName != tagname)          failures.push("tagname");
  if (testNode.properties != properties)    failures.push("properties");
  if (testNode.children.length != length)   failures.push("length");
  if (testNode.content != content)          failures.push("content");
  if (testNode.innerXML != innerXML)        failures.push("innerXML");
  if (testNode.formatted() != formatted)    failures.push("formatted");
  
  return {
    "time":time, 
    "failures":failures
  };
};

var testUIDdiff = function (left, right, output, schema) {
  var time = Date.now();
  var result = xmlNode(left).uidDiff(schema, xmlNode(right)).toUnifiedDiff();
  time = Date.now() - time;
  
  return {
    "failures": (result == output ? false : ["FAIL"]),
    "time": time
  }
}

var testResults = {
  'XML Parsing': {
    'Empty node':   
      testXMLParse('','','','','', '', 0, ''),
    'Self closing tag':
      testXMLParse('<a/>','','a','','', '', 0, '<a/>'),
    'Self closing with properties':
      testXMLParse('<a b="c"/>', '', 'a', ' b="c"', '', '', 0, '<a b="c"/>'),
    'Empty tag collapses':
      testXMLParse('<a></a>', '', 'a', '', '', '', 0, '<a/>'),
    'Same tag nested':
      testXMLParse('<a><a></a></a>', '', 'a', '', '<a></a>', '', 1, '<a>\n  <a/>\n</a>'),
    'Same tag repeated':
      testXMLParse('<a><b></b><b></b></a>', '', 'a', '', '<b></b><b></b>', '', 2, '<a>\n  <b/>\n  <b/>\n</a>'),
    'Multiple tags with children':
      testXMLParse('<a><b><c/><d/></b><b><c/></b></a>', '', 'a', '', '<b><c/><d/></b><b><c/></b>', '', 2, '<a>\n  <b>\n    <c/>\n    <d/>\n  </b>\n  <b>\n    <c/>\n  </b>\n</a>'),
    'Same tag repeated with children':
      testXMLParse('<a><b><c>1</c></b><b><c>2</c></b></a>', '', 'a', '', '<b><c>1</c></b><b><c>2</c></b>', '', 2, '<a>\n  <b>\n    <c>1</c>\n  </b>\n  <b>\n    <c>2</c>\n  </b>\n</a>'),
    'Declaration':
      testXMLParse('<?xml?><a/>', '<?xml?>', 'a', '', '', '', 0, '<?xml?>\n<a/>'),
    'Single child':
      testXMLParse('<a><b/></a>', '', 'a', '', '<b/>', '', 1, '<a>\n  <b/>\n</a>'),
    'Content':
      testXMLParse('<a>aoeuidhtns</a>', '', 'a', '', '', 'aoeuidhtns', 0, '<a>aoeuidhtns</a>'),
    'Content is newline':
      testXMLParse('<a>\n</a>', '', 'a', '', '', '\n', 0, '<a>\n</a>'),
    'cData':
      testXMLParse('<a><![CDATA[<m></m><b></b></a>]]></a>', '', 'a', '', '', '<![CDATA[<m></m><b></b></a>]]>', 0, '<a><![CDATA[<m></m><b></b></a>]]></a>')
  },
  'UID Diff without schema: basic examples': {
    'Empty diff':
      testUIDdiff('', '', ''),
    'Unchanged simple node':
      testUIDdiff('<a/>', '<a/>', ' <a/>'),
    'Replace simple node':
      testUIDdiff('<a/>','<b/>','-<a/>\n+<b/>'),
    'Unchanged with declaration':
      testUIDdiff('<?xml?><a/>', '<?xml?><a/>', ' <?xml?>\n <a/>'),
    'Empty -> Simple node':
      testUIDdiff('', '<a/>', '+<a/>'),
    'Empty -> Nested node':
      testUIDdiff('', '<a><b/></a>', '+<a>\n+  <b/>\n+</a>'),
    'Nested node -> Empty':
      testUIDdiff('<a><b/></a>', '', '-<a>\n-  <b/>\n-</a>'),
    'Simple node -> Empty':
      testUIDdiff('<a/>', '', '-<a/>'),
    'Add content':
      testUIDdiff('<a/>', '<a>aoeu</a>', '-<a/>\n+<a>aoeu</a>'),
    'Replace content with cData':
      testUIDdiff('<a>aoeu</a>','<a><![CDATA[<m></m><b></b></a>]]></a>','-<a>aoeu</a>\n+<a><![CDATA[<m></m><b></b></a>]]></a>')
  },
  'UID diff with schema':{
    '':
      testUIDdiff('<a><b><c>1</c><d>2</d></b><b><c>2</c><d>3</d></b></a>')
  },
  "Known Limitations": {
    //any tests which are unlikely to be fixed live here
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
      resultDiv.append(testDiv);
      
      if (failures.length) {
        testDiv.addClass("failure");
        for (k=0; k<failures.length; k++)
          testDiv.append("<br/>").append($("<span/>").text(failures[k]));
      }
    }
  }
});
