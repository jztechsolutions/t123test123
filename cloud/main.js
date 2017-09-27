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
  if (!request.user) {    
    response.error("Access Denied - Unauthorized");
  }else{
    
    var userId = request.user.id;

    //Create new profile object
    let UserProfile = Parse.Object.extend("UserProfile");
    var userProfile = new UserProfile();
    userProfile.set("lastName",request.params.lastName);
    userProfile.set("firstName",request.params.firstName);
    userProfile.set("officePhone",request.params.officePhone);
    userProfile.set("cellPhone",request.params.cellPhone);
    userProfile.set("licenseNumb",request.params.licenseNumb);
    userProfile.set("gender",request.params.gender);
    userProfile.set("street",request.params.street);
    userProfile.set("city",request.params.city);
    userProfile.set("state",request.params.state);
    userProfile.set("zip",request.params.zip);
    userProfile.set("pri_spec",request.params.pri_spec);  
    userProfile.set("med_sch",request.params.med_sch);
    userProfile.set("grad_yr",request.params.grad_yr);
    userProfile.addUnique("myNetworksObjId",request.params.myNetworksObjId);

    userProfile.save(null, {
      success: function(newProfile) {
        // ONNECT THE NEW PROFILE WITH USERNAME        
        const currentUserQuery = new Parse.Query("_User");
        currentUserQuery.get(userId)
          .then(function(user){
            console.log("Start Logging..............................");
            user.set("userProfileObjI", newProfile);
            user.save(null, {useMasterKey: true})                      
          })
          .then(function(connectedUser){              
              response.success({"UserId":user.id,"UserProfileId":newProfile.id});
            })
          .catch(function(error){
            console.log("Catch..............................");
            //Delete the saved profile if can't connect with username
            Parse.Object.destroyAll(newProfile)
              .then(function(){
                response.error(error);
              })    
              .catch(function(error){            
                response.error(error);
              });        
          });        

        // console.log("Start Logging..............................");
        // console.log(newProfile);    
        // console.log(userProfile.id);    
        // console.log("End Logging..............................");

      },
      error: function(userProfile, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        response.error(error);
      }
    });
  }  
});


Parse.Cloud.define("RemoveProfileXXX", function(request, response){
  //Get userId who call this function from client side
  if (!request.user) {
    console.log("Invalid..............................");
    response.error("Access Denied - Unauthorized");
  }else{
    console.log("Valid..............................");
    var userId = request.user.id;
    
    const currentUserQuery = new Parse.Query("UserProfile");
        currentUserQuery.get(request.params.userProfileId)
          .then(function(userProfile){
              console.log(userProfile);
              Parse.Object.destroyAll(userProfile)
              .then(function(){
                response.success("Deleted");
              })            
              .catch(function(error){            
                response.error(error);
              });
          })
          .catch(function(error){            
            response.error(error);
          });
  }  
});