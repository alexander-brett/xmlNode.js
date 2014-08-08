$(function(){
  $("#diff").click(function(){
    oldData = xmlNode($("#old").val());
    newData = xmlNode($("#new").val());
    schema = (x=$("#schema").val()) ? JSON.parse(x) : false;
    
    thediff = oldData.uidDiff(
      schema,
      newData
    );
  
    $("#output").text(thediff.toUnifiedDiff());
  });
});