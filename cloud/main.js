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
  const query = new Parse.Query("Networking");
  console.log("Start Logging..............................");
  console.log(request.object.get("networkObjId").id);
  // query.get(request.object.get("networking").id)
  //   .then(function(post) {
  //     post.increment("comments");
  //     return post.save();
  //   })
  //   .catch(function(error) {
  //     console.error("Got an error " + error.code + " : " + error.message);
  //   });
});