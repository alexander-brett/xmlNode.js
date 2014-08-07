$(function(){
  $("#diff").click(function(){
    oldData = xmlNode($("#old").text());
    newData = xmlNode($("#new").text());
    schema = (x=$("#schema").text()) ? JSON.parse(x) : false;
    
    thediff = oldData.uidDiff(
      schema,
      newData
    );
  
    $("#output").text(thediff.toUnifiedDiff());
  })
});