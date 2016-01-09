
import webbrowser
import os
import xbmcjson
import time
import random
from threading import Thread
import sys
from multiprocessing import Pool
import pyautogui
import subprocess



# Load the kodi.py file from the same directory where this wsgi file is located
sys.path += [os.path.dirname(__file__)]
import kodi



#var request = requre('request')

# MacOS
#chrome_path = 'open -a /Applications/Google\ Chrome.app %s'

# Windows
#chrome_path = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe %s"

# Linux
chrome_path = '/usr/bin/google-chrome %s'

kodi_address = 'http://localhost'
kodi_port = #Kodi Webinterface Port
kodi_username = #Kodi Webinterface Username
kodi_password = #Kodi WebInterface Password


xbmc = xbmcjson.XBMC(kodi_address+':'+kodi_port+'/jsonrpc',kodi_username,kodi_password)

# We need to import request to access the details of the POST request
# and render_template, to render our templates (form and response)
# we'll use url_for to get some URLs for the app on the templates
from flask import Flask, render_template, request, url_for, jsonify

# Initialize the Flask application
app = Flask(__name__)

app.debug = True
app.propogate_exceptions = False

# Define a route for the default URL, which loads the form
@app.route('/')
def form():
    print "received"
    return

# Define a route for the action of the form, for example '/hello/'
# We are also defining which type of requests this route is 
# accepting: POST requests in this case
@app.route('/listen/pandora/<stationname>')
def listen_pandora(stationname):
    
    #xbmc.GUI.ActivateWindow(window="videos",paramaters=['plugin://plugin.audio.pandoki/?play='+pandoraid])
    pool = Pool(processes=1)
    result = pool.apply_async(pandora_work,[stationname])

    #xbmc.GUI.ActivateWindow(window="videos",paramaters=['plugin://plugin.audio.pandoki/?play='+pandoraid])
    return jsonify(result={"status": 200})

def pandora_work(stationname):
    xbmc.Addons.ExecuteAddon(addonid='plugin.audio.pandoki')#,params={"search":"hcraes"})
    time.sleep(3)
    xbmc.Input.Select()
    time.sleep(1)
    xbmc.Input.SendText(text=stationname,done=True)
    time.sleep(2)
    xbmc.Input.Down()
    time.sleep(1)
    xbmc.Input.Select()
    return

@app.route('/watch/netflix/<netflixid>')#, methods=['GET'])
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
 
    os.system("pkill chrome")

    #time.sleep(3)

    xbmc.Addons.ExecuteAddon(addonid='plugin.program.chrome.launcher',params=[stringparam])


    return jsonify(result={"status": 200,"voice":"Playing, " + title + ", on Netflix","card":title + " played on Netflix"})

@app.route('/watch/movie/pulsar/<imdbid>')#, methods=['GET'])
def watch_movie_pulsar(title,imdbid):

    #harmony_tv()
    print "received imdbid " + imdbid

    #Thread(target=pulsar_movie_work(moviename)).start()
    pool = Pool(processes=1)
    result = pool.apply_async(pulsar_movie_work,[imdbid])

    return jsonify(result={"status": 200,"voice":"Playing the Movie, " + title + ", on Pulsar","card":title + " played on Pulsar"})

def pulsar_movie_work(imdbid):

    xbmc.Player.Open(item={"file":"plugin://plugin.video.pulsar/movie/"+imdbid+"/play"})    
    return


@app.route('/watch/series/pulsar/<imdbid>')#, methods=['GET'])
def watch_series_pulsar(title,imdbid):

    #harmony_tv()
    print "received showname " + imdbid

    #Thread(target=pulsar_series_work(showname)).start()
    pool = Pool(processes=1)
    result = pool.apply_async(pulsar_series_work,[imdbid])


    return jsonify(result={"status": 200,"voice":"Playing the Series, " + title + ", on pulsar","card":title + " played on pulsar"})
 


def pulsar_series_work(showname):
   
    #xbmc.Player.Open(item={"file":"plugin:\/\/plugin.video.pulsar\/shows\/"+imdbid})

    
    #xbmc.GUI.ActivateWindow(window="videos",parameters=["plugin://plugin.video.pulsar/movies/search/"+imdbid])#+"/play"])
    #xbmc.GUI.ActivateWindow(window="videos",parameters=["plugin://plugin.video.pulsar/movie/"+imdbid+"/links"])
    #time.sleep(3)
    xbmc.GUI.ActivateWindow(window="videos",parameters=["plugin://plugin.video.pulsar/shows/"])
    time.sleep(1)
    xbmc.Input.Down()
    time.sleep(1)
    xbmc.Input.Select()
    time.sleep(1)
    xbmc.Input.SendText(text=showname,done=True)
    time.sleep(1)
    xbmc.Input.Down()
    time.sleep(1)
    xbmc.Input.Select()
    #time.sleep(3)
    #xbmc.Input.Select()
    
    return

    
'''
@app.route('/watch/tv/pulsar/<tvdb>')#, methods=['GET'])
def watch_tv_pulsar(tvdb):

    #harmony_tv()
    print "received tvdb " + tvdb

    xbmc.GUI.ActivateWindow(window="videos",parameters=["plugin://plugin.video.pulsar/show/"+tvdb+"/seasons"])
    return jsonify(result={"status": 200})
'''



@app.route('/kodi/playpause')
def play_pause():
    kodi.PlayPause()
    return jsonify(result={"status": 200})

@app.route('/kodi/movie/<title>/<imdbid>/<netflixid>')
def play_movie(title,imdbid,netflixid):
    library = xbmc.VideoLibrary.GetMovies(properties=["imdbnumber"])
    movies = library['result']['movies']
    for movie in movies:
        #print movie['imdbnumber']
        if movie['imdbnumber'] == imdbid:
            #print "plaing " + movie['label'] + " " + str(movie['movieid'])
            pool = Pool(processes=1)
            result = pool.apply_async(local_video_work,[movie['movieid']])
            #kodi.ClearVideoPlaylist()
            #kodi.PrepMoviePlaylist(movie['movieid'])
            #xbmc.GUI.ActivateWindow(window="videos")
            #kodi.StartVideoPlaylist()
            return jsonify(result={"status": 200,"voice":"Playing the Movie, " + title + ", locally on Kodi","card":title + " played locally"})
    print "netflixid is " + netflixid
    if netflixid == '-1':
        print "pulsar"
        return watch_movie_pulsar(title,imdbid)
    else:
        return watch_netflix(title,netflixid)

def local_video_work(movieid):
    kodi.ClearVideoPlaylist()
    kodi.PrepMoviePlaylist(movieid)
    xbmc.GUI.ActivateWindow(window="videos")
    kodi.StartVideoPlaylist()
    return

@app.route('/kodi/series/<title>/<imdbid>/<netflixid>')
def play_series(title,imdbid,netflixid):
    library = xbmc.VideoLibrary.GetTVShows(properties=["imdbnumber"])
    '''
    print library
    return
    movies = library['result']#['movies']
    for movie in movies:
        #print movie['imdbnumber']
        if movie['imdbnumber'] == imdbid:
            #print "plaing " + movie['label'] + " " + str(movie['movieid'])
            kodi.ClearVideoPlaylist()
            kodi.PrepMoviePlaylist(movie['movieid'])
            xbmc.GUI.ActivateWindow(window="videos")
            kodi.StartVideoPlaylist()
            return jsonify(result={"status": 200})
    print "netflixid is " + netflixid
    '''
    if netflixid == '-1':
        print "pulsar"
        return watch_series_pulsar(title,imdbid)
    else:
        return watch_netflix(title,netflixid)

@app.route('/kodi/randommovie')
def play_random_movie():
    movies_response = kodi.GetMovies()
    movies = movies_response['result']['movies']
    random_movie = random.choice(movies)

    kodi.ClearVideoPlaylist()
    kodi.PrepMoviePlaylist(random_movie['movieid'])
    xbmc.GUI.ActivateWindow(window="videos")
    kodi.StartVideoPlaylist()
    return jsonify(result={"status": 200})

@app.route('/watch/sports')
def play_sports_stream():
    url = request.data
    print url
    
    #ports_work
    pool = Pool(processes=1)
    result = pool.apply_async(sports_work,[url])

    return jsonify(result={"status": 200})

def sports_work(url):
 
    os.system("pkill chrome")
    launch_chrome(url)

    #xbmc.Addons.ExecuteAddon(addonid='plugin.program.chrome.launcher',params=[url])
    
    #pyautogui.keyDown('t')
    return

def launch_chrome(url):

    

    if "youtube" in url:
        url = url.replace("watch?v=","/v/")
        url = url +  "&autoplay=1"

    url = url + "#sports"
    url = '?kiosk=yes&mode=showSite&stopPlayback=yes&url='+url

    xbmc.Addons.ExecuteAddon(addonid='plugin.program.chrome.launcher',params=[url])
    #subprocess.Popen('\"/usr/bin/google-chrome\" --start-maximized --disable-translate --disable-new-tab-first-run --no-default-browser-check --no-first-run  --kiosk \"'+url+'\"', shell=True)
    
    if not "youtube" in url:
        time.sleep(5)
        pyautogui.keyDown('ctrl')
        time.sleep(1)
        pyautogui.press('space')
        pyautogui.keyUp('ctrl')
        
    return



# Run the app :)
if __name__ == '__main__':
  app.run( 
        host="0.0.0.0",
        port=int("9250")
  )
