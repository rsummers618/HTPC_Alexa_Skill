import sys



import os
print os.path.realpath(__file__) + '/../lib/' 
sys.path.append(os.path.realpath(__file__) + '/../lib/')
import time
import random
#import pyautogui
#import subprocess

from lib import boto3
from lib import botocore
from lib.boto3.session import Session
from lib.botocore.handlers import disable_signing

import xbmc
import xbmcaddon
addon = xbmcaddon.Addon('script.service.alexa')
import json
#from resources.utility import generic_utility

sqs = boto3.resource('sqs',region_name='us-east-1')
sqs.meta.client.meta.events.register(
    'choose-signer.sqs.*', disable_signing)


queue_id = addon.getSetting('authcode')
#queue_id = 'KRKC4LZZNTIJXYYW'
queue_s = sqs.Queue('https://sqs.us-east-1.amazonaws.com/414515788753/'+queue_id+'_s' )
queue_r = sqs.Queue('https://sqs.us-east-1.amazonaws.com/414515788753/'+queue_id+'_r' )

print "listening on "
print 'https://sqs.us-east-1.amazonaws.com/414515788753/'+queue_id+'_s'


# MacOS
#chrome_path = 'open -a /Applications/Google\ Chrome.app %s'

# Windows
#chrome_path = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe %s"

# Linux
chrome_path = '/usr/bin/google-chrome %s'


def sendJSONRPC(method,params=None):
    out = {"id":1,"jsonrpc":"2.0","method":method}
    if params:
        out["params"] = params
    sendstring = json.dumps(out)
    print sendstring
    return json.loads(xbmc.executeJSONRPC(sendstring))


def play_generic_addon(message_attributes):

    return

def listen_pandora(message_attributes):#(stationname):

    stationname = message_attributes['station']['StringValue']
    
    #xbmc.GUI.ActivateWindow(window="videos",paramaters=['plugin://plugin.audio.pandoki/?play='+pandoraid])
    #pool = Pool(processes=1)
   
    #xbmc.GUI.ActivateWindow(window="videos",paramaters=['plugin://plugin.audio.pandoki/?play='+pandoraid])
    send_response_message("good","good")
    
    sendJSONRPC('Addons.ExecuteAddon',{'addonid':'plugin.audio.pandoki'})
    #xbmc.Addons.ExecuteAddon(addonid='plugin.audio.pandoki')#,params={"search":"hcraes"})
    time.sleep(3)
    menu_select()
    time.sleep(1)
    send_text(stationname,done=True)
    time.sleep(2)
    menu_down()
    time.sleep(1)
    menu_select()
    return

def send_text(text,done):
    sendJSONRPC('Input.SendText',{'text':text,'done':done})

def menu_up():
    sendJSONRPC('Input.Up')
    
def menu_down():
    sendJSONRPC('Input.Down')
    
def menu_left():
    sendJSONRPC('Input.Left')
    
def menu_right():
    sendJSONRPC('Input.Right')
    
def menu_select():
    sendJSONRPC('Input.Select')

def watch_netflix(title,netflixid):

    #harmony_tv()
    print "received netflixID " + netflixid

    ## THIS METHOD OPENS IN CHROME, NON FULL SCREEN
    
    #url = 'http://netflix.com/watch/'+netflixid
    #print url
    #webbrowser.get(chrome_path).open(url)
    
    ## THIS METHOD USES KODI CHROME LAUNCHER TO LAUNCH FIREFOX IN KIOSK MODE

    stringparam = '?kiosk=yes&mode=showSite&stopPlayback=yes&url=http://netflix.com/watch/'+netflixid

    #headers = {'content-type':'application/json'};
    #payload = {'jsonrpc':'2.0','method':'Addons.ExecuteAddon','params':{'addonid':'plugin.program.chrome.launcher','params':[stringparam]}}
    #print xbmc.JSONRPC.Ping() 
    #xbmc.GUI.ActivateWindow(window="home")  
    #print stringparam
    #os.system("pkill chrome")
    #time.sleep(3)

    sendJSONRPC('Addons.ExecuteAddon',{'addonid':'plugin.program.chrome.launcher','params':[stringparam]})
    #xbmc.Addons.ExecuteAddon(addonid='plugin.program.chrome.launcher',params=[stringparam])


    return send_response_message("Playing, " + title + ", on Netflix",title + " played on Netflix")


def watch_movie_pulsar(title,imdbid):

    #harmony_tv()
    print "received imdbid " + imdbid

    sendJSONRPC('Player.Open',{'item':{"file":"plugin://plugin.video.pulsar/movie/"+imdbid+"/play"}})
    #xbmc.Player.Open(item={"file":"plugin://plugin.video.pulsar/movie/"+imdbid+"/play"}) 

    return send_response_message("Playing the Movie, " + title + ", on Pulsar",title + " played on Pulsar")



def watch_series_pulsar(title,tvdbid,seasonNum,episodeNum,episode_title):

    #harmony_tv()
    print "received showname " + title + " with tvdbid " + tvdbid


    if seasonNum and episodeNum:
        sendJSONRPC('Player.Open',{'item':{"file":"plugin://plugin.video.pulsar/show/"+tvdbid+"/season/"+seasonNum+"/episode/"+episodeNum+"/play"}})

    	send_response_message("Playing, " + title + ", " + episode_title + " , on pulsar",title + " played on pulsar")

    elif seasonNum:
         sendJSONRPC('GUI.ActivateWindow',{"window":"videos","parameters":["plugin://plugin.video.pulsar/shows/"+tvdbid+"/season/"+seasonNum+"/episodes/"]})

    	 send_response_message("Opening, " + title + ", on pulsar",title + " played on pulsar")

    else:
        sendJSONRPC('GUI.ActivateWindow',{"window":"videos","parameters":["plugin://plugin.video.pulsar/shows/"+tvdbid+"/seasons/"]})

    	send_response_message("Opening, " + title + ", on pulsar",title + " played on pulsar")
    
 
   
def GetPlayerID():
    info = sendJSONRPC("Player.GetActivePlayers")
    result = info.get("result", [])
    if len(result) > 0:
        return result[0].get("playerid")
    else:
        return None


def play_pause():
    sendJSONRPC("Player.PlayPause", {"playerid":playerid})
    #kodi.PlayPause()
    return jsonify(result={"status": 200})


def play_movie(message_attributes):#(title,imdbid,netflixid):

    title = message_attributes['title']['StringValue']
    imdbid = message_attributes['imdbid']['StringValue']
    netflixid = message_attributes['netflixid']['StringValue']

    library = library = sendJSONRPC('VideoLibrary.GetMovies',{'properties':["imdbnumber"]})
    #library = xbmc.VideoLibrary.GetMovies(properties=["imdbnumber"])
    movies = library['result']['movies']
    for movie in movies:
        print movie['imdbnumber']
        if movie['imdbnumber'] == imdbid:
            print "plaing " + movie['label'] + " " + str(movie['movieid'])
            send_response_message("Playing the Movie, " + title + ", locally on Kodi",title + " played locally")
            play_local_movie(movie['movieid'])
            return 
            
    print "netflixid is " + netflixid
    if netflixid == '-1':
        print "pulsar"
        return watch_movie_pulsar(title,imdbid)
    else:
        return watch_netflix(title,netflixid)

def play_local_movie(movieid):
    sendJSONRPC("Playlist.Clear", {"playlistid": 1})
    #kodi.ClearVideoPlaylist()
    sendJSONRPC("Playlist.Add", {"playlistid": 1, "item": {"movieid": int(movie_id)}})
    #kodi.PrepMoviePlaylist(movieid)
    sendJSONRPC('GUI.ActivateWindow',{'window':"videos"})
    #xbmc.GUI.ActivateWindow(window="videos")
    sendJSONRPC("Player.Open", {"item": {"playlistid": 1}})
    #kodi.StartVideoPlaylist()
    return

def play_local_show(episode_id):
    sendJSONRPC("Playlist.Clear", {"playlistid": 1})
    #kodi.ClearVideoPlaylist()
    sendJSONRPC("Playlist.Add", {"playlistid": 1, "item": {"episodeid": int(episode_id)}})
    #kodi.PrepMoviePlaylist(movieid)
    sendJSONRPC('GUI.ActivateWindow',{'window':"videos"})
    #xbmc.GUI.ActivateWindow(window="videos")
    sendJSONRPC("Player.Open", {"item": {"playlistid": 1}})
    #kodi.StartVideoPlaylist()
    return

def play_series(message_attributes):#(title,imdbid,netflixid):


    print message_attributes

    
    title = message_attributes['title']['StringValue']
    imdbid = message_attributes['imdbid']['StringValue']

    show_tvdbid, episode_tvdbid, season_number, episode_number, episode_title = None,None,None,None,None

    netflixid = message_attributes['netflixid']['StringValue']
    if 'show_tvdbid' in message_attributes:
        show_tvdbid = message_attributes['show_tvdbid']['StringValue']
    if 'episode_tvdbid' in message_attributes:
        episode_tvdbid = message_attributes['episode_tvdbid']['StringValue']
    if 'season_number' in message_attributes:
        season_number = message_attributes['season_number']['StringValue']
    if 'episode_number' in message_attributes:
        episode_number = message_attributes['episode_number']['StringValue']
    if 'episode_title' in message_attributes:
        episode_title = message_attributes['episode_title']['StringValue']

    library = sendJSONRPC('VideoLibrary.GetTVShows',{'properties':["imdbnumber"]})
    #library = xbmc.VideoLibrary.GetTVShows(properties=["imdbnumber"])
    
    print library
    #return
    
    shows = library['result']['tvshows']
    for show in shows:
        #print movie['imdbnumber']
        if show['imdbnumber'] == show_tvdbid:
            if not season_number or not episode_number:
                sendJSONRPC('GUI.ActivateWindow',{'window':"videos","parameters":["videodb://2/2/"+str(show['tvshowid'])]})
                return send_response_message("Opening, " + title + ", locally on Kodi",title + " opened locally")
            print "plaing " + show['label']# + " " + str(show['movieid'])
            episodes = sendJSONRPC('VideoLibrary.GetEpisodes',{'tvshowid':show['tvshowid'],'properties':['season','episode']})['result']['episodes']
            print episodes
            for episode in episodes: 
                #print " checking " + season_number + " vs " + episode['season'] + " and " + episode_number + " vs " +episode['episode']
                if episode['season'] == int(season_number) and episode['episode'] == int(episode_number):
                    print "playing " + show['label'] + " " + str(episode['episodeid'])
                    play_local_show(episode['episodeid'])
                    return send_response_message("Playing, " + title + "," + episode_title + ", locally on Kodi",title + " played locally")
                
                     

    print "netflixid is " + netflixid
    
    if netflixid == '-1':
        print "pulsar"
        return watch_series_pulsar(title,show_tvdbid,season_number,episode_number,episode_title)
    else:
        return watch_netflix(title,netflixid)


def play_random_movie():
    movies_response = sendJSONRPC('VideoLibrary.GetMovies')
    movies = movies_response['result']['movies']
    random_movie = random.choice(movies)
    play_local_movie(random_movie['movieid'])

    return jsonify(result={"status": 200})

#@app.route('/watch/sports')
def play_sports_stream(message_attributes):

    send_response_message("good","good")
    url=message_attributes['url']['StringValue']
    
    os.system("pkill chrome")
    launch_chrome(url)

    return 


def launch_chrome(url):

    if "youtube" in url:
        url = url.replace("watch?v=","/v/")
        url = url +  "&autoplay=1"

    url = url + "#sports"
    url = '?kiosk=yes&mode=showSite&stopPlayback=yes&url='+url
    
    sendJSONRPC('Addons.ExecuteAddon',{'addonid':'plugin.program.chrome.launcher','params':[url]})
    #xbmc.Addons.ExecuteAddon(addonid='plugin.program.chrome.launcher',params=[url])
    #subprocess.Popen('\"/usr/bin/google-chrome\" --start-maximized --disable-translate --disable-new-tab-first-run --no-default-browser-check --no-first-run  --kiosk \"'+url+'\"', shell=True)
    
    #if not "youtube" in url:
    #    time.sleep(5)
        #pyautogui.keyDown('ctrl')
    #    time.sleep(1)
        #pyautogui.press('space')
        #pyautogui.keyUp('ctrl')
        
    return


def navigate(message_attributes):
    where = message_attributes['nav']['StringValue']
    if where == 'up':
        menu_up()
    elif where == 'down':
        menu_up()
    elif where == 'left':
        menu_up()
    elif where == 'right':
        menu_up()
    return send_response_message("OK","Navigate " + where + " received")


def send_response_message(voice,card):
    queue_r.send_message(
        MessageBody="OK",
        MessageAttributes={
            'voice':{
                    'StringValue':voice,
                    'DataType':'String'
            },
            'card':{
                    'StringValue':card,
                    'DataType':'String'
            }
        })
    return


message_router = {
    'movie': play_movie,
    'series': play_series,
    'pandora': listen_pandora,
    'sports': play_sports_stream,
    'addon': play_generic_addon,
    'navigate':navigate
	#'music': play_music
}


#watch_netflix("test","test")


queue_s.purge()

while (1):  
    print "trying again"
    message = queue_s.receive_messages(
        MaxNumberOfMessages=1,
        MessageAttributeNames=['*'],
        WaitTimeSeconds=5,
        AttributeNames=['*']
        )
    
    if message:

        print message[0].body
        print message[0].message_attributes
        message_router[message[0].body](message[0].message_attributes)
        message[0].delete()
