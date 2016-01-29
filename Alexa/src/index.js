var API_Search = require('./API_Search.js')
var http = require("http");
var request = require('request')
var Snoocore = require('snoocore')
var AWS = require('aws-sdk')
var TVDB = require("node-tvdb/compat")
var secret= require('./secrets.js')



var AWSAccountIds = secret.API_KEYS.AWSAccountIds
var AWSSercretAcccessKey = secret.API_KEYS.AWSSercretAcccessKey
var AWSAccessKeyId = secret.API_KEYS.AWSAccessKeyId
var AWSRegion = secret.API_KEYS.AWSRegion
var TVDBAPI = secret.API_KEYS.TVDBAPI
var SnoocoreKey = secret.API_KEYS.Snoocore





console.log("starting")
var sqs = new AWS.SQS({region:AWSRegion,
                       secretAccessKey: AWSSercretAcccessKey,
                       accessKeyId:AWSAccessKeyId
                      });
                      
var sqs_unauth = new AWS.SQS()




/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * exa2mple of how to create a Lambda function for handling Alexa Skill requests.
 *
 * API_Searchs:
 * One-shot model:
 *  User: "Alexa, tell Greeter to say hello"
 *  Alexa: "Hello World!"
 */

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
    // any cleanup logic goes here
};


function CreateQueue(queue_id,read,callback){


        
        console.log("Creating Queue " + queue_id)
        if (read){
            var queue_policy = {
                "Version": "2012-10-17",
                "Id": "Queue1_Policy_UUID",
                "Statement": 
                {
                   "Sid":"KodiUser",
                   "Effect": "Allow",
                   "Principal": {
                        "AWS": "*"
                    },
                    "Action": ["sqs:SendMessage"],
                    "Resource": "arn:aws:sqs:"+AWSRegion+":"+AWSAccountIds+":"+queue_id
                }
            }
        }
        else{
            var queue_policy = {
                "Version": "2012-10-17",
                "Id": "Queue1_Policy_UUID",
                "Statement": 
                {
                   "Sid":"KodiUser",
                   "Effect": "Allow",
                   "Principal": {
                        "AWS": "*"
                    },
                    "Action": ["sqs:ReceiveMessage","sqs:DeleteMessage","sqs:PurgeQueue"],
                    "Resource": "arn:aws:sqs:"+AWSRegion+":"+AWSAccountIds+":"+queue_id
                }
        
            }
        
        }
        var params = {QueueName: queue_id,
            Attributes:{ Policy: JSON.stringify(queue_policy),
                ReceiveMessageWaitTimeSeconds:'20'
            }
        }
        sqs.createQueue(params,function(err,data){
            callback(err,data)
        });
}

function SendMessage(queue_id,body,message_attributes,callback){
    var message = {
        MessageBody: body, 
        QueueUrl: 'https://sqs.'+AWSRegion+'.amazonaws.com/'+AWSAccountIds+'/'+queue_id+'_s',
        DelaySeconds: 0,
        MessageAttributes: message_attributes
    };
    
    sqs.sendMessage(message,function(err,data){
        console.log("Sent Message")
        callback(err,data)
    });


}

function CreateQueues(queue_id,callback){
    CreateQueue(queue_id+'_s',false,function(err,data){
        if (err) console.log(err,err.stack);
        else{
            //console.log(data)
            CreateQueue(queue_id+'_r',true,function(err,data){
                if (err) console.log(err,err.stack);
                else{
                    callback(err,data)
                }
           });
        }
    });
             
}




function SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,callback){

    var params_rcv = {
                MaxNumberOfMessages : 5,
                QueueUrl: 'https://sqs.'+AWSRegion+'.amazonaws.com/'+AWSAccountIds+'/'+queue_id+'_r', 
                WaitTimeSeconds : 0,
                MessageAttributeNames: ['All'],
                VisibilityTimeout: 3
            };
    //console.log("waiting for message resonse")
    sqs.receiveMessage(params_rcv,function(err,data){
        if (err)
            console.error(err)
        if (data.Messages){
            for (i = 0; i < data.Messages.length; i ++){
                console.log("Extra Message")
                console.log(data.Messages[i])
                sqs.deleteMessage({QueueUrl:'https://sqs.'+AWSRegion+'.amazonaws.com/'+AWSAccountIds+'/'+queue_id+'_r',ReceiptHandle:data.Messages[i].ReceiptHandle},function(err,del){
                    if(err)console.log(err,err.stack)
                    else{
                        console.log("deleted extra message")
                    }
                                
                });
            }
        }
    });

    SendMessage(queue_id,message_body,message_attributes,function(err,ret){
        if (err) console.log(err,err.stack);
        else{
            var params = {
                MaxNumberOfMessages : 1,
                QueueUrl: 'https://sqs.'+AWSRegion+'.amazonaws.com/'+AWSAccountIds+'/'+queue_id+'_r', 
                WaitTimeSeconds : 2,
                MessageAttributeNames: ['All'],
            };
            console.log("waiting for message resonse")
            sqs.receiveMessage(params,function(err,data){
                if(err) console.log(err,err.stack)
                else{
                    console.log(data)
                    if(!data.Messages){
                        console.log("response timeout")
                        callback("timeout waiting for response from Kodi","")
                    }
                    else{
                        console.log(data.Messages[0])
                        sqs.deleteMessage({QueueUrl:'https://sqs.'+AWSRegion+'.amazonaws.com/'+AWSAccountIds+'/'+queue_id+'_r',ReceiptHandle:data.Messages[0].ReceiptHandle},function(err,del){
                            if(err)console.log(err,err.stack)
                            else{
                                callback (err,data)
                            }
                        
                        });
                    }
                    
                }
            });
        }
     
     });

}

function GetIMDBID(input_title,callback){
    requestString = "http://www.omdbapi.com/?t="+input_title+"&y=&r=json"//&season="+intent.slots.SeasonNum.value
    console.log(requestString)
    request(requestString, function(err,res,stringbody){
        if (err){
            callback(err)
        }
        console.timeEnd("omdb")
        console.log(stringbody)
           
        var seriesIdx = '1'
        var body = JSON.parse(stringbody)
        if (body.Response == "False"){
            API_Search.lookup(input_title, function(err,imdbid,year,series,title){
                if (err){
                    callback(err)
                }
                callback(err,imdbid,year,series,title)
            
            });
            //response.tellWithCard(intent.slots.MediaName.value + " Not found on IMDB", "TV player", "Media not found");
        }
        else{
            var imdbid = body.imdbID
            var year = body.Year
            year = year.substring(0,4)
            year = year.split('–')[0]
            var series = false
            var title = body.Title

            if (body.Type="series")
                seriesIdx = '3'
                series = true
            callback(err,imdbid,year,series,title)
        }
    });
}


/* sqs.purgeQueue({QueueUrl:'https://sqs.'+AWSRegion+'.amazonaws.com/'+AWSAccountIds+'/'+queue_id+'_r'},function(err,data){
                        if(err) console.log(err,err.stack)
                        else console.log("queue purged")
                        callback(err,data)
                    });*/

PlayTV.prototype.intentHandlers = {
    // register custom intent handlers
    
    "GetKeyIntent":function(intent,session,response){
        queue_id = session.user.userId.substring(60)
        CreateQueues(queue_id,function(err,ret){
            if(err) console.log(err,err.stack)
            response.tellWithCard("I've sent your key to your Alexa app, Please enter this into Kodi", "TV player",queue_id);
        });
    },
    
    
    "PlayTVIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60) 
        console.log("PlayTVIntent")
        
        console.time("omdb")
        console.time("overall")
        
        var seasonNum
        if(intent.slots.SeasonNum)
            seasonNum = intent.slots.SeasonNum.value
        var episodeNum
        if(intent.slots.EpisodeNum)
            episodeNum = intent.slots.EpisodeNum.value
        
        
        
        GetIMDBID(intent.slots.MediaName.value, function(err,imdbid,year,series,title){
            if (err){
                response.tellWithCard( err, "TV player", err);
            }
        
            if (series)
                seriesIdx = '3'

                
                
            var show_tvdbid
            var episode_tvdbid
            var episodeTitle = ''
            if (series){
                var tvdb = new TVDB(TVDBAPI)
                //tvdbRequestString = "http://www.thetvdb.com/api/GetSeriesByRemoteID.php?imdbid="+imdbid
                console.time("TVDBseries")
                tvdb.getSeriesByRemoteId(imdbid,function(error,res){
                    if (error){
                        response.tellWithCard(title + " " + err, "TV player", err);
                    }
                    if (!res){
                        response.tellWithCard("Couldn't Contact TVDB, try again later", "TV player", "Error contacting TVDB");
                    }
                    
                    
                
                    console.timeEnd("TVDBseries")
                    console.log(res)
                    show_tvdbid = res.id
                    console.log(show_tvdbid)
                    console.log(year)
                    if(!seasonNum){
                        console.time("instantwatcher")
                        API_Search.netflixSearch(title,year,'3',function(err,netflixid){
                            if (err){
                                response.tellWithCard(title + " " + err, "TV player", err);
                            }
                            console.timeEnd("instantwatcher")
                            console.log(netflixid)
                            sendMediaToQueue("series",imdbid,title,netflixid,show_tvdbid,episode_tvdbid,seasonNum,episodeNum,episodeTitle)
                        });
                    }
                    else if(!episodeNum){
                        console.time("instantwatcher")
                        API_Search.netflixSearch(title + ' season ' + seasonNum,year,'2',function(err,netflixid){
                            if (err){
                                response.tellWithCard(title + " " + err, "TV player", err);
                            }
                            console.timeEnd("instantwatcher")
                            console.log(netflixid)
                            sendMediaToQueue("series",imdbid,title,netflixid,show_tvdbid,episode_tvdbid,seasonNum,episodeNum,episodeTitle)
                        });
                    }
                    else{
                    console.time("tvdbepisodes")
                    tvdb.getEpisodesById(show_tvdbid, function(error, res){
                        if (error){
                            response.tellWithCard(title + " " + err, "TV player", err);
                        }
                        console.timeEnd("tvdbepisodes")
                        //console.log(res)
                        found = false
                        for (i = 0; i < res.length;i ++){
                            episode =  res[i]
                            //console.log(i)
                            if (parseInt(episode.EpisodeNumber) == parseInt(episodeNum) && parseInt(episode.SeasonNumber) == parseInt(seasonNum)){
                                found = true
                                episode_tvdbid = episode.id
                                year = episode.FirstAired
                                 year = year.split('-')[0]
                                episodeTitle =  episode.EpisodeName
                                console.log(episode)
                                console.time("instantwatcher")
                                API_Search.netflixSearch(title + ' ' + episodeTitle,year,'4',function(err,netflixid){
                                    if (err){
                                        response.tellWithCard(title + " " + err, "TV player", err);
                                    }
                                    console.timeEnd("instantwatcher")
                                    console.log(netflixid)
                                    sendMediaToQueue("series",imdbid,title,netflixid,show_tvdbid,episode_tvdbid,seasonNum,episodeNum,episodeTitle)
                                });
                            }
                        
                        }
                        if (found == false){
                             response.tellWithCard(" I couldn't find Episode " + episodeNum, "TV player", "Couldn't find Episode");
                        }
                        
                        
                        
                    });
                    }
                });
                
            }
            else{
                
                year = year.split('-')[0]
               
                
                console.time("instantwatcher")
                API_Search.netflixSearch(title,year,'1',function(err,netflixid){
                    if (err){
                        response.tellWithCard(title + " " + err, "TV player", err);
                    }
                     console.timeEnd("instantwatcher")
                    console.log(netflixid)
                    sendMediaToQueue("movie",imdbid,title,netflixid,show_tvdbid,episode_tvdbid,season_number,episode_number,false)
                });
            }
            
            
        });
            
            
            
        function sendMediaToQueue(typeText,imdbid,title,netflixid,show_tvdbid,episode_tvdbid,season_number,episode_number,episode_title){
            
            if (!imdbid){imdbid = '-1'}
            
            message_attributes = {}
            if(imdbid){message_attributes.imdbid={DataType:'String',StringValue:imdbid}}
            if(title){message_attributes.title={DataType: 'String',StringValue: title}}
            if(netflixid){message_attributes.netflixid={DataType: 'String',StringValue: netflixid}}
            if(show_tvdbid){message_attributes.show_tvdbid={DataType: 'String',StringValue: show_tvdbid}}
            if(episode_tvdbid){message_attributes.episode_tvdbid={DataType: 'String',StringValue: episode_tvdbid}}
            if(season_number){message_attributes.season_number={DataType: 'String',StringValue: season_number}}
            if(episode_number){message_attributes.episode_number={DataType: 'String',StringValue: episode_number}}
            if(episode_title){message_attributes.episode_title={DataType: 'String',StringValue: episode_title}}
                   
            
           
                
            message_body = typeText
                
            console.time("kodi")
            SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){    
                if (err){
                    console.log(res)
                    response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                    return console.error(err.message);
                }
                console.timeEnd("kodi")
                    
                //retval = JSON.parse(res.body)
                console.log(res.Messages[0].MessageAttributes)
                response.tellWithCard(res.Messages[0].MessageAttributes.voice.StringValue,"TV Player",res.Messages[0].MessageAttributes.card.StringValue);
                //response.tellWithCard(retval.result.voice,"TV Player",retval.result.card);
                console.timeEnd("overall")
            });
            
        }
            
            
        
       
        
    },
    
    
    
    "PlayPandoraIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {
            station: {
                DataType: 'String',
                StringValue: intent.slots.MediaName.value
            }
        }
                
        message_body = "pandora"
        
        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            
            
            response.tellWithCard("Playing someone on pandora","TV Player","Playing something on pandora");
        });
    
    },
    
    "NewEpisodesIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {
            show: {
                DataType: 'String',
                StringValue: intent.slots.ShowName.value
            }
        }
                
        message_body = "NewEpisodes"
        
        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.Messages[0].MessageAttributes.voice.StringValue,"TV Player",res.Messages[0].MessageAttributes.card.StringValue);
            

        });
    
    },
    
    "PausePlayIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
         message_attributes = {
        }
                
        message_body = "PausePlay"
        
        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.Messages[0].MessageAttributes.voice.StringValue,"TV Player",res.Messages[0].MessageAttributes.card.StringValue);
            

        });
    
    },
    
    "NavigateIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
         message_attributes = {
            nav: {
                DataType: 'String',
                StringValue: intent.slots.NavLocation.value
            }
        }
                
        message_body = "PausePlay"
        
        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.Messages[0].MessageAttributes.voice.StringValue,"TV Player",res.Messages[0].MessageAttributes.card.StringValue);
            

        });
    
    },
    
    "OpenAddonIntent": function (intent, session, response) {
        
        response.tellWithCard("Opening addons is not yet implemented","TV Player","Not yet implemented");
            

    },
    
    "NavigateIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)

        message_body = "navigate"
        message_attributes = {
            nav: {
                DataType: 'String',
                StringValue: intent.slots.NavLocation.value
            }
        }
        
                
        
        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.Messages[0].MessageAttributes.voice.StringValue,"TV Player",res.Messages[0].MessageAttributes.card.StringValue);
            

        });
    
    },
    
    "PlaySportsIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
    
        var reddit = new Snoocore({
            userAgent:"Sport Streams parser by /u/silicondiver (v0.1)",
            throttle: 0,
            oauth: {
                type: 'implicit',
                key: SnoocoreKey,
                redirectUri: 'http://localhost:3000',
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

                                if(!comments[1].data.children[k].data.body)
                                    continue
                                var temp = comments[1].data.children[k].data.body.match(exp)

                                if (temp && !found){
                                    found = true

                                    message_attributes = {
                                        url: {
                                            DataType: 'String',
                                            StringValue: temp[0]
                                        }
                                    }
                
                                    message_body = "sports"
                                    SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){ 
                                        if (err){
                                            response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                                            return console.error(err.message);
                                        }
                                        ResponseTitle = ThreadTitle.replace(/Game Thread\:/gi,"")
                                        ResponseTitle = ResponseTitle.replace(/\[request\]/gi,"")
                                        response.tellWithCard("Playing " + ResponseTitle,"TV Player","Playing " + ResponseTitle);
                                        
                                        return
                                    
                                    });

         
                                }
                                
                            }
                            console.log('Subreddit callback')

                        });
                       
                    }

                    
                }
                subreddit_callback()
            });
        }
    },
            

    "AMAZON.HelpIntent": function (intent, session, response) {
    
        //sqsClient.addPermission(queueUrl,"realtimeEvents",principal,actions);
        response.ask("Say play TV show such as play breaking bad", "Say play TV show such as play breaking bad");

    }
};

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the PlayTV skill.
    var playTV = new PlayTV();
    playTV.execute(event, context);
};

console.log("ending")
