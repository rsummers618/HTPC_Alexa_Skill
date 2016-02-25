# attribution: original source from xbmcswift2.logger
import logging
import xbmc
from addon import ADDON_ID, CLI_MODE


# TODO: CLI mode currently just logs to file '%(ADDON_ID)s.log'
#       Actual CLI could be more useful for debugging/testing purposes.
# TODO: Allow a global flag to set logging level when dealing with XBMC
# TODO: Add -q and -v flags to CLI to quiet or enable more verbose logging


class XBMCFilter(object):
    '''A logging filter that streams to file or to the xbmc log if
    running inside XBMC.
    '''
    python_to_xbmc = {
        'DEBUG': 'LOGDEBUG',
        'INFO': 'LOGNOTICE',
        'WARNING': 'LOGWARNING',
        'ERROR': 'LOGERROR',
        'CRITICAL': 'LOGSEVERE',
    }

    xbmc_levels = {
        'LOGDEBUG': 0,
        'LOGINFO': 1,
        'LOGNOTICE': 2,
        'LOGWARNING': 3,
        'LOGERROR': 4,
        'LOGSEVERE': 5,
        'LOGFATAL': 6,
        'LOGNONE': 7,
    }

    def __init__(self, prefix):
        self.prefix = prefix

    def filter(self, record):
        # When running in XBMC, any logged statements will be double printed
        # since we are calling xbmc.log() explicitly. Therefore we return False
        # so every log message is filtered out and not printed again.
        if CLI_MODE:
            return True
        else:
            # Must not be imported until here because of import order issues
            # when running in CLI
            xbmc_level = XBMCFilter.xbmc_levels.get(
                XBMCFilter.python_to_xbmc.get(record.levelname))
            xbmc.log('%s %s' % (self.prefix, record.getMessage()), xbmc_level)
            return False


if CLI_MODE:
    GLOBAL_LOG_LEVEL = logging.INFO
else:
    GLOBAL_LOG_LEVEL = logging.DEBUG


def setup_log(name):
    '''Returns a logging instance for the provided name. The returned
    object is an instance of logging.Logger. Logged messages will be
    printed to file when running in the CLI, or forwarded to XBMC's
    log when running in XBMC mode.
    '''
    _log = logging.getLogger(name)
    _log.setLevel(GLOBAL_LOG_LEVEL)
    if CLI_MODE:
        handler = logging.FileHandler('%s.log' % name)
    else:
        handler = logging.StreamHandler()
        
    handler.setFormatter(logging.Formatter('[%(name)s] %(message)s'))
    _log.addHandler(handler)
    _log.addFilter(XBMCFilter('[%s]' % name))
    return _log

log = setup_log(ADDON_ID)