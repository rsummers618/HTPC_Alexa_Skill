import xbmcaddon

### Addon Details ###
ADDON       = xbmcaddon.Addon()
ADDON_ID    = ADDON.getAddonInfo("id")
ADDON_NAME  = ADDON.getAddonInfo("name")
ADDON_PATH  = ADDON.getAddonInfo("path")
ADDON_VER   = ADDON.getAddonInfo("version")

### SETTINGS ###
CLI_MODE    = False # No CLI has been implemented (this is a setting imported from xbmcswift2)