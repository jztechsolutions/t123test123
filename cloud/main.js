Parse.Cloud.define('Hello', function(request, response) {
  response.success('Hello from BodyBookApps Team');
});

Parse.Cloud.define('SendEmail', function(request, response) {

  var mailgun = require('mailgun-js')({apiKey: 'key-77d43d079cb3f40d2c99d8da46a7c452', domain: 'bodybookapps.com'});
  
  var mail = {
                from: 'Mailgun@CloudCode.com',
                to: "huy.johnny@gmail.com",
                subject: "Hello from Cloud Code!",
                body: 'Using Parse and Mailgun is great!',
                html: "<b>Hello<b>"
            };

  mailgun.messages().send(mail, function (sendError, body) {
    if (sendError) {
      console.error(sendError);
      response.error("Uh oh, something went wrong");
    } else {
      response.success("Email sent!");
    }            
  });
});


Parse.Cloud.afterSave("Invitation", function(request) {
  var query = new Parse.Query("Networking");
  query.get(request.object.get("networkObjId").id)  
    .then(function(result){
      console.log("Start Logging..............................");
      console.log(result.get("specialitySettings"));    
      console.log(request.user);    
      console.log("End Logging..............................");
    })
    .catch(function(error){
      response.error(error);
    });    
});


Parse.Cloud.define("AddNewProfile", function(request, response){

});