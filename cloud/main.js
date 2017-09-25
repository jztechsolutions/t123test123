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
                html: htmlBody
            };

  mailgun.messages().send(mail, function (sendError, body) {
    if (error) {
      inspect(sendError, 'mailgun sendError');
      response.error("Uh oh, something went wrong");
    } else {
      inspect(body, 'Successfully send RECEIPT email to "' + toEmail + '"');
      response.success("Email sent!");
    }            
  });
});