import xbmc
import json
from addon import ADDON
from logger import log

log.info('Script [%s] version [%s]' % (ADDON_NAME, ADDON_VER))
log.info('config.py')

# define which video addons alexa script supports
supported_movie_addons  = ['plugin.video.pulsar','plugin.video.quasar']
supported_series_addons = ['plugin.video.pulsar','plugin.video.quasar']
supported_sports_addons = ['plugin.video.prosport']

# initialize
movie_addons        = []
series_addons       = []
sports_addons       = []

def sendJSONRPC(method,params=None):
    out = {"id":1,"jsonrpc":"2.0","method":method}
    if params:
        out["params"] = params
    sendstring = json.dumps(out)
    log.info(sendstring)
    return json.loads(xbmc.executeJSONRPC(sendstring))

def setup_video_addons():
    log.info('setup_video_addons()')

    # send jsonrpc request to get list of enabled video addons
    video_addons = sendJSONRPC('Addons.GetAddons',{"type":"xbmc.addon.video","content":"video","enabled":"true","properties":["path","name"]})
    for video in video_addons:
        if video.name in supported_movie_addons:
            log.info('\tmovie: plugin.video.%s' % video.name)
            movie_addons.append('plugin.video.' + video.name)
        if video.name in supported_series_addons:
            log.info('\tseries: plugin.video.%s' % video.name)
            series_addons.append('plugin.video.' + video.name)
        if video.name in supported_sports_addons:
            log.info('\tsports: plugin.video.%s' % video.name)
            sports_addons.append('plugin.video.' + video.name)

# obey user settings for sources
enable_quasar       = ADDON.getSetting('quasar_enabled') == "true"
if not enable_quasar:
    try:
        supported_movie_addons.remove('plugin.video.quasar')
        supported_series_addons.remove('plugin.video.quasar')
    except:
        log.info('\terror trying to disable quasar usage (element not found)')

enable_pulsar       = ADDON.getSetting('pulsar_enabled') == "true"
if not enable_pulsar:
    try:
        supported_movie_addons.remove('plugin.video.pulsar')
        supported_series_addons.remove('plugin.video.pulsar')
    except:
        log.info('\terror trying to disable pulsar usage (element not found)')

# check installed vs. supported to understand what things are active
setup_video_addons()

# save to config object
config.socket_url       = ADDON.getSetting('socket_url')        #'http://ec2-54-191-98-39.us-west-2.compute.amazonaws.com'
config.socket_port      = int(ADDON.getSetting('socket_port'))  #3000
config.user_id          = ADDON.getSetting('authcode')
config.enable_netflix   = ADDON.getSetting('netflix_enabled') == "true"
config.movie_addons     = movie_addons
config.series_addons    = series_addons
config.sports_addons    = sports_addons

#save to log
log.info('remote:  \t%s:%s' % (config.socket_url, config.socket_port))
log.info('authcode:\t%s' % config.user_id)
log.info('netflix: \t%s' % str(config.enable_netflix))
log.info('video addons:')
temp = '\tmovies: '
for name in movie_addons
    temp = temp + '[' + name + ']'
log.info(temp)
temp = '\tseries: '
for name in series_addons
    temp = temp + '[' + name + ']'
log.info(temp)
temp = '\tsports: '
for name in sports_addons
    temp = temp + '[' + name + ']'
log.info(temp)