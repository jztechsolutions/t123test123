//Variables


//Functions
Parse.Cloud.define('Hello', function(request, response) {  
  response.success('Hello from BodyBookApps Team');
});

function sendInvitationSMS(senderName, recieverName, smsNumbSendTo, token)
{
  var invitationMSG  = recieverName + ", please join my Curbside Consult network.\nYou can start by downloading the app today and exploring it. https://goo.gl/qYcjsh";  

  var client = require('twilio')('AC4b51bbdcaae206f74fff39eee9549be6', '5af7ac55302d113a233db59953a0c215');

  client.api.messages
    .create({
      to: smsNumbSendTo, 
      from: '+19292003005 ', 
      body: invitationMSG
    }).then(function(responseData){
      console.log("Logging............SENT...............");
      console.log('SMS sent');
    }).catch(function(err){      
      console.error(err);      
    });
}

// Parse.Cloud.define('SendEmail', function(request, response) {
function sendInvitationEmail(senderName,recieverName,emailSendTo,token)
{
  var mailgun = require('mailgun-js')({apiKey: 'key-77d43d079cb3f40d2c99d8da46a7c452', domain: 'bodybookapps.com'});
  
  var invitationSubject  = "";
  var invitationTemplate = "";

  var userQuery = new Parse.Query(Parse.User);  
  userQuery.equalTo('email', emailSendTo);
  userQuery.count({
    success: function(userCount) {
      if (userCount > 0){
        invitationSubject  = recieverName + ", please join my Curbside Consult network.";
        invitationTemplate = generateInvitationEmailExistingUser(recieverName,senderName,token);
      }else{
        invitationSubject  = "I'd like to invite you to join my Curbside Consult network.";
        invitationTemplate = generateInvitationEmailNewUser(recieverName,senderName,token);
      }
      var mail = {
        from: "CurbsideConsult@bodybookapps.com",
        to: emailSendTo,
        subject: invitationSubject,
        body: "Invitation",
        html: invitationTemplate
      };

      mailgun.messages().send(mail, function (sendError, body) {
        if (sendError) {
          console.error(sendError);
          // response.error("Uh oh, something went wrong");          
        }            
      });

    },
    error: function(err) {      
      
      console.error(err)
    }
  });
}


Parse.Cloud.beforeSave("Invitation", function(request, response) {  

  var newSpecKey          = request.object.get("speciality"); 
  
  //Only count toward pending if its first time invite not resend
  var invitationOutCount  = request.object.get("invitationOutCount");

  var invitationStatus    = request.object.get("status");

  var preUpdatedSpecKey   = request.object.get("prevSpeciality");

  var preUpdatedSettingDict = {};


  //Get Network Obj from Invitation to update the counts
  var query = new Parse.Query("Networking");

  query.get(request.object.get("networkObjId").id)  
  
    .then(function(result){
      //update pending count for the speciality in the group.
      // The speciality that invitation for            
      //The settings of the speciality in Networking 
      //specialitySetting is dicitonary of dicitonary
      var settingDict = result.get("specialitySetting")[newSpecKey];


      //Brand new invitation-> update the pending count
      //Dont increase pending count when it resend email
      if (invitationOutCount == 1 && invitationStatus != "Accepted") {        
        settingDict["pending"] = settingDict["pending"]+1;
      }else if (invitationOutCount > 1) {
        /*When the email resent, check if the new spec is updated*/
        console.log("Logging............Resend...............");          
        if (newSpecKey != preUpdatedSpecKey) {
          //At this point we know that the spec was updated/changed
          //Thus we need to reduce pending count from the old spec            
          preUpdatedSettingDict = result.get("specialitySetting")[preUpdatedSpecKey];
          console.log(preUpdatedSettingDict);
          //Decrease pending count for the pre-updated spec            
          if (preUpdatedSettingDict["pending"] > 0) {
            console.log("Reset Pending");
            settingDict["pending"] = settingDict["pending"]+1;
            preUpdatedSettingDict["pending"] = preUpdatedSettingDict["pending"]-1;
          }                          
        }
      }

      if (settingDict["pending"] > (settingDict["total"]-settingDict["taken"])){
        response.error("The limit of number user in "+newSpecKey+ " has been exceeded. Please increase the limit or choose different speciality to add friend.");
      }else{
        // Update specialitySetting after update pending count
        let newSpecialitySettingDict = result.get("specialitySetting");        
        
        newSpecialitySettingDict[newSpecKey] = settingDict;
        if (preUpdatedSpecKey) {          
          newSpecialitySettingDict[preUpdatedSpecKey] = preUpdatedSettingDict;       
        }

        result.set("specialitySetting",newSpecialitySettingDict);

        result.save(null, {
          success: function() {              
            console.log("Logging............SAVED...............");
            //Just send out invitation email when inviting only not updating invitation status and open email track                     
             
            if (invitationStatus != "Accepted") {
              if (request.object.get("email")) {                
                sendInvitationEmail(request.object.get("inviter"),request.object.get("invitee"),request.object.get("email"),request.object.get("invitationCode"));
              }else if (request.object.get("cellPhone")){                
                sendInvitationSMS(request.object.get("inviter"),request.object.get("invitee"),request.object.get("cellPhone"),request.object.get("invitationCode"));
              }
            
            }
            response.success();            
          },
          error: function(userProfile, error) {
            console.log("Logging............FAIL TO SAVE...............");
            response.error(error);
          }
        });
        
      }
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

    //Check if the phone number is registered before 
    var userProfileQuery =  new Parse.Query("UserProfile");
    userProfileQuery.equalTo('cellPhone', request.params.cellPhone);
    userProfileQuery.count({
      success: function(userProfileCount) {
        if (userProfileCount > 0){          
          response.error("The entered cellphone:("+request.params.cellPhone+") has been registered in our system.");
        }else{
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
              // CONNECT THE NEW PROFILE WITH USERNAME        
              const currentUserQuery = new Parse.Query(Parse.User);
              currentUserQuery.get(userId)
              .then(function(user){
                user.set("userProfileObjId", newProfile);
                user.set("cellPhone",request.params.cellPhone);
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
      },error: function(err) {                    
        console.error(err)
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
    var sender   = arguments[1];
    var token    = arguments[2];

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
'                    Dear '+reciever+',<br/><br/>I would like to invite you to join my network at Curbside Consult.'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										As you know, the "curbside consult" is an age-old practice to share wisdom in healthcare. With the Curbside Consult iPhone App, you can get virtual curbsides anywhere and anytime!<br/><br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										You can start by downloading the app today and exploring it.<br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										<a href="https://goo.gl/qYcjsh" class="btn-primary" itemprop="url" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #00b33c; margin: 0; border-color: #00b33c; border-style: solid; border-width: 10px 20px;">Download & Register</a><br/><br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										Here is a direct link to connect with my network. Note: You can click here after downloading the app and signing up.<br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										<a href="CurbsideConsult://invitationCode=$='+token+'" class="btn-primary" itemprop="url" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #00b33c; margin: 0; border-color: #00b33c; border-style: solid; border-width: 10px 20px;">Connect with '+sender+'</a><br/><br/>'+
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
    var sender   = arguments[1];
    var token    = arguments[2];

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
'                    Hi '+reciever+',<br/><br/>I would like to invite you to join my network at Curbside Consult.<br/>'+
'									</td>'+
'								</tr><tr><td class="content-block" >'+
'										<a href="CurbsideConsult://invitationCode=$='+token+'" class="btn-primary" itemprop="url" style="font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #00b33c; margin: 0; border-color: #00b33c; border-style: solid; border-width: 10px 20px;">Connect with '+sender+'</a><br/><br/>'+
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
	
