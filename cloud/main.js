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
    if (error) {
      response.error("Uh oh, something went wrong");
    } else {
      response.success("Email sent!");
    }            
  });
});


var Mailgun = require('mailgun');
Mailgun.initialize('bodybookapps.com', 'key-77d43d079cb3f40d2c99d8da46a7c452');

Parse.Cloud.define("sendEmail2", function(request, response) {
  Mailgun.sendEmail({
    to: "huy.johnny@gmail.com",
    from: "My Awesome Name <my@awesome.email>",
    subject: "Hello World!",
    text: "Hello from Parse/Mailgun!\n\nIt's awesome!"
  }, {
    success: function(httpResponse) {
      console.log(httpResponse);
      response.success("Email sent!");
    },
    error: function(httpResponse) {
      console.error(httpResponse);
      response.error("Uh oh, something went wrong");
    }
  });
});