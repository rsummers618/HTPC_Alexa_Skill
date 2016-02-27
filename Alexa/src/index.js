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
var TMDBAPI = secret.API_KEYS.TMDBAPI


var MovieDB  = require('moviedb')(TMDBAPI)

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
server_logged_in = false


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
	
	// TODO Should I move Queue Cleanup to when a session ends??? 
};


function SendMessage(session_id,body,message_attributes){
    

    //if (server_logged_in == false) {
        socket.emit('add server',{key:socket_key,username:session_id})
        console.log("Adding server to websocket.  Username: " + session_id)
        server_logged_in = true 
    //}
    console.log("sent message " + body)
    socket.emit('server message',{body:body,message_attributes:message_attributes})
    return
}
   

function SendMessageAndAwaitResponse(session,response,message_body,message_attributes,callback){

    session_id = session.user.userId.substring(60)

    SendMessage(session_id,message_body,message_attributes)
    console.log("Waiting for response ")
    var timeoutProtect = setTimeout(function() {

        // Clear the local timer variable, indicating the timeout has been triggered.
        timeoutProtect = null;

        // Execute the callback with an error argument.
        return response.tell("Message sent, Kodi didn't respond in time");

    }, 3000);//.get_remaining_time_in_millis() - 500);
    if (timeoutProtect){
        socket.removeAllListeners()
        socket.on('client message',function(data){
            clearTimeout(timeoutProtect)
            console.log("Response received")
            console.log(data.message)

            if (data.message.type == 'ask'){
                return response.ask(data.message.MessageAttributes.voice)
            }
            else{
                return response.tellWithCard(data.message.voice,"TV Player",data.message.card);
            }
            //return callback (false,data.message)

        });
        socket.on('no client',function(data){
            return response.tell("Kodi is not connected to the server");
        })
    }
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

function SelectEpisode(queue_id,response,session,media){
    console.log("Printing media")
    console.log(media)
    if(!session.attributes)
        session.attributes = {}
    session.attributes.media = media
    if (!media.seasonNum){
        session.attributes.series = true
        session.attributes.whichSeason=true
        //SendMessage(queue_id,body,message_attributes,callback)
        return response.ask("What Season?", "Which season of " + media.title + " would you like to play?");
    }    
    if (!media.episodeNum){
        session.attributes.series = true
        session.attributes.whichEpisode=true
        return response.ask("Which Episode?", "Which episode from season" + media.seasonNum.toString() + " of " + media.title + " would you like to play?");
    }
    
    //console.log(res)

    console.log("show tvdbid: " + media.show_tvdbid)

    var tvdb = new TVDB(TVDBAPI)
    tvdb.getEpisodesById(media.show_tvdbid, function(error, res){
        if (error){
            console.log(error)
            response.tellWithCard(media.title + " " + error, "TV player", error);
        }

        //console.log(res)
        found = false
        for (i = 0; i < res.length;i ++){
            episode =  res[i]
            //console.log(i)
            if (parseInt(episode.EpisodeNumber) == parseInt(media.episodeNum) && parseInt(episode.SeasonNumber) == parseInt(media.seasonNum)){
                found = true
                media.episode_tvdbid = episode.id
                media.year = episode.FirstAired.split('-')[0]
                media.episodeTitle =  episode.EpisodeName
                console.log(episode)

                API_Search.netflixSearch(media.title + ' ' + media.episodeTitle,media.year,'4',function(err,netflixid){
                    if (err){
                        response.tellWithCard(title + " " + err, "TV player", err);
                    }
                    media.netflixid = netflixid
                    console.log(netflixid)
                    return sendMediaToQueue(session,response,media)
                });
            }
        
        }
        if (found == false){
             return response.tellWithCard(" I couldn't find Episode " + episodeNum, "TV player", "Couldn't find Episode");
        }
        
        
        
    });
       
}

function sendMediaToQueue(session,response,media){

    if (media.series){
        message_body = 'series'
    }else{
        message_body = 'movie'
    }
        


    SendMessageAndAwaitResponse(session,response,message_body,media,function(err,res){
        if (err){
            console.log(res)
            response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
            return console.error(err.message);
        }

        console.log(res.MessageAttributes)
        response.tellWithCard(res.MessageAttributes.voice,"TV Player",res.MessageAttributes.card);
        //response.tellWithCard(retval.result.voice,"TV Player",retval.result.card);

    });
    
}




PlayTV.prototype.intentHandlers = {
    // register custom intent handlers
    
    "GetKeyIntent":function(intent,session,response){
        queue_id = session.user.userId.substring(60)
        response.tellWithCard("I've sent your key to your Alexa app, Please enter this into Kodi", "TV player",queue_id);

    },
    
    
    
    "PlayTVIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60) 
        console.log("PlayTVIntent")


        var media = {}
        
        media.seasonNum
        if(intent.slots.SeasonNum)
            media.seasonNum = intent.slots.SeasonNum.value
            console.log("season Num: " + media.seasonNum)
        var episodeNum
        if(intent.slots.EpisodeNum)
            media.episodeNum = intent.slots.EpisodeNum.value
            console.log("episode Num: " + media.episodeNum)
        
        
        GetIMDBID(intent.slots.MediaName.value, function(err,imdbid,year,series,title){
            if (err){
                return response.tellWithCard( err, "TV player", err);
            }
			try{
			    media.imdbid = imdbid
			    media.year = year
			    media.series = series
			    media.title = title

				console.log("imdbid: " + imdbid + " year: " + year)
				console.log("title: " + title)
                console.log("series: " + series)

			}
			catch(e){
				return response.tellWithCard(e,"TV Player",e)
			}


            numDone = 2;
            if (series){
                console.log("This is a series")
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
                    media.show_tvdbid = res.id
                    return done()
                    //return SelectEpisode(queue_id,response, session,media)
                });

                var mdb =  MovieDB
                mdb.find({id:imdbid,external_source:'imdb_id'}, function(err,res){
                    if (err){
                        return response.tellWithCard(title + " " + err, "TV player", err);
                    }
                    if (!res){

                        return response.tellWithCard("Couldn't Contact The MovieDB, try again later", "TV player", "Error contacting TheMovieDB");
                    }
                    if (res.tv_results.length > 0){
                        console.log("MOVIE DB: " + res.tv_results[0].id)
                        media.show_tmdbid = res.tv_results[0].id
                    }else{
                        console.log("MOVIE DB: NOT FOUND")
                    }
                    return done()
                    //return SelectEpisode(queue_id,response, session,imdbid,media)
                });

                function done(){
                    numDone = numDone -1
                    if (numDone <= 0){
                        return SelectEpisode(queue_id,response, session,media)
                    }
                }
                
            }
            else{
                console.log("This is a movie")
                media.year = year.split('-')[0]

                console.log("year: " + year)

                API_Search.netflixSearch(title,year,'1',function(err,netflixid){
                    if (err){
                        response.tellWithCard(title + " " + err, "TV player", err);
                    }
                    media.netflixid = netflixid
                    console.log(netflixid)
                    return sendMediaToQueue(session,response,media)
                });
            }
            
            
        });
            
    },
    
    
    
    "PlayPandoraIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {
            station:intent.slots.MediaName.value
        }
                
        message_body = "pandora"
        
        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
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
            show:intent.slots.ShowName.value
        }
                
        message_body = "NewEpisodes"
        try{
        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
            if (err){
                console.error(err.message);
                return response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                
            }
            return response.tellWithCard(res.MessageAttributes.voice,"TV Player",res.MessageAttributes.card);
            

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

        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice,"TV Player",res.MessageAttributes.card);
            

        });
    
    },
    
      
    "NumberIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        console.log("Number Intent")
        if (session.attributes.series && session.attributes.whichSeason){
            if (intent.slots.NumVal.value){

                session.attributes.media.seasonNum = intent.slots.NumVal.value
                session.attributes.whichSeason = false
            }
            return SelectEpisode(queue_id,response,session,session.attributes.media)
        }
        else if (session.attributes.series && session.attributes.whichEpisode){
            if (intent.slots.NumVal.value){
                session.attributes.media.episodeNum = intent.slots.NumVal.value
                session.attributes.whichEpisode = false
            }
            return SelectEpisode(queue_id,response, session,session.attributes.media)
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

        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice,"TV Player",res.MessageAttributes.card);
            

        });
    
    },
    
    
    "WhatsPlayingIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {}
        message_body = "playing"

        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice,"TV Player",res.MessageAttributes.card);
            

        });
    
    },
    
    "RecentMoviesIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {}
        message_body = "recent_movies"

        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice,"TV Player",res.MessageAttributes.card);
            

        });
    
    },
    "RecentEpisodesIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)
        
        message_attributes = {}
        message_body = "recent_episodes"

        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice,"TV Player",res.MessageAttributes.card);
            

        });
    
    },
    
    "NavigateContinue": function (intent, session, response) {
        if (!session.attributes.Navigate)
            return response.ask("Could you repeat that?","Please repeat what you just said")
        
        session.attributes.Navigate = true
        
        queue_id = session.user.userId.substring(60)
        
        
        message_body = "navigate"
        num = '1'
        if (intent.slots.NumVal.value){
            num = intent.slots.NumVal.value
        }
        message_attributes = {
            nav:intent.slots.NavLocation.value,
            num:num

        }
        
        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            return response.ask(res.MessageAttributes.voice,res.MessageAttributes.card);
            

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
            nav:intent.slots.NavLocation.value,
            num: num
        }

        SendMessageAndAwaitResponse(session,response,message_body,message_attributes,function(err,res){
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            response.tellWithCard(res.MessageAttributes.voice,"TV Player",res.MessageAttributes.card);

        });
    
    },
    
    
    
    "PlaySportsIntent": function (intent, session, response) {
        queue_id = session.user.userId.substring(60)

        teamname = intent.slots.MediaName.value.toLowerCase()

        Date.prototype.addHours=function(h){
            this.setHours(this.getHours()+h);
            return this
        }
        today_from = new Date().addHours(-8).toISOString();
        today_to = (new Date().addHours(23-8)).toISOString();

        retvals = []

        //today = date.getFullYear() + '-' + date.getMonth() +1
        //today = datetime.utcnow() - timedelta(hours=8)
        //today_from = str(today.strftime('%Y-%m-%d'))+'T00:00:00.000-05:00'
        //today_to = str(today.strftime('%Y-%m-%d'))+'T23:59:00.000-05:00'
        //print "PROSPORT LINK"

        //print 'http://www.sbnation.com/sbn_scoreboard/ajax_leagues_and_events?ranges['+mode+'][from]='+today_from+'&ranges['+mode+'][until]='+today_to
        //js = GetJSON('http://www.sbnation.com/sbn_scoreboard/ajax_leagues_and_events?ranges['+mode+'][from]='+today_from+'&ranges['+mode+'][until]='+today_to)

        sports = ['nba','nhl','nfl']
        donecount = 0
        sports.forEach(function(mode){
             url = 'http://www.sbnation.com/sbn_scoreboard/ajax_leagues_and_events?ranges['+mode+'][from]='+today_from+'&ranges['+mode+'][until]='+today_to
             request(url, function(error,response,body){
                if(!error && response.statusCode == 200){
                    var fbResponse = JSON.parse(body)
                    console.log("Got a response: ", fbResponse)
                    console.log(fbResponse['leagues'][mode].length)

                    fbResponse['leagues'][mode].forEach(function(game){
                        var home = game['away_team']['name'].toLowerCase()
                        var away = game['home_team']['name'].toLowerCase()
                        console.log("home:" + home + "  away: " + away  +  "   teamname: " + teamname)
                        if (home.indexOf(teamname) > -1 || away.indexOf(teamname) > -1 ){
                            retvals.push({home:home,away:away,mode:mode})
                        }

                    })

                    donecount = donecount +1
                    done()
                }else{
                    console.log("Got an error: ", error, ", status code: ", response.statusCode);
                    donecount = donecount +1
                    done()
                }

             });
        })


        function done(){
            if (donecount >= sports.length){
                if (retvals.length <= 0){
                    response.tell("I couldn't find a team " + teamname + " playing today");
                }
                if(retvals.length == 1){
                    sendteam(retvals[0])
                }
                if(retvals.length > 1){

                    response = 'Which game did you want?'
                    retvals.foreach(function(game){
                        response = response + game.mode + ', ' + game.away + ' at ' + game.home + '.'
                    })
                }

            }
        }

        function sendteam(gamedata){
            SendMessageAndAwaitResponse(session,response,'sports',gamedata,function(err,res){
            if (err){
                response.tellWithCard("Couldn't communicate with the TV", "TV player", "Couldn't communicate with TV");
                return console.error(err.message);
            }
            //ResponseTitle = ThreadTitle.replace(/Game Thread\:/gi,"")
            //ResponseTitle = ResponseTitle.replace(/\[request\]/gi,"")
            response.tellWithCard("Playing " + gamedata.away + ' at ' + gamedata.home,"TV Player","Playing " + gamedata.away + ' at ' + gamedata.home);

            return

            });
        }





        /*var reddit = new Snoocore({
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
                                    message_attributes = {
                                        url: {
                                            DataType: 'String',
                                            StringValue: temp[0]
                                        }
                                    }
                
                                    
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
        }*/
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
