import xbmc
import json
from addon import ADDON, ADDON_NAME, ADDON_VER
from logger import log
import gen_settings
import os
import xml.etree.ElementTree as ET

class Configuration:
    socket_url      = ''
    socket_port     = 3000
    user_id         = ''
    enable_netflix  = None # bools,lists can't be initialized
    movie_addons    = None
    series_addons   = None
    sports_addons   = None

log.info('Script [%s] version [%s]' % (ADDON_NAME, ADDON_VER))

gen_settings.write_settings()

supported_xml = os.path.join(os.path.dirname(__file__), 'resources','supported.xml')

# define which video addons alexa script supports
'''
supported_movie_addons  = []
supported_series_addons = []
supported_sports_addons = []
supported_live_addons = []
supported_music_addons = []
'''

# initialize
cfg = Configuration()
cfg.movie_addons        = []
cfg.series_addons       = []
cfg.sports_addons       = []
cfg.live_addons         = []
cfg.music_addons        = []

tree_root = ET.parse(supported_xml).getroot()

#methods
def sendJSONRPC(method,params=None):
    out = {"id":1,"jsonrpc":"2.0","method":method}
    if params:
        out["params"] = params
    sendstring = json.dumps(out)
    #log.info(sendstring)
    return json.loads(xbmc.executeJSONRPC(sendstring))

def setup_addons(root):


    addon_obj = sendJSONRPC('Addons.GetAddons',["unknown","unknown","all",["name","enabled"]])
    enabled_addons = []

    for addon in addon_obj['result']['addons']:
        enabled_addons.append(addon['addonid'])


    for category in root:
        for addon in category:

            if addon.attrib['type'] == 'plugin':
                addon_id = addon.attrib['type']+'.' +addon.attrib['prefix']+'.'+addon.attrib['name']

            elif addon.attrib['type'] == 'website':
                addon_id = 'plugin.program.chrome.launcher'
            else:
                continue

            enabled_string = category.attrib['type'] + '_' + addon.attrib['name']
            enabled = ADDON.getSetting(enabled_string)

            if addon_id in enabled_addons and enabled == 'true':
                if category.attrib['type'] == 'series':
                    cfg.series_addons.append({'name':addon.attrib['name'], 'id':addon_id,'function_type':addon.attrib['function_type'],'function_vars':addon.attrib['function_vars']})
                if category.attrib['type'] == 'movies':
                    cfg.movie_addons.append({'name':addon.attrib['name'], 'id':addon_id,'function_type':addon.attrib['function_type'],'function_vars':addon.attrib['function_vars']})
                if category.attrib['type'] == 'music':
                    cfg.music_addons.append({'name':addon.attrib['name'], 'id':addon_id,'function_type':addon.attrib['function_type'],'function_vars':addon.attrib['function_vars']})
                if category.attrib['type'] == 'live':
                    cfg.live_addons.append({'name':addon.attrib['name'], 'id':addon_id,'function_type':addon.attrib['function_type'],'function_vars':addon.attrib['function_vars']})
                if category.attrib['type'] == 'sports':
                    cfg.sports_addons.append({'name':addon.attrib['name'], 'id':addon_id,'function_type':addon.attrib['function_type'],'function_vars':addon.attrib['function_vars']})



# check installed vs. supported to understand which addons the script can access
#setup_addons(supported_movie_addons, supported_series_addons, supported_sports_addons, supported_live_addons, supported_music_addons)
setup_addons(tree_root)

# save to config object
cfg.socket_url       = ADDON.getSetting('socket_url')        #'http://ec2-54-191-98-39.us-west-2.compute.amazonaws.com'
cfg.socket_port      = int(ADDON.getSetting('socket_port'))  #3000
cfg.user_id          = ADDON.getSetting('authcode')

# save to log
log.info('remote:  \t%s:%s' % (cfg.socket_url, cfg.socket_port))
log.info('authcode:\t%s' % cfg.user_id)
log.info('Enabled Addons..')
temp = '\tmovies: '
for name in cfg.movie_addons:
    temp = temp + '[' + name['name'] + ']'
log.info(temp)
temp = '\tseries: '
for name in cfg.series_addons:
    temp = temp + '[' + name['name']+ ']'
log.info(temp)
temp = '\tmusic: '
for name in cfg.music_addons:
    temp = temp + '[' + name['name']+ ']'
log.info(temp)
temp = '\tlive: '
for name in cfg.live_addons:
    temp = temp + '[' + name['name']+ ']'
log.info(temp)
temp = '\tsports: '
for name in cfg.sports_addons:
    temp = temp + '[' + name['name'] + ']'
log.info(temp)