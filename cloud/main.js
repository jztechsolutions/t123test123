//Variables


//Functions
Parse.Cloud.define('Hello', function(request, response) {
  response.success('Hello from BodyBookApps Team');
});

// Parse.Cloud.define('SendEmail', function(request, response) {
function sendInvitationEmail(senderName,recieverName,emailSendTo)
{
  var mailgun = require('mailgun-js')({apiKey: 'key-77d43d079cb3f40d2c99d8da46a7c452', domain: 'bodybookapps.com'});

  var User = Parse.Object.extend('_User');
  var userQuery = new Parse.Query(User);  
  userQuery.equalTo('email', emailSendTo);
  userQuery.find({
    success: function(userRegister) {
      console.log("Start Logging..............................");
      console.log("userRegister")
      console.log("End Logging..............................");
    },
    error: function(err) {
      //TODO: Handle error
      console.log("Start Logging..............................");
      console.log("userRegister")
      console.log("End Logging..............................");
      console.error(err)
    }
  });

  var invitationTemplate = generateInvitationEmailNewUser(recieverName,senderName);

  var mail = {
                from: "CurbsideConsult@bodybookapps.com",
                to: emailSendTo,
                subject: "I would like to invite you to join my network at Curbside Consult.",
                body: "Invitation",
                html: invitationTemplate
            };

  mailgun.messages().send(mail, function (sendError, body) {
    if (sendError) {
      console.error(sendError);
      // response.error("Uh oh, something went wrong");
    }            
  });
}


Parse.Cloud.afterSave("Invitation", function(request) {
  // Send Email out
  sendInvitationEmail(request.object.get("inviter"),request.object.get("invitee"),request.object.get("email"));
  // console.log("Start Logging..............................");
  // console.log(request.object.get("email"));    
  // console.log(request.user.id);    
  // console.log("End Logging..............................");
  var query = new Parse.Query("Networking");
  query.get(request.object.get("networkObjId").id)  
    .then(function(result){
      //update pending count for the speciality in the group.
      
    })
    .catch(function(error){
      console.error(error);
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
            user.set("userProfileObjId", newProfile);
            user.save(null, {useMasterKey: true});            
            response.success({"UserId":user.id,"UserProfileId":newProfile.id});
          })          
          .catch(function(error){
            //Delete the saved profile if can't connect with username
            Parse.Object.destroyAll(newProfile)
              .then(function(){
                response.error("Internal Error");
              })    
              .catch(function(error){            
                response.error(error);
              });        
          });        

      },
      error: function(userProfile, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        response.error(error);
      }
    });
  }  
});

        // console.log("Start Logging..............................");
        // console.log(newProfile);    
        // console.log(userProfile.id);    
        // console.log("End Logging..............................");


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



Parse.Cloud.define('DestroyUserSessions', function(req, res) {
    //the user that sends the request
    var currentUser = req.user;
    //send from client 
    var currentUserInstallationId = req.param.installationId;
    var Session = Parse.Object.extend('Session');
    var userSessionQuery = new Parse.Query(Session);
    //all sessions of this user
    userSessionQuery.equalTo('user', currentUser);
    //except the session for this installation -> to not log the request performing user out
    userSessionQuery.notEqualTo('installationId', currentUserInstallationId);

    userSessionQuery.find({
        success: function(userSessionsToBeRevoked) {
            Parse.Object.destroyAll(userSessionsToBeRevoked, {
                success: function() {
                    //you have deleted all sessions except the one for the current installation
                    var installationIds = userSessionsToBeRevoked.map(function(session) {
                        return session.installationId;
                    }); 
                    //you can use the installation Ids to send push notifications to installations that are now logged out
                },
                error: function(err) {
                    //TODO: Handle error
                }
            });
        }, 
        error: function(err) {
            //TODO: Handle error
        }
    });
});






// Email template
function generateInvitationEmailNewUser() {
    var reciever = arguments[0];
    var sender  = arguments[1];

    var invitationEmail = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'+
'<html xmlns="http://www.w3.org/1999/xhtml" style="font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">'+
'<head>'+
'<meta name="viewport" content="width=device-width" />'+
'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'+
'<title>Confirm Your Account</title>'+
'<link href="//fonts.googleapis.com/css?family=Open+Sans:100&subset=latin" rel="stylesheet">'+
''+
'<style type="text/css">'+
'img {'+
'max-width: 100%;'+
'}'+
'body {'+
'-webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em;'+
'}'+
'body {'+
'background-color: #f6f6f6;'+
'}'+
'@media only screen and (max-width: 640px) {'+
'  body {'+
'    padding: 0 !important;'+
'  }'+
'  h1 {'+
'    font-weight: 800 !important; margin: 20px 0 5px !important;'+
'  }'+
'  h2 {'+
'    font-weight: 800 !important; margin: 20px 0 5px !important;'+
'  }'+
'  h3 {'+
'    font-weight: 800 !important; margin: 20px 0 5px !important;'+
'  }'+
'  h4 {'+
'    font-weight: 800 !important; margin: 20px 0 5px !important;'+
'  }'+
'  .container {'+
'    padding: 0 !important; width: 100% !important;'+
'  }'+
'  .content {'+
'    padding: 0 !important;'+
'  }'+
'  .content-wrap {'+
'    padding: 10px !important;'+
'  }'+
'  .invoice {'+
'    width: 100% !important;'+
'  }'+
'}'+
'</style>'+
'</head>'+
''+
'<body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">'+
'<table class="header-wrap" style="width: 100%;  background: url(http://ezmobiletech.com/img/pw_maze_black_2X.png) left top repeat; margin: 0; color:white;" ><tr style="font-family: \'Open Sans\'z; box-sizing: border-box; font-size: 14px; margin: 0;">'+
'		<td class="container" width="600" style="display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;  font-size: 30px; font-weight: 100;text-transform: uppercase; " valign="top">			'+
'       Curbside Consult'+
'		</td>	 '+
'	</tr></table>'+
'<table class="body-wrap" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6"><tr style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;"><td style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>'+
'		<td class="container" width="600" style="box-sizing: border-box; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">'+
'			<div class="content" style="box-sizing: border-box; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">'+
'				<table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction" style="background-color: #fff"><tr><td class="content-wrap" style="box-sizing: border-box; vertical-align: top; margin: 0; padding: 20px;" valign="top">'+
'							<meta itemprop="name" content="Confirm Email" /><table width="100%" cellpadding="0" cellspacing="0" ><tr>'+
'                                <td class="content-block">'+
'                    Dear '+reciever+',<br/><br/>I would like to invite to join my network at Curbside Consult.'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										As you might know, the curbside consult has been an age-old practice to share wisdom in healthcare. With Curbside Consult iPhone App, you can get virtual curbsides anywhere and anytime.<br/><br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										You can start by dowloading the app today and explore it.<br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										<a href="https://goo.gl/qYcjsh" class="btn-primary" itemprop="url" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #00b33c; margin: 0; border-color: #00b33c; border-style: solid; border-width: 10px 20px;">Downloading CurbsideConsult</a><br/><br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										Here is direct link to connect with my network. Note: You can click here after download the app and sign up.<br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										<a href="CurbsideConsult://" class="btn-primary" itemprop="url" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #00b33c; margin: 0; border-color: #00b33c; border-style: solid; border-width: 10px 20px;">Connect with '+sender+'</a><br/><br/>'+
'									</td>'+
'								</tr><tr><td class="content-block">'+
'                    Sincerely,<br/>'+sender+
'									</td>'+
'								</tr></table></td>'+
'					</tr></table><div class="footer" >'+
'					<table width="100%" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;"><tr style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;"><td class="aligncenter content-block" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;" align="center" valign="top">Visit Us <a href="http://bodybookapps.com/MigraineTracker.html" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">@Body Book Apps</a></td>'+
'						</tr></table></div></div>'+
'		</td>		'+
'	</tr></table></body>'+
'</html>';


    
    return invitationEmail;
}
	
function generateInvitationEmailExistingUser() {
    var reciever = arguments[0];
    var sender  = arguments[1];

    var invitationEmail = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'+
'<html xmlns="http://www.w3.org/1999/xhtml" style="font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">'+
'<head>'+
'<meta name="viewport" content="width=device-width" />'+
'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'+
'<title>Confirm Your Account</title>'+
'<link href="//fonts.googleapis.com/css?family=Open+Sans:100&subset=latin" rel="stylesheet">'+
''+
'<style type="text/css">'+
'img {'+
'max-width: 100%;'+
'}'+
'body {'+
'-webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em;'+
'}'+
'body {'+
'background-color: #f6f6f6;'+
'}'+
'@media only screen and (max-width: 640px) {'+
'  body {'+
'    padding: 0 !important;'+
'  }'+
'  h1 {'+
'    font-weight: 800 !important; margin: 20px 0 5px !important;'+
'  }'+
'  h2 {'+
'    font-weight: 800 !important; margin: 20px 0 5px !important;'+
'  }'+
'  h3 {'+
'    font-weight: 800 !important; margin: 20px 0 5px !important;'+
'  }'+
'  h4 {'+
'    font-weight: 800 !important; margin: 20px 0 5px !important;'+
'  }'+
'  .container {'+
'    padding: 0 !important; width: 100% !important;'+
'  }'+
'  .content {'+
'    padding: 0 !important;'+
'  }'+
'  .content-wrap {'+
'    padding: 10px !important;'+
'  }'+
'  .invoice {'+
'    width: 100% !important;'+
'  }'+
'}'+
'</style>'+
'</head>'+
''+
'<body itemscope itemtype="http://schema.org/EmailMessage" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">'+
'<table class="header-wrap" style="width: 100%;  background: url(http://ezmobiletech.com/img/pw_maze_black_2X.png) left top repeat; margin: 0; color:white;" ><tr style="font-family: \'Open Sans\'z; box-sizing: border-box; font-size: 14px; margin: 0;">'+
'		<td class="container" width="600" style="display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;  font-size: 30px; font-weight: 100;text-transform: uppercase; " valign="top">			'+
'       Curbside Consult'+
'		</td>	 '+
'	</tr></table>'+
'<table class="body-wrap" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6"><tr style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;"><td style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>'+
'		<td class="container" width="600" style="box-sizing: border-box; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">'+
'			<div class="content" style="box-sizing: border-box; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">'+
'				<table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope itemtype="http://schema.org/ConfirmAction" style="background-color: #fff"><tr><td class="content-wrap" style="box-sizing: border-box; vertical-align: top; margin: 0; padding: 20px;" valign="top">'+
'							<meta itemprop="name" content="Confirm Email" /><table width="100%" cellpadding="0" cellspacing="0" ><tr>'+
'                                <td class="content-block">'+
'                    Dear '+reciever+',<br/><br/>I would like to invite to join my network at Curbside Consult.'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										As you might know, the curbside consult has been an age-old practice to share wisdom in healthcare. With Curbside Consult iPhone App, you can get virtual curbsides anywhere and anytime.<br/><br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										You can start by dowloading the app today and explore it.<br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										<a href="https://goo.gl/qYcjsh" class="btn-primary" itemprop="url" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #00b33c; margin: 0; border-color: #00b33c; border-style: solid; border-width: 10px 20px;">Downloading CurbsideConsult</a><br/><br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										Here is direct link to connect with my network. Note: You can click here after download the app and sign up.<br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										<a href="CurbsideConsult://" class="btn-primary" itemprop="url" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #00b33c; margin: 0; border-color: #00b33c; border-style: solid; border-width: 10px 20px;">Connect with '+sender+'</a><br/><br/>'+
'									</td>'+
'								</tr><tr><td class="content-block">'+
'                    Sincerely,<br/>'+sender+
'									</td>'+
'								</tr></table></td>'+
'					</tr></table><div class="footer" >'+
'					<table width="100%" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;"><tr style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;"><td class="aligncenter content-block" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;" align="center" valign="top">Visit Us <a href="http://bodybookapps.com/MigraineTracker.html" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; color: #999; text-decoration: underline; margin: 0;">@Body Book Apps</a></td>'+
'						</tr></table></div></div>'+
'		</td>		'+
'	</tr></table></body>'+
'</html>';


    
    return invitationEmail;
}
	
