$(function(){
  $("#diff").click(function(){
    oldData = xmlNode($("#old").text());
    newData = xmlNode($("#new").text());
    
    thediff = oldData.uidDiff(
      JSON.parse($("#schema").text),
      newData
    );
  
    $("#output").text(thediff.toUnifiedDiff());
  })
});