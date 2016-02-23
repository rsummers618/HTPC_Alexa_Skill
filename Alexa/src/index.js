var API_Search = require('./API_Search.js')
var http = require("http");
var request = require('request')
var Snoocore = require('snoocore')
//var AWS = require('aws-sdk')
var TVDB = require("node-tvdb/compat")
var secret= require('./secrets.js')
var io = require('socket.io-client')


var AWSAccountIds = secret.API_KEYS.AWSAccountIds
var AWSSercretAcccessKey = secret.API_KEYS.AWSSercretAcccessKey
var AWSAccessKeyId = secret.API_KEYS.AWSAccessKeyId
var AWSRegion = secret.API_KEYS.AWSRegion
var TVDBAPI = secret.API_KEYS.TVDBAPI
var SnoocoreKey = secret.API_KEYS.Snoocore
var socket_key = secret.API_KEYS.socket_key

// Until I can find the location of rogue error
/*
process.on('uncaughtException', function (err) {
  console.error(err);
  console.log(err.stack)
  console.log("Error Found, Not crashing application");
  response.tellWithCard("Exception, Please contact the developer", "Watch TV" , "Exception, Please contact the developer");
});*/


console.log("starting")



//var socket_host = 'localhost'
var socket_host = 'http://ec2-54-191-98-39.us-west-2.compute.amazonaws.com'
var socket_port = 3000
socket = io.connect(socket_host + ":" + socket_port.toString());
socket.on('connect', function(){console.log("Socket connected");});


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
    session_id = session.user.userId.substring(60)
    
    
    socket.emit('add server',{key:socket_key,username:session_id})

    console.log("Adding server to websocket.  Username: " + session_id)
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
	
	// TODO Should I move Queue Cleanup to when a session ends??? 
};


function SendMessage(body,message_attributes){
    socket.emit('server message',{body:body,message_attributes:message_attributes})
    return
}
   

function SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,callback){
    SendMessage(message_body,message_attributes)
    socket.on('client message',function(data){
        return callback (false,data.message)
    });
}


function GetIMDBID(input_title,callback){
    requestString = "http://www.omdbapi.com/?t="+input_title+"&y=&r=json"//&season="+intent.slots.SeasonNum.value
    console.log(requestString)

    request(requestString,{timeout:1500}, function(err,res,stringbody){
        if (err){
            console.log(err)
            console.log(err.stack)
            return callback(err)
        }

        console.log(stringbody)
           
        var seriesIdx = '1'
        var body = JSON.parse(stringbody)
        if (body.Response == "False"){
			console.log("OMDB search failed, Trying Google")
            API_Search.lookup(input_title, function(err,imdbid,series,year,title){
                if (err){
                    return callback(err)
                }
				console.log("Google search returned: IMDBID: " + imdbid + " Year:" + year + " Title:" + title + " Series:" + series)
                return callback(err,imdbid,year,series,title)
            
            });
            //response.tellWithCard(intent.slots.MediaName.value + " Not found on IMDB", "TV player", "Media not found");
        }
        else{
			try{
				var imdbid = body.imdbID
				var year = body.Year
				year = year.substring(0,4)
				year = year.split('–')[0]
				var series = false
				var title = body.Title
				if (body.Type=="series"){
					seriesIdx = '3'
					series = true
                }
			}
			catch(e){
				return callback(e)
			}
            
            return callback(err,imdbid,year,series,title)
        }
    });
}

function SelectEpisode(queue_id,response,session,imdbid,title,year,show_tvdbid,episodeNum,seasonNum){
    
    session.attributes.imdbid = imdbid
    session.attributes.title = title
    session.attributes.show_tvdbid = show_tvdbid
    session.attributes.episodeNum = episodeNum
    session.attributes.seasonNum = seasonNum
    if (!seasonNum){
        session.attributes.series = true
        session.attributes.whichSeason=true
        //SendMessage(queue_id,body,message_attributes,callback)
        return response.ask("What Season?", "Which season of " + title + " would you like to play?");
    }    
    if (!episodeNum){
        session.attributes.series = true
        session.attributes.whichEpisode=true
        return response.ask("Which Episode?", "Which episode from season" + seasonNum.toString() + " of " + title + " would you like to play?");
    }
    
    //console.log(res)
    
    console.log(show_tvdbid)
    console.log(year)
   

    var tvdb = new TVDB(TVDBAPI)
    tvdb.getEpisodesById(show_tvdbid, function(error, res){
        if (error){
            response.tellWithCard(title + " " + err, "TV player", err);
        }

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

                API_Search.netflixSearch(title + ' ' + episodeTitle,year,'4',function(err,netflixid){
                    if (err){
                        response.tellWithCard(title + " " + err, "TV player", err);
                    }

                    console.log(netflixid)
                    return sendMediaToQueue(response,queue_id,"series",imdbid,title,netflixid,show_tvdbid,episode_tvdbid,seasonNum,episodeNum,episodeTitle)
                });
            }
        
        }
        if (found == false){
             return response.tellWithCard(" I couldn't find Episode " + episodeNum, "TV player", "Couldn't find Episode");
        }
        
        
        
    });
       
}

function sendMediaToQueue(response,queue_id,typeText,imdbid,title,netflixid,show_tvdbid,episode_tvdbid,season_number,episode_number,episode_title){
    
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
        


    SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){    
        if (err){
            console.log(res)
            response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
            return console.error(err.message);
        }
        console.log("callback")
        console.log(res)
            
        //retval = JSON.parse(res.body)
        console.log(res.MessageAttributes)
        response.tellWithCard(res.MessageAttributes.voice.StringValue,"TV Player",res.MessageAttributes.card.StringValue);
        //response.tellWithCard(retval.result.voice,"TV Player",retval.result.card);

    });
    
}




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
        
        
        var seasonNum
        if(intent.slots.SeasonNum)
            seasonNum = intent.slots.SeasonNum.value
        var episodeNum
        if(intent.slots.EpisodeNum)
            episodeNum = intent.slots.EpisodeNum.value
        
        
        
        GetIMDBID(intent.slots.MediaName.value, function(err,imdbid,year,series,title){
            if (err){
                return response.tellWithCard( err, "TV player", err);
            }
			try{
				console.log("imdbid: " + imdbid + " year: " + year)
                console.log("series: " + series)
                if(series){
                    console.log("This is a series")
                }
                else{
                    console.log("This is a movie")
                }
			}
			catch(e){
				return response.tellWithCard(e,"TV Player",e)
			}
		
            if (series)
                seriesIdx = '3'

            var show_tvdbid
            var episode_tvdbid
            var episodeTitle = ''

            if (series){
                var tvdb = new TVDB(TVDBAPI)
                //tvdbRequestString = "http://www.thetvdb.com/api/GetSeriesByRemoteID.php?imdbid="+imdbid
                tvdb.getSeriesByRemoteId(imdbid,function(error,res){
                    if (error){
                        return response.tellWithCard(title + " " + err, "TV player", err);
                    }
                    if (!res){
                        return response.tellWithCard("Couldn't Contact TVDB, try again later", "TV player", "Error contacting TVDB");
                    }
                    
                    //// INSERTING HERE
                    show_tvdbid = res.id
                    return SelectEpisode(queue_id,response, session,imdbid,title,year,show_tvdbid,episodeNum,seasonNum)
                });
                
            }
            else{
                
                year = year.split('-')[0]

                API_Search.netflixSearch(title,year,'1',function(err,netflixid){
                    if (err){
                        response.tellWithCard(title + " " + err, "TV player", err);
                    }
                    console.log(netflixid)
                    return sendMediaToQueue(response,queue_id,"movie",imdbid,title,netflixid,show_tvdbid,episode_tvdbid,seasonNum,episodeNum,false)
                });
            }
            
            
        });
            
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
        
        try{
            if(!intent.slots.ShowName.value){
                console.error("No show specified");
                return response.tellWithCard("You Must specify a show", "TV player", "No show named, New Episodes");
            }
        }
        catch(e){
           console.error(e);
           return response.tellWithCard("You Must specify a show", "TV player", "No show named, New Episodes");
        }
        message_attributes = {
            show: {
                DataType: 'String',
                StringValue: intent.slots.ShowName.value
            }
        }
                
        message_body = "NewEpisodes"
        try{
        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                console.error(err.message);
                return response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                
            }
            return response.tellWithCard(res.MessageAttributes.voice.StringValue,"TV Player",res.MessageAttributes.card.StringValue);
            

        });
        }
    catch(e){
        console.error(e);
        return response.tellWithCard("Error getting recent shows", "TV player", "Error getting recent episodes");
    }
        
    
    },
    
    "PausePlayIntent": function (intent, session, response) {
        if (session.attributes.whichSeason){
             response.ask("Can you please repeat that?","Can you please repeat that?");
        }
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {}
        message_body = "playpause"

        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice.StringValue,"TV Player",res.MessageAttributes.card.StringValue);
            

        });
    
    },
    
      
    "NumberIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        console.log("Number Intent")
        console.log(session.attributes)
        if (session.attributes.series && session.attributes.whichSeason){
            if (intent.slots.NumVal.value){
                session.attributes.seasonNum = intent.slots.NumVal.value
                session.attributes.whichSeason = false
            }
            return SelectEpisode(queue_id,response, session,session.attributes.imdbid,session.attributes.title,session.attributes.year,session.attributes.show_tvdbid,session.attributes.episodeNum,session.attributes.seasonNum)
        }
        else if (session.attributes.series && session.attributes.whichEpisode){
            if (intent.slots.NumVal.value){
                session.attributes.episodeNum = intent.slots.NumVal.value
                session.attributes.whichEpisode = false
            }
            return SelectEpisode(queue_id,response, session,session.attributes.imdbid,session.attributes.title,session.attributes.year,session.attributes.show_tvdbid,session.attributes.episodeNum,session.attributes.seasonNum)
        }
        else{
            response.ask("I didn't understand. What do you want?","I didn't understand. What do you want?");
        }
        
    },
    
    
    
    "OpenAddonIntent": function (intent, session, response) {
        
        response.tellWithCard("Opening addons is not yet implemented","TV Player","Not yet implemented");
        return
    },
    
    
    
    "StopIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {}
        message_body = "stop"

        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice.StringValue,"TV Player",res.MessageAttributes.card.StringValue);
            

        });
    
    },
    
    
    "WhatsPlayingIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {}
        message_body = "playing"

        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice.StringValue,"TV Player",res.MessageAttributes.card.StringValue);
            

        });
    
    },
    
    "RecentMoviesIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {}
        message_body = "recent_movies"

        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice.StringValue,"TV Player",res.MessageAttributes.card.StringValue);
            

        });
    
    },
    "RecentEpisodesIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {}
        message_body = "recent_episodes"

        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice.StringValue,"TV Player",res.MessageAttributes.card.StringValue);
            

        });
    
    },
    
    "NavigateContinue": function (intent, session, response) {
        if (!session.attributes.Navigate)
            response.ask("Could you repeat that?","Please repeat what you just said")
        
        session.attributes.Navigate = true
        
        queue_id = session.user.userId.substring(60)
        
        
        message_body = "navigate"
        num = '1'
        if (intent.slots.NumVal.value){
            num = intent.slots.NumVal.value
        }
        message_attributes = {
            nav: {
                DataType: 'String',
                StringValue: intent.slots.NavLocation.value
            },
            num: {
                DataType: 'String',
                StringValue: num
            },
        }
        
        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.ask(res.MessageAttributes.voice.StringValue,res.MessageAttributes.card.StringValue);
            

        });
    
    },
    
    "NavigateStart": function (intent, session, response) {

        session.attributes.Navigate = true

        response.ask("Navigating","Navigation mode active, please say a command such as, Up Two")
    },
    
    "NavigateStop": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        

        if (!intent.slots.NavLocation.value)
            return response.tell("Done Navigating")
        
        session.attributes.Navigate = false
        
        message_body = "navigate"
        num = '1'
        if (intent.slots.NumVal.value){
            num = intent.slots.NumVal.value
        }
        message_attributes = {
            nav: {
                DataType: 'String',
                StringValue: intent.slots.NavLocation.value
            },
            num: {
                DataType: 'String',
                StringValue: num
            },
        }

        SendMessageAndAwaitResponse(queue_id,message_body,message_attributes,function(err,res){  
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice.StringValue,"TV Player",res.MessageAttributes.card.StringValue);

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
                            
                            numStreams = 0
                            message_attributes = {}
                            
                            
                            for(var k in comments[1].data.children){

                                if(!comments[1].data.children[k].data.body)
                                    continue
                                var temp = comments[1].data.children[k].data.body.match(exp)

                                if (temp){
                                    //found = true
                                    console.log("numStreams = " + numStreams.toString())
                                    message_attributes['url'+numStreams.toString()] = {}
                                    
                                    message_attributes['url'+numStreams.toString()]['DataType'] = 'String'
                                    message_attributes['url'+numStreams.toString()]['StringValue'] = temp[0]
                                    numStreams++
                                    if (numStreams >= 10)
                                        break
                                    /*message_attributes = {
                                        url: {
                                            DataType: 'String',
                                            StringValue: temp[0]
                                        }
                                    }*/
                
                                    
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
