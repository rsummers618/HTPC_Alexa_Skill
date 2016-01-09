var google_lookup = require('./lookup.js')
var http = require("http");
var request = require('request')
var Snoocore = require('snoocore')



/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, tell Greeter to say hello"
 *  Alexa: "Hello World!"
 */

 var SERVER_URL = '192.168.1.1'  // SERVER IP/URL here
 var SERVER_PORT = '8888'        // SERVER PORT HERE
 
/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * PlayTV is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var PlayTV = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
PlayTV.prototype = Object.create(AlexaSkill.prototype);
PlayTV.prototype.constructor = PlayTV;

PlayTV.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("PlayTV onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

PlayTV.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("PlayTV onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to the TV service, please say the name of a Movie, TV show or Station on Pandora";
    var repromptText = "You can say a show such as Breaking Bad";
    response.ask(speechOutput, repromptText);
};

PlayTV.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("PlayTV onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

PlayTV.prototype.intentHandlers = {
    // register custom intent handlers
    "PlayTVIntent": function (intent, session, response) {
    
        google_lookup.lookup(intent.slots.MediaName.value, function(err,netflixid,title,year,series,imdbid){
            if (err){
                response.tellWithCard(title + " " + err, "TV player", err);
            }
            
            
            var typeText = ''
            if (series){typeText = "TV Series"}
            else {typeText = "Movie"}
            
            console.log("about to send post")
            
            if (!series){
                request(SERVER_URL +':'+ SERVER_PORT +'/kodi/movie/'+title+ '/' +imdbid+'/'+netflixid,{timeout:1500}, function (err, res) {
                    if (err){
                        response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                        return console.error(err.message);
                    }
                    
                    retval = JSON.parse(res.body)
                   

                    response.tellWithCard(retval.result.voice,"TV Player",retval.result.card);
                });
            }
            else{
                request(SERVER_URL +':'+ SERVER_PORT +'/kodi/series/'+title+'/'+imdbid+'/'+netflixid,{timeout:1500}, function (err, res) {
                    if (err){
                        response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                        return console.error(err.message);
                    }
                    retval = JSON.parse(res.body)

                    response.tellWithCard(retval.result.voice,"TV Player",retval.result.card);
                });
            }
            

            
            
            
        })
        
    },
    
    "PlayPandoraIntent": function (intent, session, response) {
        reques(SERVER_URL +':'+ SERVER_PORT +'/listen/pandora/'+intent.slots.MediaName.value,{timeout:1500}, function (err, res) {
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            
                    
            
                   

            response.tellWithCard(retval.result.voice,"TV Player",retval.result.card);
        });
    
    },
    
    "PlaySportsIntent": function (intent, session, response) {
    
        var reddit = new Snoocore({
            userAgent:"Sport Streams parser by /u/silicondiver (v0.1)",
            throttle: 0,
            oauth: {
                type: 'implicit',
                key: 'XXXXXXXXXXXX',
                redirectUri: 'XXXXXXXXXXX',
                scope: [ 'read' ]
            }
        });
        var subreddit_list = ['nhlstreams','cfbstreams','nflstreams','nbastreams','mlbstreams','ncaabballstreams']
        var callback_counter = subreddit_list.length
        
        function subreddit_callback(){
            callback_counter --
            console.log('callback counter')
            console.log(callback_counter)
            
            if (callback_counter <= 0){
                response.tellWithCard("I Couldn't Find a game by the team " + intent.slots.MediaName.value,"TV Player","I Couldn't Find a game by the team " + intent.slots.MediaName.value);
            }
        }
        
        
        var found = false
        
        for(var i in subreddit_list){
            reddit('/r/'+subreddit_list[i]+'/hot').get({limit:15}
            ).catch(function(e){
                response.tellWithCard("Error: "+e,"TV player", "Error: "+e);
            }).then(function(res){
            
                for (var j in res.data.children){
                    //var ThreadTitle = res.data.children[j].data.title
                    

                    
                    if (res.data.children[j].data.title.toLowerCase().indexOf(intent.slots.MediaName.value.toLowerCase())>-1){
                        console.log(res.data.children[j].data.title)
                        
                        callback_counter ++
                        reddit(res.data.children[j].data.permalink).get({limit:15}
                        ).catch(function(e){
                            response.tellWithCard("Error: "+e,"TV player", "Error: "+e);
                        }).then(function(comments){
         
                        
                            console.log('comments0')
                            var ThreadTitle = comments[0].data.children[0].data.title
                            
                            var exp =  /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
                            
                            for(var k in comments[1].data.children){
                                //console.log('children body')
                                if(!comments[1].data.children[k].data.body)
                                    continue
                                var temp = comments[1].data.children[k].data.body.match(exp)
                                //console.log(comments[1].data.children[k].data.body)
                               // console.log(temp)
                                if (temp && !found){
                                    found = true
                                    
                                    
                                    request(SERVER_URL +':'+ SERVER_PORT +'/watch/sports',{timeout:1500,body:temp[0]}, function (err, res) {
                                        if (err){
                                            response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                                            return console.error(err.message);
                                        }
                                        ResponseTitle = ThreadTitle.replace(/Game Thread\:/gi,"")
                                        ResponseTitle = ResponseTitle.replace(/\[request\]/gi,"")
                                        response.tellWithCard("Playing " + ResponseTitle,"TV Player","Playing " + ResponseTitle);
                                        
                                        return
                                    
                                    });
                                    //console.log(temp)
         
                                }
                                
                            }
                            console.log('Subreddit callback')
                            //subreddit_callback()
                            
                            //console.log('Subreddit callback')
                            //console.log(comments[1].data.children)
                        });
                       
                    }

                    
                }
                subreddit_callback()
                
            });
             
        
        
        }
        
            //response.tellWithCard("I Couldn't Find a game by the team " + intent.slots.MediaName.value,"TV Player","I Couldn't Find a game by the team " + intent.slots.MediaName.value);
        
    
    },
            
            
         
    "AMAZON.HelpIntent": function (intent, session, response) {
        response.ask("Say play TV show such as play breaking bad", "Say play TV show such as play breaking bad");
    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the PlayTV skill.
    var playTV = new PlayTV();
    playTV.execute(event, context);
};
