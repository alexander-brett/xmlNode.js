$(function(){
  $("#diff").click(function(){
    oldData = xmlNode($("#old").val());
    newData = xmlNode($("#new").val());
    var x = $("#schema").val();
    var schema = false;
    if (x) schema = JSON.parse(x);
    
    var thediff = oldData.uidDiff(
      schema,
      newData
    );
    
    console.log(thediff)
  
    $("#output").text(thediff.toUnifiedDiff());
  });
});