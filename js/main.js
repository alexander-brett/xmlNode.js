$(function(){
  $("#diff").click(function(){
    oldData = xmlNode($("#left").text());
    newData = xmlNode($("#right").text());
    
    thediff = oldData.uidDiff(newData)
  
    $("#output").text(thediff.toString());
  })
});