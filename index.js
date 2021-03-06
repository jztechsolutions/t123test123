var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var FSFilesAdapter = require('parse-server-fs-adapter');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://BodyBookApps_admin:B0dyb00kApps@ds023000.mlab.com:23000/curbside_consult',
  cloud: process.env.CLOUD_CODE_MAIN || './cloud/main.js',
  appId: process.env.APP_ID || 'CurbsideConsult',
  masterKey: process.env.MASTER_KEY || 'CurbsideConsult-G6ZtgCr3efVhtMCR7XTGhEFAOYcAycsGT3aWIcCv', //Add your master key here. Keep it secret!  
  serverURL: process.env.SERVER_URL || 'https://curbsideconsult.herokuapp.com/parse',//'http://localhost:1337/parse',  // Don't forget to change to https if needed
 
  // Disable Anonymous Users 
  enableAnonymousUsers: false,

  // Enable email verification 
  verifyUserEmails: true,
 
  // if `verifyUserEmails` is `true` and 
  //     if `emailVerifyTokenValidityDuration` is `undefined` then 
  //        email verify token never expires 
  //     else 
  //        email verify token expires after `emailVerifyTokenValidityDuration` 
  // 
  // `emailVerifyTokenValidityDuration` defaults to `undefined` 
  // 
  // email verify token below expires in 2 hours (= 2 * 60 * 60 == 7200 seconds) 
  emailVerifyTokenValidityDuration: 5 * 60 * 60, // in seconds (2 hours = 7200 seconds) 
 
  // set preventLoginWithUnverifiedEmail to false to allow user to login without verifying their email 
  // set preventLoginWithUnverifiedEmail to true to prevent user from login if their email is not verified 
  preventLoginWithUnverifiedEmail: false, // defaults to false 
 
  // The public URL of your app. 
  // This will appear in the link that is used to verify email addresses and reset passwords. 
  // Set the mount path as it is in serverURL 
  publicServerURL: 'https://curbsideconsult.herokuapp.com/parse', //'http://localhost:1337/parse',//
  // Your apps name. This will appear in the subject and body of the emails that are sent. 
  appName: 'Curbside Consult',
  // The email adapter 
  emailAdapter:{
    // module: 'parse-server-simple-mailgun-adapter',
    module: 'parse-server-mailgun',
    options: {
      // The address that your emails come from 
      fromAddress: 'Curbside Consult<no-reply-MigraineTracker@bodybookapps.com>',
      // Your domain from mailgun.com 
      domain: 'bodybookapps.com',
      // Your API key from mailgun.com 
      apiKey: 'key-77d43d079cb3f40d2c99d8da46a7c452',
      templates: {
        passwordResetEmail: {
          subject: 'Password Reset Request for CurbsideConsult',
          pathPlainText: path.join(__dirname, '/public/email-templates/password_reset.txt'),
          pathHtml: path.join(__dirname, '/public/email-templates/password_reset.html'),
          callback: (user) => { return { email: user.get('email') }}
          // Now you can use {{firstName}} in your templates
        },
        verificationEmail: {
          subject: 'Please verify your email for CurbsideConsult',
          pathPlainText: path.join(__dirname, '/public/email-templates/verification.txt'),
          pathHtml: path.join(__dirname, '/public/email-templates/verification.html'),
          callback: (user) => { return { email: user.get('email') }}
          // Now you can use {{firstName}} in your templates
        }        
      }
    }
  },

  customPages: {
    invalidLink: 'http://ezmobiletech.com/Users/CC/invalid_link.html',
    verifyEmailSuccess: 'http://ezmobiletech.com/Users/CC/verify_email_success_redirect.html',
    choosePassword: 'http://ezmobiletech.com/Users/CC/choose_password.html',
    passwordResetSuccess: 'http://ezmobiletech.com/Users/CC/password_updated_redirect.html'
  },
 
  // account lockout policy setting (OPTIONAL) - defaults to undefined 
  // if the account lockout policy is set and there are more than `threshold` number of failed login attempts then the `login` api call returns error code `Parse.Error.OBJECT_NOT_FOUND` with error message `Your account is locked due to multiple failed login attempts. Please try again after <duration> minute(s)`. After `duration` minutes of no login attempts, the application will allow the user to try login again. 
  // accountLockout: {
  //   duration: 5, // duration policy setting determines the number of minutes that a locked-out account remains locked out before automatically becoming unlocked. Set it to a value greater than 0 and less than 100000. 
  //   threshold: 5, // threshold policy setting determines the number of failed sign-in attempts that will cause a user account to be locked. Set it to an integer value greater than 0 and less than 1000. 
  // },
  // optional settings to enforce password policies 
  passwordPolicy: {
    // Two optional settings to enforce strong passwords. Either one or both can be specified.  
    // If both are specified, both checks must pass to accept the password 
    // 1. a RegExp representing the pattern to enforce  
    validatorPattern: /^.{8,}/, // enforce password with at least 6 char
    // validatorPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/, // enforce password with at least 8 char with at least 1 lower case, 1 upper case and 1 digit 
    // 2. a callback function to be invoked to validate the password   
    // validatorCallback: (password) => { return validatePassword(password) }, 
    doNotAllowUsername: true, // optional setting to disallow username in passwords 
    // maxPasswordAge: 90, // optional setting in days for password expiry. Login fails if user does not reset the password within this period after signup/last reset.  
    // maxPasswordHistory: 5, // optional setting to prevent reuse of previous n passwords. Maximum value that can be specified is 20. Not specifying it or specifying 0 will not enforce history. 
    //optional setting to set a validity duration for password reset links (in seconds) 
    // resetTokenValidityDuration: 24*60*60, // expire after 24 hours 
  },

  fileAdapter: new FSFilesAdapter({
    filesSubDirectory: './CurbsideConsult'
  })
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey


var app = express();

// Serve static assets from the /public folder
//app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);


var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server running on port ' + port + '.');
});

// This will enable the Live Query real-time server
// ParseServer.createLiveQueryServer(httpServer);
