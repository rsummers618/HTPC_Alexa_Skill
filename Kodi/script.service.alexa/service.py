
import sys
import os
import time
import random
import xbmc
import json
import stream
import traceback
import urllib
from addon import ADDON, ADDON_NAME, ADDON_VER
from logger import log
from config import cfg

sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))
from socketIO_client import SocketIO,LoggingNamespace

socketIO = None

while len(cfg.user_id) < 15:
    xbmc.executebuiltin('Notification(Alexa Service,Please enter a valid key into the alexa service)')
    for i in range(60):
        time.sleep(1)
    cfg.user_id = ADDON.getSetting('authcode')


def sendJSONRPC(method,params=None):
    out = {"id":1,"jsonrpc":"2.0","method":method}
    if params:
        out["params"] = params
    sendstring = json.dumps(out)
    log.info(sendstring)
    return json.loads(xbmc.executeJSONRPC(sendstring))


def play_generic_addon(message_attributes):
    addons = sendJSONRPC('Addons.GetAddons',{"enabled":true,"properties":["path","name"]})
    for video in cfg.video_addons:
        if message_attributes['addon'] in video.name:
            log.info('\taddon found')
    return

def listen_pandora(message_attributes):#(stationname):

    stationname = message_attributes['station']
    
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
    
def get_current_selection():
    item = sendJSONRPC('XBMC.GetInfoLabels',{"labels":["System.CurrentWindow","System.CurrentControl"]})
   # http://192.168.1.169:8980/jsonrpc?request={%22jsonrpc%22:%222.0%22,%22id%22:1,%22method%22:%22XBMC.GetInfoLabels%22,%22params%22:{%22labels%22:[%22System.CurrentWindow%22,%22System.CurrentControl%22,%22Container.Content%22,%22Container(1).CurrentItem%22,%22Listitem.Label%22]}}
    return item
   
def send_text(text,done):
    sendJSONRPC('Input.SendText',{'text':text,'done':done})

def info():
    sendJSONRPC('Input.Info')  
    
def home():
    sendJSONRPC('Input.Home')   

def back():
    sendJSONRPC('Input.Back')    
    
def context_menu():
    sendJSONRPC('Input.ContextMenu')   
    
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
    log.info('watch_netflix(%s)' % netflixid)

    ## THIS METHOD OPENS IN CHROME, NON FULL SCREEN

    #url = 'http://netflix.com/watch/'+netflixid
    #print url
    #webbrowser.get(chrome_path).open(url)

    ## THIS METHOD USES KODI CHROME LAUNCHER TO LAUNCH FIREFOX IN KIOSK MODE
    stringparam = 'http://netflix.com/watch/' + netflixid # rely on launch_chrome to format kiosk tokens as needed
    launch_chrome(stringparam)

    return send_response_message("Playing, " + title + ", on Netflix",title + " played on Netflix")


def watch_movie_addon(addon,title,imdbid):
    send_response_message("Playing the Movie, " + title + ", on " + addon,title + " played on " + addon)

    log.info('watch_movie_addon(%s, %s, %s)' % (addon, title, imdbid))

    sendJSONRPC('Player.Open',{'item':{"file":"plugin://"+addon+"/movie/"+imdbid+"/play"}})

    return



def watch_series_addon(addon,title,tvdbid,tmdbid,seasonNum,episodeNum,episode_title):


    log.info('watch_series_addon(%s, %s, %s, %s, %s, %s)' % (addon,title,tvdbid,seasonNum,episodeNum,episode_title))

    if seasonNum and episodeNum:
        send_response_message("Playing, " + title + ", " + episode_title + " , on " +addon ,title + " played on " + addon)
        sendJSONRPC('Player.Open',{'item':{"file":"plugin://"+addon+"/show/"+tmdbid+"/season/"+seasonNum+"/episode/"+episodeNum+"/play"}})

        return

    elif seasonNum:

        send_response_message("Opening, " + title + ", on " + addon,title + " played on " + addon)
        sendJSONRPC('GUI.ActivateWindow',{"window":"videos","parameters":["plugin://"+addon+"/show/"+tmdbid+"/season/"+seasonNum+"/episodes"]})

        return

    else:
        send_response_message("Opening, " + title + ", on " + addon,title + " played on " + addon)
        sendJSONRPC('GUI.ActivateWindow',{"window":"videos","parameters":["plugin://"+addon+"/show/"+tmdbid+"/seasons"]})

        return
    
 
def get_currently_playing(message_attributes):
    log.info("get_currently_playing(..)")
    response = sendJSONRPC("Player.GetItem",{ "properties": ["title"], "playerid": GetPlayerID() })
    title = response.get("result",[]).get("item").get("title")
    return tell_response_message("Currently Playing " + title, "Currently Playing " + title)
   
def GetPlayerID():
    info = sendJSONRPC("Player.GetActivePlayers")
    result = info.get("result", [])
    if len(result) > 0:
        return result[0].get("playerid")
    else:
        return None


def play_pause(message_attributes):
    log.info("play_pause(..)")
    sendJSONRPC("Player.PlayPause", {"playerid":GetPlayerID()})
    send_response_message("Ok","Kodi Pause/Resumed")
    
def stop(message_attributes):
    log.info("stop(..)")
    sendJSONRPC("Player.Stop", {"playerid":GetPlayerID()})
    send_response_message("Ok","Kodi Stopped")

def play_music(message_attributes):
    return
    
    
def play_movie(message_attributes):#(title,imdbid,netflixid):

    log.info("play_movie(..)")

    try:
        title = message_attributes['title']
        imdbid = message_attributes['imdbid']
    except Exception as e:
        log.info(e)
        traceback.print_exc()
        return send_response_message("Error Playing Movie on Kodi", "Error playing Movie on Kodi")

    library = library = sendJSONRPC('VideoLibrary.GetMovies',{'properties':["imdbnumber"]})
    #library = xbmc.VideoLibrary.GetMovies(properties=["imdbnumber"])
    try:
        movies = library['result']['movies']
        for movie in movies:
            log.info(movie['imdbnumber'])
            if movie['imdbnumber'] == imdbid:
                log.info("\tplaying " + movie['label'] + " " + str(movie['movieid']))
                tell_response_message("Playing the Movie, " + title + ", locally on Kodi",title + " played locally")
                play_local_movie(movie['movieid'])
                return 

    except Exception as e:
        log.info(e)
        traceback.print_exc()
        log.info("\tlocal movie playback failed")
        
    if  cfg.netflix_enabled and 'netflixid' in message_attributes and int(message_attributes['netflixid']) != -1:
        try:
            return watch_netflix(title,message_attributes['netflixid'])
        except:
            log.info("\tError: problem playing Netflix")
            #return tell_response_message("There was a problem playing with Netflix", "There was a problem playing with Netflix")
        
    for addon in cfg.movie_addons:
        try:
            return watch_movie_addon(addon,title,imdbid)
        except Exception as e:
            log.info(e)
            traceback.print_exc()
            log.info('\tError: problem playing with ' + addon)
            #return tell_response_message("There was a problem playing with " + addon, "There was a problem playing with " + addon)

    log.info("\tmovie source not found. exiting")
    return tell_response_message("Couldn't find a source", "Couldn't find a source")

def play_local_movie(movieid):
    sendJSONRPC("Playlist.Clear", {"playlistid": 1})
    sendJSONRPC("Playlist.Add", {"playlistid": 1, "item": {"movieid": int(movieid)}})
    sendJSONRPC('GUI.ActivateWindow',{'window':"videos"})
    sendJSONRPC("Player.Open", {"item": {"playlistid": 1}})
    return

def play_local_show(episode_id):
    sendJSONRPC("Playlist.Clear", {"playlistid": 1})
    sendJSONRPC("Playlist.Add", {"playlistid": 1, "item": {"episodeid": int(episode_id)}})
    sendJSONRPC('GUI.ActivateWindow',{'window':"videos"})
    sendJSONRPC("Player.Open", {"item": {"playlistid": 1}})
    return

def play_series(message_attributes):


    log.info("play_series(..)")

    title = message_attributes['title']
    imdbid = message_attributes['imdbid']

    show_tvdbid,show_tmdbid, episode_tvdbid, season_number, episode_number, episode_title = None,None,None,None,None,None



    if 'show_tvdbid' in message_attributes:
        show_tvdbid = str(message_attributes['show_tvdbid'])
    if 'show_tmdbid' in message_attributes:
        show_tmdbid = str(message_attributes['show_tmdbid'])
    if 'episode_tvdbid' in message_attributes:
        episode_tvdbid = str(message_attributes['episode_tvdbid'])
    if 'seasonNum' in message_attributes:
        season_number = message_attributes['seasonNum']
    if 'episodeNum' in message_attributes:
        episode_number = str(message_attributes['episodeNum'])
    if 'episodeTitle' in message_attributes:
        episode_title = str(message_attributes['episodeTitle'])


    library = sendJSONRPC('VideoLibrary.GetTVShows',{'properties':["imdbnumber"]})
    #library = xbmc.VideoLibrary.GetTVShows(properties=["imdbnumber"])
    
    #print library
    #return
    try:
        shows = library['result']['tvshows']
        for show in shows:
            #print movie['imdbnumber']
            if show['imdbnumber'] == show_tvdbid:
            
                if not season_number:
                    sendJSONRPC('GUI.ActivateWindow',{'window':"videos","parameters":["videodb://2/2/"+str(show['tvshowid'])]})
                    return ask_response_message("Which Season?",title + " opened locally")
                    
               
                    

                elif not episode_number:
                    sendJSONRPC('GUI.ActivateWindow',{'window':"videos","parameters":["videodb://2/2/"+str(show['tvshowid'])+"/"+season_number]})
                    return ask_response_message("Which Episode?",title + " opened locally")
                #print "playing " + show['label']# + " " + str(show['movieid'])
                
                
                if season_number == 'next':
                
                    episodes = sendJSONRPC('VideoLibrary.GetEpisodes',{'tvshowid':show['tvshowid'],'filter':{'field':'playcount', 'operator':'is','value':'0'},'properties':['season','episode']})['result']['episodes']
                    episode = random.choice(episodes)
                    play_local_show(episode['episodeid'])
                    return tell_response_message("Playing, " + title + "," + episode_title + ", locally on Kodi",title + " played locally")
                
                episodes = sendJSONRPC('VideoLibrary.GetEpisodes',{'tvshowid':show['tvshowid'],'properties':['season','episode']})['result']['episodes']
                
                if season_number == 'random':

                    episode = random.choice(episodes)
                    play_local_show(episode['episodeid'])
                    return tell_response_message("Playing, " + episode['showtitle'] + "," + episode['oriignaltitle'] + ", locally on Kodi",episode['showtitle'] + " played locally")
                  
                elif season_number == 'latest':
                
                    episode = episodes[-1]
                    return tell_response_message("Playing, " + title + "," + episode_title + ", locally on Kodi",title + " played locally")
                    
                    
                for episode in episodes: 
                    #print " checking " + season_number + " vs " + episode['season'] + " and " + episode_number + " vs " +episode['episode']
                    if episode['season'] == int(season_number) and episode['episode'] == int(episode_number):
                        log.info("\tplaying " + show['label'] + " " + str(episode['episodeid']))
                        play_local_show(episode['episodeid'])
                        return tell_response_message("Playing, " + title + "," + episode_title + ", locally on Kodi",title + " played locally")
                    
                         

    except Exception as e:
        log.info(e)
        traceback.print_exc()
        log.info("\tlocal show playback failed")

    
    if  cfg.netflix_enabled and 'netflixid' in message_attributes and int(message_attributes['netflixid']) != -1:
        try:
            return watch_netflix(title,message_attributes['netflixid'])
        except:
            log.info("\tError: problem playing netflix")
            #return tell_response_message("There was a problem playing with Netflix", "There was a problem playing with Netflix")

    for addon in cfg.series_addons:
        try:
            return watch_series_addon(addon, title,show_tvdbid,show_tmdbid,season_number,episode_number,episode_title)
        except Exception as e:
            log.info(e)
            traceback.print_exc()
            log.info('\tError: problem playing with ' + addon)
            #return tell_response_message("There was a problem playing with " + addon, "There was a problem playing with " + addon)

    log.info("\tepisode source not found. exiting")
    return tell_response_message("Couldn't find a source", "Couldn't find a source")


def play_random_movie():
    movies_response = sendJSONRPC('VideoLibrary.GetMovies')
    movies = movies_response['result']['movies']
    random_movie = random.choice(movies)
    play_local_movie(random_movie['movieid'])

    #return jsonify(result={"status": 200})


def play_sports(message_attributes):
    for addon in sports_addons:
        #plugin://plugin.video.prosport/?away=Cleveland%20Cavaliers&home=Charlotte%20Hornets&mode=STREAMS&url=https%3a%2f%2fwww.reddit.com%2fr%2fnbastreams
        sendJSONRPC('GUI.ActivateWindow',{"window":"videos","parameters":["plugin://"+addon+"?away="+message_attributes['away']+"&home="+message_attributes['home']+"&mode=STREAMS&url=https%3a%2f%2fwww.reddit.com%2fr%2f"+message_attributes['mode']+"streams"]})
        #print("acton finished finally...")
        send_response_message("Ok","OK")

def play_internet_stream(message_attributes):

    log.info("play_internet_stream(..)")
    #print message_attributes
    send_response_message("good","good")
    # Try to play on Kodi
    streamNum = 0
    while 'url' + str(streamNum) in message_attributes:
        log.info("\tStream number + " + str(streamNum))
        urlin = message_attributes['url' + str(streamNum)]
        log.info("\tcalling getURL")

        url = stream.GetStreams(urlin)
        streamNum = streamNum +1

        log.info("\tURL is " + str(url))
        if url:
            return sendJSONRPC('Player.Open',{'item':{"file":url}})
            

    url=message_attributes['url0']
    
    os.system("pkill chrome")
    
    if "youtube" in url:
        url = url.replace("watch?v=","/v/")
        url = url +  "&autoplay=1"
    
    launch_chrome(url)
    
    return 


def launch_chrome(url):

    log.info("launch_chrome(%s)" % url)
    
    if xbmc.getCondVisibility("system.platform.android"):
        xbmc.executebuiltin("XBMC.StartAndroidActivity(com.android.chrome,android.intent.action.VIEW,,"+url+")")
    else:
        url = '?kiosk=yes&mode=showSite&stopPlayback=yes&url='+url
        sendJSONRPC('Addons.ExecuteAddon',{'addonid':'plugin.program.chrome.launcher','params':[url]})     
    return
    
    
def recent_episodes(message_attributes):

    log.info("recent_episodes()")

    response = sendJSONRPC("VideoLibrary.GetRecentlyAddedEpisodes", { "properties": [ "title", "showtitle" ],"limits":{"end":5}})
    try:
        episodes = response['result']['episodes']
    except:
        return  tell_response_message("You have no new Episodes","No new Episodes")
    speech = "Your newest episodes are. "
    for episode in episodes:
        speech = speech + episode['showtitle'] +', ' + episode['title'] + '.  '

    log.info(speech)
    return  tell_response_message(speech,speech)
    
def recent_movies(message_attributes):

    log.info("recent_movies()")

    response = sendJSONRPC("VideoLibrary.GetRecentlyAddedMovies", { "properties": [ "title"],"limits":{"end":5 }})
    try:
        movies = response['result']['movies']
    except:
        return  tell_response_message("You have no new Movies","No new Movies")
    speech = "Your newest movies are: "
    for movie in movies:
        speech = speech + movie['title'] + '.  '

    log.info(speech)
    return tell_response_message(speech,speech)

def navigate(message_attributes):
    where = message_attributes['nav']
    num = 1
    if message_attributes['num']:
        num = int(message_attributes['num'])
        
    found = False
    for i in range (0,num):
        
        if where == 'up':
            menu_up()
            found = True
        elif where == 'down':
            menu_down()
            found = True
        elif where == 'left':
            menu_left()
            found = True
        elif where == 'right':
            menu_right()
            found = True
        elif where == 'select':
            menu_select()
            found = True
        elif where == 'info':
            info()
            found = True
        elif where == 'home':
            home()
            found = True
        elif where == 'menu':
            context_menu()
            found = True
        elif where == 'back':
            back()
            found = True
   
    if found:
        return send_response_message("OK","Navigate " + where + " received")
    else:
        return send_response_message("No navigation command for " + where,"Navigate " + where + " received")

def ask_response_message(voice,card):
    send_response_message(voice,card,"ask")
      

def tell_response_message(voice,card):
    send_response_message(voice,card,"tell")
   

def send_response_message(voice,card,body = "OK"):

    message = {
        'MessageBody':'body',
        'MessageAttributes':{
            'voice':voice,
            'card':card
        }
    }
    socketIO.emit('client message',message)
    return


message_router = {
    'movie': play_movie,
    'series': play_series,
    'pandora': listen_pandora,
    'sports': play_sports,
    'addon': play_generic_addon,
    'navigate':navigate,
    'playpause':play_pause,
    'stop':stop,
    'playing':get_currently_playing,
    'recent_movies':recent_movies,
    'recent_episodes':recent_episodes
    #'music': play_music
}
    
xbmc.executebuiltin('Notification(Alexa Service,Started,5000,/icon.png)')

def handle_disconnect(*args):
    log.info('socketio:handle_disconnect()')
    xbmc.executebuiltin('Notification(Alexa Service,Disconnect, reconnecting!, 5000,/icon.png)')


def execute_command(*args):
    arg = args[0]

    log.info('socketio:execute_command()')
    log.info(arg)

    #json_args = json.loads(args)
    #print json_args
    try:
        message_router[arg['message']['body']](arg['message']['message_attributes'])
    except Exception as e:
        log.info(e)
        traceback.print_exc()
        send_response_message("Error with command " + arg['message']['body'] + ". Make sure your schema is up to date","ERROR:" + str(e) + " "+ str(traceback.format_exc()))
        

def reconnect():
    log.info('socektio:reconnect()')
    global socketIO
    socketIO.emit('add client',cfg.user_id)

#setup_addons()   
socketIO = SocketIO(cfg.socket_url,cfg.socket_port,LoggingNamespace)
log.info('websocket object created')

socketIO.emit('add client',cfg.user_id)
log.info('\tclient added (%s)' % cfg.user_id)

socketIO.on('disconnect',handle_disconnect)
socketIO.on('server message',execute_command)
socketIO.on('reconnect',reconnect)
log.info('\tmessage hooks added')
#socketIO.wait()
    
log.info('websocket listening')
while(1):
    socketIO.wait()

    #time.sleep(1)
