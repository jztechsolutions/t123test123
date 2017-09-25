Parse.Cloud.define('Hello', function(request, response) {
  res.success('Hello from BodyBookApps Team');
});

Parse.Cloud.define("SendEmail", function(request, response) {

  var mailgun = require('mailgun');
  mailgun.initialize('bodybookapps.com', 'key-77d43d079cb3f40d2c99d8da46a7c452');
  mailgun.sendEmail({
    to: "huy.johnny@gmail.com",
    from: "Mailgun@CloudCode.com",
    subject: "Hello from Cloud Code!",
    text: "Using Parse and Mailgun is great!"
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