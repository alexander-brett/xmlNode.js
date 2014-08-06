# xmlNode.js

## Usage

```js
XMLString = "<food><name>French Toast</name><price>$4.50</price>"
  +"<description>Thick slices made from our homemade sourdough bread</description>"
  +"<calories>600</calories>"
  +"</food>";
  
XMLData = xmlNode(XMLString);

formattedString = XMLData.content;

newXMLString = "<food><name>French Toast</name><price>$4.50</price>"
  +"<detail>Thick slices made from our homemade sourdough bread</detail>"
  +"<calories>100</calories>"
  +"<options><option>Maple Syrup</option><option>Honey</option></options>"
  +"</food>";
  
XMLdiff = XMLData.diff(xmlNode(newXMLString));

rawDiffOutput = XMLdiff.toString();

XMLdiff.filter(["detail"]);

filteredXMLoutput = XMLdiff.toString();
```