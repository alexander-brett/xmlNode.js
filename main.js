$(function(){
  $("#diff").click(function(){
    oldData = xmlNode($("#left").text());
    newData = xmlNode($("#right").text());
    
    thediff = oldData.diff(newData)
  
    $("#output").text(thediff.toString());
    
    console.log(thediff);
  })
});