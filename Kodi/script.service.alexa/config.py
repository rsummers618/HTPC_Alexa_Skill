import xbmc
import json
from addon import ADDON, ADDON_NAME, ADDON_VER
from logger import log

class Configuration:
    socket_url      = ''
    socket_port     = 3000
    user_id         = ''
    enable_netflix  = None # bools,lists can't be initialized
    movie_addons    = None
    series_addons   = None
    sports_addons   = None

log.info('Script [%s] version [%s]' % (ADDON_NAME, ADDON_VER))

# define which video addons alexa script supports
supported_movie_addons  = ['plugin.video.pulsar','plugin.video.quasar']
supported_series_addons = ['plugin.video.pulsar','plugin.video.quasar']
supported_sports_addons = ['plugin.video.prosport']

# initialize
cfg = Configuration()
cfg.enable_netflix      = False
cfg.movie_addons        = []
cfg.series_addons       = []
cfg.sports_addons       = []

#methods
def sendJSONRPC(method,params=None):
    out = {"id":1,"jsonrpc":"2.0","method":method}
    if params:
        out["params"] = params
    sendstring = json.dumps(out)
    #log.info(sendstring)
    return json.loads(xbmc.executeJSONRPC(sendstring))

def setup_video_addons():
    #log.info('setup_video_addons()')
    # send jsonrpc request to get list of enabled video addons
    video_addons = sendJSONRPC('Addons.GetAddons',["xbmc.addon.video","video","all",["name","enabled"]])
    try:
        for video in video_addons['result']['addons']:
            if video['addonid'] in supported_movie_addons:
                cfg.movie_addons.append(video['addonid'])
            if video['addonid'] in supported_series_addons:
                cfg.series_addons.append(video['addonid'])
            if video['addonid'] in supported_sports_addons:
                cfg.sports_addons.append(video['addonid'])
    except:
        log.info('WARNING: no supported video addons found.')

# obey user settings for sources
enable_quasar       = ADDON.getSetting('quasar_enabled') == "true"
if not enable_quasar:
    try:
        supported_movie_addons.remove('plugin.video.quasar')
        supported_series_addons.remove('plugin.video.quasar')
    except:
        log.info('\terror trying to disable quasar (element not found)')

enable_pulsar       = ADDON.getSetting('pulsar_enabled') == "true"
if not enable_pulsar:
    try:
        supported_movie_addons.remove('plugin.video.pulsar')
        supported_series_addons.remove('plugin.video.pulsar')
    except:
        log.info('\terror trying to disable pulsar (element not found)')

# check installed vs. supported to understand which addons the script can access
setup_video_addons()

# save to config object
cfg.socket_url       = ADDON.getSetting('socket_url')        #'http://ec2-54-191-98-39.us-west-2.compute.amazonaws.com'
cfg.socket_port      = int(ADDON.getSetting('socket_port'))  #3000
cfg.user_id          = ADDON.getSetting('authcode')
cfg.enable_netflix   = ADDON.getSetting('netflix_enabled') == "true"

# save to log
log.info('remote:  \t%s:%s' % (cfg.socket_url, cfg.socket_port))
log.info('authcode:\t%s' % cfg.user_id)
log.info('netflix: \t%s' % str(cfg.enable_netflix))
log.info('video addons..')
temp = '\tmovies: '
for name in cfg.movie_addons:
    temp = temp + '[' + name + ']'
log.info(temp)
temp = '\tseries: '
for name in cfg.series_addons:
    temp = temp + '[' + name + ']'
log.info(temp)
temp = '\tsports: '
for name in cfg.sports_addons:
    temp = temp + '[' + name + ']'
log.info(temp)