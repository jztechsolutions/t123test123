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
  console.log("Start Logging..............................");
  // console.log(result.get("specialitySettings"));    
  console.log(request.user.id);    
  console.log("End Logging..............................");

  query.get(request.object.get("networkObjId").id)  
    .then(function(result){
      
    })
    .catch(function(error){
      response.error(error);
    });    
});


// ADD NEW PROFILE THEN CONNECT THE NEW PROFILE WITH USERNAME
// AFTER ADDING, CHECK THE FLAG IF THIS NEW USER CREATING NEW GROUP OR JOINING AN EXISTING GROUP
Parse.Cloud.define("AddNewProfile", function(request, response){
  //Get userId who call this function from client side
  var userId = request.user.id;

  //Create new profile object
  let UserProfile = Parse.Object.extend("UserProfile");
  var userProfile = new UserProfile();
  userProfile.set("lastName","TestLast");
  userProfile.set("firstName","TestFirst");
  userProfile.set("zip","00000");

  userProfile.save(null, {
    success: function(album) {
      // Execute any logic that should take place after the object is saved.
      console.log("Start Logging..............................");
      console.log(album);    
      console.log(UserProfile.id);    
      console.log("End Logging..............................");
    },
    error: function(userProfile, error) {
      // Execute any logic that should take place if the save fails.
      // error is a Parse.Error with an error code and message.
      response.error(error);
    }
  });
});