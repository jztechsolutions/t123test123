Parse.Cloud.define('Hello', function(req, res) {
  res.success('Hello from BodyBookApps Team');
});

//Helper
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}
var _ = require('underscore');
// End Helper
//------------------------------------------------------------

Parse.Cloud.define("adminDashboard", function(request, response) {  
  // Parse.Cloud.run("patientEnrolled",{},{
  //   success: function(results) {
  //     response.success(results);
  //   },
  //   error: function(results, error) {
  //     response.error(errorMessageMaker("running chained function",error));
  //   }
  // });

  userCount(function(userCountResults){
    noTreatment(function(noTreatmentResults){
      botoxTreatment(function(botoxTreatmentResults){             
        medicineTreatment(function(medicineTreatmentResults){               
          response.success({"UserCount":userCountResults,"NoTreatment":noTreatmentResults,"Botox":botoxTreatmentResults,"Medicine":medicineTreatmentResults});                        
        });
      });
    });                           
  });      

  // var promises = [];
  // promises.push(userCount(function(result){}));
  // promises.push(noTreatment(function(result){}));
  // promises.push(botoxTreatment(function(result){}));
  // promises.push(medicineTreatment(function(result){}));

  // Parse.Promise.when(promises).then(function(results){    
  //   response.success({"UserCount":results[0],"NoTreatment":results[1],"Botox":results[2],"Medicine":results[3]});                        
  // },function(error){
  //   response.error(error);  
  // });
});


// Parse.Cloud.define("userCount", function(request, response) {  
function userCount(callback) {

  var patientEnrolledCount = 0;
  var doctorEnrolledCount  = 0;

  var patientQuery = new Parse.Query(Parse.User);
  patientQuery.limit(100000);
  patientQuery.equalTo("emailVerified", true);
  patientQuery.equalTo("isDoctor", false);

  var doctorQuery  = new Parse.Query(Parse.User);
  doctorQuery.limit(100000); 
  doctorQuery.equalTo("emailVerified", true);
  doctorQuery.equalTo("isDoctor", true);

  var doctorIsAddedQuery = new Parse.Query("Doctor");
  doctorIsAddedQuery.limit(100000); 

  var promises = [];
  promises.push(patientQuery.find());
  promises.push(doctorQuery.find());
  promises.push(doctorIsAddedQuery.find());

  Parse.Promise.when(promises).then(function(results){
    // response.success({"patientEnrolled":results[0].length,"doctorEnrolled":results[1].length,"doctorIsAdded":results[2].length-results[1].length});
    var userCountJSON = {"patientEnrolled":results[0].length,"doctorEnrolled":results[1].length,"doctorIsAdded":results[2].length-results[1].length};
    // return userCountJSON;
    callback(userCountJSON);
  },function(error){
    // response.error(error); 
    callback(error);
  });

};



//Get all data for No Treatment
// Parse.Cloud.define("NoTreatment", function(request, response) { 
function noTreatment(callback) {

  var noTreatmentReport = new Object();  
  var userIdsWNoTreatmentArray;

  var treatmentQuery = new Parse.Query("TreatmentData");
  treatmentQuery.limit(100000);
  treatmentQuery.select("userObjectId");
  
  treatmentQuery.find().then(function(treatmentResults) {
      //List of userID who have treatment
      var userObjIdsArray = _.map(treatmentResults, function(treatmentResult){        
        return treatmentResult.get("userObjectId");
      });      

      // Find patients don't have treatment
      var patientQuery = new Parse.Query(Parse.User);
      patientQuery.limit(10000); 
      patientQuery.equalTo("emailVerified", true);
      patientQuery.equalTo("isDoctor", false);
      //Only look for patient who is not in the userID list above
      patientQuery.notContainedIn("objectId",userObjIdsArray);

      return patientQuery.find();

  }).then(function(patientNoTreatmentResults) {           
      //List userID who DONT have treatment
      userIdsWNoTreatmentArray = _.map(patientNoTreatmentResults, function(patientNoTreatmentResult){                
        return patientNoTreatmentResult.id;
      });
  
      // Add count number patient doesnt have treatment 
      noTreatmentReport.numbPatient = patientNoTreatmentResults.length;

      var migraineQuery = new Parse.Query("MigraineData");
      migraineQuery.limit(1000000);
      migraineQuery.select("userObjectId");
      //Just need migraine belong to user who doesnt have any treatment yet
      migraineQuery.containedIn("userObjectId",userIdsWNoTreatmentArray);
  
      migraineQuery.find().then(function(totalMigraineResults) {     
        // Total Migraine belongs to user who doesnt have any treatment yet
        noTreatmentReport.totalMigraine = totalMigraineResults.length;
        
        // All userID who have migraine
        var userObjIdsArray = _.map(totalMigraineResults, function(totalMigraineResult){        
          return totalMigraineResult.get("userObjectId");
        });

        var uniqueUserWMigraineArray = userObjIdsArray.filter(onlyUnique);
        // Total Paitents who doesn't have treatment but have migraine
        noTreatmentReport.numbPatientWMigraine = uniqueUserWMigraineArray.length; 

        // response.success(noTreatmentReport);   
        callback(noTreatmentReport);

      }, function(error) {
        response.error(error); 
        callback(error);
      });
    });
};

//Get all data for Botox Treatment
// Parse.Cloud.define("BotoxTreatment", function(request, response) {    
function botoxTreatment(callback) {

  var botoxTreatmentReport = new Object();  
  var userIdsWBotoxTreatmentArray;

  var treatmentQuery = new Parse.Query("TreatmentData");
  treatmentQuery.limit(100000);
  treatmentQuery.select(["userObjectId","treatmentType","treatmentDate"]);  
  treatmentQuery.descending("treatmentDate");

  treatmentQuery.find().then(function(treatmentResults) {

      var allDistinctUser = [];  
      var allLastTreatmentIsBotox = [];

      _.each(treatmentResults, function(treatmentResult){
        var userIdInArray = allDistinctUser.includes(treatmentResult.get("userObjectId"));
        
         if(!userIdInArray) {
           //keep track all user who had treatment
           allDistinctUser.push(treatmentResult.get("userObjectId"));
           //keep track all last treatment belong EACH userId
          //  allDistinctLastTreatment.push(treatmentResult);
                     
           //Get Last treatment is Botox          
           if (treatmentResult.get("treatmentType") == 1){             
             allLastTreatmentIsBotox.push(treatmentResult);             
           }    
         }                 
      });

      // Add number patient have last treatment is Botox
      botoxTreatmentReport.numbPatient = allLastTreatmentIsBotox.length;
              
      //List userID who have last treatment is Botox
      userIdsWBotoxTreatmentArray = _.map(allLastTreatmentIsBotox, function(lastTreatmentResult){                
        return lastTreatmentResult.get("userObjectId");
      });     
              
      //Get all Migraines that belong userID in userIdsWBotoxTreatmentArray
      var migraineQuery = new Parse.Query("MigraineData");
      migraineQuery.limit(1000000);
      migraineQuery.select(["userObjectId","migraineDate"]);
      //Just need migraine belong to user who have last treatment is botox
      migraineQuery.containedIn("userObjectId",userIdsWBotoxTreatmentArray);
  
      migraineQuery.find().then(function(totalMigraineResults) {        
        //Check if Each migraine is recorded before or after last treatment date                          

        totalMigraineResults = totalMigraineResults.filter(function(aMigraine){
          //Loop through each userId who has last treatment is botox
          for (i = 0; i < userIdsWBotoxTreatmentArray.length; i++) { 
            var aTreatment = allLastTreatmentIsBotox[i];
            //Check If current userId same as userObjectId in current migraine Object                                
            if (aTreatment.get("userObjectId")===aMigraine.get("userObjectId")){              
              //Check if current migraine objectId has migraineDate after current last treatment date
              var migraineDate = new Date(aMigraine.get("migraineDate"));
              var treatmentDate = new Date(aTreatment.get("treatmentDate"));            
              if (migraineDate > treatmentDate){                
                return aMigraine;
              }

            }
          }
          
        });

        // Total Migraine belongs to user who have any last botox treatment
        botoxTreatmentReport.totalMigraine = totalMigraineResults.length;
        
        // All userID who have migraine after last botox treatment
        var userObjIdsArray = _.map(totalMigraineResults, function(totalMigraineResult){        
          return totalMigraineResult.get("userObjectId");
        });

        var uniqueUserWMigraineArray = userObjIdsArray.filter(onlyUnique);
        // Total Paitents who doesn't have treatment but have migraine
        botoxTreatmentReport.numbPatientWMigraine = uniqueUserWMigraineArray.length;

        // response.success(botoxTreatmentReport);     
        callback(botoxTreatmentReport) ;

      }, function(error) {
        // response.error(error); 
        callback(error);
      });
    });
};



//Get all data for Medicine Treatment
// Parse.Cloud.define("MedicineTreatment", function(request, response) {    
function medicineTreatment(callback) {

  var medicineTreatmentReport = new Object();  
  var userIdsWMedicineTreatmentArray;

  var treatmentQuery = new Parse.Query("TreatmentData");
  treatmentQuery.limit(100000);
  treatmentQuery.select(["userObjectId","treatmentType","treatmentDate"]);  
  treatmentQuery.descending("treatmentDate");

  treatmentQuery.find().then(function(treatmentResults) {

      var allDistinctUser = [];    
      var allLastTreatmentIsMedicine = [];

      _.each(treatmentResults, function(treatmentResult){
        var userIdInArray = allDistinctUser.includes(treatmentResult.get("userObjectId"));
        
         if(!userIdInArray) {
           //keep track all user who had treatment
           allDistinctUser.push(treatmentResult.get("userObjectId"));
                     
           //Get Last treatment is Medicine          
           if (treatmentResult.get("treatmentType") == 2){             
             allLastTreatmentIsMedicine.push(treatmentResult);             
           }    
         }                 
      });
      

      // Add number patient have last treatment is Medicine
      medicineTreatmentReport.numbPatient = allLastTreatmentIsMedicine.length;
              
      //List userID who have last treatment is Medicine
      userIdsWMedicineTreatmentArray = _.map(allLastTreatmentIsMedicine, function(lastTreatmentResult){                
        return lastTreatmentResult.get("userObjectId");
      });     
              
      //Get all Migraines that belong userID in userIdsWMedicineTreatmentArray
      var migraineQuery = new Parse.Query("MigraineData");
      migraineQuery.limit(1000000);
      migraineQuery.select(["userObjectId","migraineDate"]);
      //Just need migraine belong to user who have last treatment is botox
      migraineQuery.containedIn("userObjectId",userIdsWMedicineTreatmentArray);
  
      migraineQuery.find().then(function(totalMigraineResults) {        
        //Check if Each migraine is recorded before or after last treatment date                          
        totalMigraineResults = totalMigraineResults.filter(function(aMigraine){
          //Loop through each userId who has last treatment is botox
          for (i = 0; i < userIdsWMedicineTreatmentArray.length; i++) { 
            var aTreatment = allLastTreatmentIsMedicine[i];
            //Check If current userId same as userObjectId in current migraine Object                                
            if (aTreatment.get("userObjectId")===aMigraine.get("userObjectId")){              
              //Check if current migraine objectId has migraineDate after current last treatment date
              var migraineDate = new Date(aMigraine.get("migraineDate"));
              var treatmentDate = new Date(aTreatment.get("treatmentDate"));            
              if (migraineDate > treatmentDate){                
                return aMigraine;
              }

            }
          }
          
        });

        // Total Migraine belongs to user who have any last botox treatment
        medicineTreatmentReport.totalMigraine = totalMigraineResults.length;
        
        // All userID who have migraine after last botox treatment
        var userObjIdsArray = _.map(totalMigraineResults, function(totalMigraineResult){        
          return totalMigraineResult.get("userObjectId");
        });

        var uniqueUserWMigraineArray = userObjIdsArray.filter(onlyUnique);
        // Total Paitents who doesn't have treatment but have migraine
        medicineTreatmentReport.numbPatientWMigraine = uniqueUserWMigraineArray.length;

        // response.success(medicineTreatmentReport);      
        callback(medicineTreatmentReport);
      }, function(error) {
        // response.error(error); 
        callback(error);
      });
    });
};