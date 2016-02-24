#!/usr/bin/python
# encoding: utf-8

#/*
# *      Copyright (C) 2015-2016 gerikss, modded with permission by podgod
# *
# *  This Program is free software; you can redistribute it and/or modify
# *  it under the terms of the GNU General Public License as published by
# *  the Free Software Foundation; either version 2, or (at your option)
# *  any later version.
# *
# *  This Program is distributed in the hope that it will be useful,
# *  but WITHOUT ANY WARRANTY; without even the implied warranty of
# *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# *  GNU General Public License for more details.
# *
# *  You should have received a copy of the GNU General Public License
# *  along with this program; see the file COPYING.  If not, write to
# *  the Free Software Foundation, 675 Mass Ave, Cambridge, MA 02139, USA.
# *  http://www.gnu.org/copyleft/gpl.html
# *
# *  ===================
# *
# *  Sbnation API in this plugin belongs to sbnation.com and being used
# *  only to find NBA/NHL/NFL/MLB games and scores (the same way as on sbnation.com/scoreboard website)
# *
# *  All Reddit resources used in this plugin belong to their owners and reddit.com
# *
# *  All logos used in this plugin belong to their owners
# *
# *  All video streams used in this plugin belong to their owners
# *
# *
# */



import urllib, urllib2, sys, cookielib, base64, re

from datetime import datetime, timedelta
import json
import xbmc
import inspect

plugin = u"Alexa Sports Player"
import calendar, time





def GetStreams(el):

    print "Sports getURL has " + el

    if 'blabseal.com' in el:
        url = Blabseal(el)
        if url:
            return url
    elif '1apps.com' in el:
        url = Oneapp(el)
        if url:
            return url
    elif 'youtu' in el and 'list' not in el:
        url = GetYoutube(el)
        if url:
            return url
    elif 'freecast.in' in el:
        url = Freecastin(el)
        if url:
            return url
    elif 'streamboat.tv' in el:
        url = Streambot(el)
        if url:
            return url
    elif 'nbastream.net' in el:
        print "calling NBASTREAMS"
        url = Nbanhlstreams(el)
        if url:
            return url
    elif 'nhlstream.net' in el:
        url = Nbanhlstreams(el)
        if url:
            return url
    elif 'livenflstream.net' in el:
        url = Nbanhlstreams(el)
        if url:
            return url
    elif 'giostreams.eu' in el:
        url = Giostreams(el)
        if url:
            return url
    elif 'streamendous.com' in el:
        url = Streamendous(el)
        if url:
            return url
    elif 'fs.anvato.net' in el:
        url = Getanvato(el)
        if url:
            return url
    elif 'streamsarena.eu' in el:
        url = Streamarena(el)
        if url:
            return url
    elif 'streamup.com' in el and 'm3u8' not in el:
        url = GetStreamup(el.split('/')[3])
        if url:
            return url
    elif 'torula' in el:
        url = Torula(el)
        if url:
            return url
    elif 'gstreams.tv' in el:
        url = Gstreams(el)
        if url:
            return url
    elif 'nfl-watch.com/live/watch' in el or 'nfl-watch.com/live/-watch' in el or 'nfl-watch.com/live/nfl-network' in el:
        url = Nflwatch(el)
        if url:
            return url
    elif 'ducking.xyz' in el:
        url = Ducking(el)
        if url:
            return url
    elif 'streamandme' in el:
        url = Streamandme(el)
        if url:
            return url
    elif 'mursol.moonfruit.com' in el:
        url = Moonfruit(el)
        if url:
            return url
    elif 'room' in el and 'm3u8' in el:
        url = Getroom(el)
        if url:
            return url
    elif 'm3u8' in el and 'room' not in el and 'anvato' not in el and 'turner.com' not in el:
        url = el
        if url:
            return url
    else:
        print "Nothing Found"
        return False




def GetStreamup(channel):
    try:
        chan = GetJSON('https://api.streamup.com/v1/channels/' + channel)
        if chan['channel']['live']:
            videoId = chan['channel']['capitalized_slug'].lower()
            domain = GetURL('https://lancer.streamup.com/api/redirect/' + videoId)
            return 'https://' + domain + '/app/' + videoId + '/playlist.m3u8'
    except:
        return None


def GetYoutube(url):
    try:
        if 'channel' in url and 'live' in url:
            html = GetURL(url)
            videoId = html.split("https://www.youtube.com/watch?v=")[-1].split('">')[0]
            link = 'plugin://plugin.video.youtube/?action=play_video&videoid=' + videoId
            return link
        regex = (
            r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})')
        youtube_regex_match = re.match(regex, url)
        videoId = youtube_regex_match.group(6)
        link = 'plugin://plugin.video.youtube/?action=play_video&videoid=' + videoId
        return link
    except:
        return None


def Getanvato(url):
    try:
        if 'master' in url:
            return url
        else:
            lst = url.split('/')
            link = url.replace(lst[len(lst) - 2], '4028k')
            return link
    except:
        return None


def Getroom(url):
    try:
        if 'master' in url:
            return url
        else:
            lst = url.split('/')
            link = url.replace(lst[len(lst) - 2], '4028k')
            return link
    except:
        return url


def Blabseal(url):
    try:
        html = GetURL(url)
        block_content = parseDOM(html, "iframe", ret="src")[0]
        link = GetYoutube(block_content)
        return link
    except:
        return None

def Nbatv(url):
    try:
        html = GetURL(url)
        block_content = parseDOM(html, "input", attrs={"type": "text"}, ret="value")
        link = block_content[0]
        if 'neulion' in link or 'turner' in link:
            return link
    except:
        return None


def Oneapp(url):
    try:
        html = GetURL(url)
        block_content = parseDOM(html, "iframe", ret="src")[0]
        link = GetYoutube(block_content)
        return link
    except:
        return None


def Torula(url):
    try:
        html = GetURL(url)
        block_content = parseDOM(html, "input", attrs={"id": "vlc"}, ret="value")[0]
        link = block_content
        return link
    except:
        return None


def Freecastin(url):
    try:
        html = GetURL(url)
        block_content = parseDOM(html, "iframe", attrs={"width": "100%"}, ret="src")[0]
        link = GetYoutube(block_content)
        return link
    except:
        return None


def Streambot(url):
    try:
        cookieJar = cookielib.CookieJar()
        opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cookieJar), urllib2.HTTPHandler())
        conn = urllib2.Request('https://streamboat.tv/signin')
        connection = opener.open(conn)
        for cookie in cookieJar:
            token = cookie.value
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.3) Gecko/2008092417 Firefox/3.0.3",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": "_gat=1; csrftoken=" + token + "; _ga=GA1.2.943051497.1450922237",
            "Origin": "https://streamboat.tv",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.8,bg;q=0.6,it;q=0.4,ru;q=0.2,uk;q=0.2",
            "Accept-Encoding": "windows-1251,utf-8;q=0.7,*;q=0.7",
            "Referer": "https://streamboat.tv/signin"
        }
        reqData = {'csrfmiddlewaretoken': token, 'username': 'test_user', 'password': 'password'}
        conn = urllib2.Request('https://streamboat.tv/signin', urllib.urlencode(reqData), headers)
        connection = opener.open(conn)
        conn = urllib2.Request(url)
        connection = opener.open(conn)
        html = connection.read()
        connection.close()
        block_content = parseDOM(html, "source", attrs={"type": "application/x-mpegURL"}, ret="src")[0]
        link = block_content
        return link
    except:
        return None


def Nbanhlstreams(url):

    print "NBANHLSTREAMS"
    try:
        if 'nba' in url:
            URL = 'http://www.nbastream.net/'
        elif 'nhl' in url:
            URL = 'http://www.nhlstream.net/'
        elif 'nfl' in url:
            URL = 'http://www.livenflstream.net/'
        print "GOTURL"
        html = GetURL(url)
        print "GOTURL2"
        link = parseDOM(html, "iframe", ret="src")[0]
        print "GOTURL3"
        html = GetURL(URL + link)
        print "GOTURL4"
        link = parseDOM(html, "iframe", ret="src")[0]
        print "GOTURL5"
        if 'streamup' in link:
            channel = link.split('/')[3]
            link = GetStreamup(channel)
            return link
    except:
        return None


def Streamandme(url):
    try:
        html = GetURL(url)
        link = parseDOM(html, "iframe", ret="src")[0]
        channel = link.split('/')[3]
        link = GetStreamup(channel)
        return link
    except:
        return None


def Gstreams(url):
    try:
        html = GetURL(url)
        link = parseDOM(html, "iframe", ret="src")[0]
        if 'gstreams.tv' in link:
            html = GetURL(link)
            link = html.split('https://')[1]
            link = link.split('",')[0]
            link = 'https://' + link
            return link
        elif 'streamup.com' in link and 'm3u8' not in link:
            channel = link.split('/')[3]
            link = GetStreamup(channel)
            return link
        elif 'youtu' in link:
            link = GetYoutube(link)
            return link
        elif 'm3u8' in link:
            return link
    except:
        return None


def Moonfruit(url):
    try:
        cookieJar = cookielib.CookieJar()
        opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cookieJar), urllib2.HTTPHandler())
        conn = urllib2.Request(url + '/htown3')
        connection = opener.open(conn)
        for cookie in cookieJar:
            token = cookie.value
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.3) Gecko/2008092417 Firefox/3.0.3",
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": "markc=" + token,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.8,bg;q=0.6,it;q=0.4,ru;q=0.2,uk;q=0.2",
        }
        html = connection.read()
        link = parseDOM(html, "iframe", ret="src")
        link = url + link[-1]
        conn = urllib2.Request(link, headers=headers)
        connection = opener.open(conn)
        html = connection.read()
        link = parseDOM(html, "iframe", ret="src")[0]
        if 'streamup.com' in link:
            channel = link.split('/')[4]
            link = GetStreamup(channel)
            return link
    except:
        return None


def Nflwatch(url):
    try:
        html = GetURL(url)
        links = parseDOM(html, "iframe", ret="src")
        for link in links:
            if 'streamup' in link:
                channel = link.split('/')[3]
                link = GetStreamup(channel)
                return link
            else:
                continue
        if 'p2pcast.tv' in html:
            agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36'
            id = html.split("'text/javascript'>id='")[-1]
            id = id.split("';")[0]
            url = 'http://p2pcast.tv/stream.php?id=' + id + '&live=0&p2p=0&stretching=uniform'
            request = urllib2.Request(url)
            request.add_header('User-Agent', agent)
            request.add_header('Referer', url)
            response = urllib2.urlopen(request)
            html = response.read()
            token = html.split('murl = "')[1].split('";')[0]
            link = base64.b64decode(token)
            request = urllib2.Request('http://p2pcast.tv/getTok.php')
            request.add_header('User-Agent', agent)
            request.add_header('Referer', url)
            request.add_header('X-Requested-With', 'XMLHttpRequest')
            response = urllib2.urlopen(request)
            html = response.read()
            js = json.loads(html)
            tkn = js['token']
            link = link + tkn
            link = link + '|User-Agent=' + agent + '&Referer=' + url
            return link
    except:
        return None


def Ducking(url):
    try:
        request = urllib2.Request('http://www.ducking.xyz/kvaak/stream/basu.php')
        request.add_header('Referer', 'www.ducking.xyz/kvaak/')
        request.add_header('User-Agent',
                           'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36')
        response = urllib2.urlopen(request)
        html = response.read()
        link = parseDOM(html, "iframe", ret="src")[0]
        channel = link.split('/')[3]
        link = GetStreamup(channel)
        return link
    except:
        return None


def Streamarena(url):
    try:
        html = GetURL(url)
        link = parseDOM(html, "iframe", ret="src")[0]
        link = link.replace('..', 'http://www.streamsarena.eu/')
        html = GetURL(link)
        link = parseDOM(html, "iframe", ret="src")[0]
        channel = link.split('/')[3]
        link = GetStreamup(channel)
        return link
    except:
        return None


def Livesports101(url):
    try:
        url = url.split('</strong>')[0]
        url = 'http://www.101' + url.split('101')[1]
        html = GetURL(url)
        try:
            block_content = parseDOM(html, "meta", attrs={"property": "og:description"}, ret="content")
            for el in block_content:
                if 'youtube.com' in el:
                    link = GetYoutube(block_content)
                    return link
                elif 'streamboat.tv' in el:
                    link = el
                    link = link.split('http://')[1]
                    link = link.split("'")[0]
                    link = 'http://' + link
                    return link
                elif 'streamup' in el:
                    link = el
                    link = link.split('https://')[1]
                    link = link.split("'")[0]
                    link = 'https://' + link
                    return link
        except:
            pass
        try:
            block_content = parseDOM(html, "embed", attrs={"id": "vlcp"}, ret="target")[0]
            if 'streamboat' in block_content or 'streamup' in block_content:
                link = block_content
                return link
        except:
            pass
        try:
            block_content = parseDOM(html, "iframe", ret="src")[0]
            if 'streamup' in block_content:
                channel = block_content.split('/')[3]
                link = GetStreamup(channel)
                return link
        except:
            pass
    except:
        return None


def Streamendous(url):
    try:
        html = GetURL(url)
        req = parseDOM(html, 'iframe', attrs={'id': 'player'}, ret='src')
        url = url.split('/ch')[0] + req[0]
        html = GetURL(url)
        req = parseDOM(html, 'iframe', attrs={'id': 'player'}, ret='src')[0]
        html = GetURL(req, referer=req)
        link = re.compile('src="(.+?)"').findall(str(html))
        for item in link:
            if ('sawlive') in item:
                url = sawresolve(item)
                return url
            else:
                pass
        return None
    except:
        return None


def Giostreams(url):
    try:
        req = GetURL(url)
        result = parseDOM(req, 'iframe', ret='src')[0]
        this = GetURL(result, referer=result)
        link = re.compile('src="(.+?)"').findall(str(this))[0]
        if ('sawlive') in link:
            link = sawresolve(link)
            return link
        else:
            pass
        return None
    except:
        return None


def sawresolve(url):
    try:
        page = re.compile('//(.+?)/(?:embed|v)/([0-9a-zA-Z-_]+)').findall(url)[0]
        page = 'http://%s/embed/%s' % (page[0], page[1])
        try:
            referer = urlparse.parse_qs(urlparse.urlparse(url).query)['referer'][0]
        except:
            referer = page
        request = urllib2.Request(url)
        request.add_header('Referer', referer)
        request.add_header('User-Agent',
                           'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36')
        response = urllib2.urlopen(request)
        result = response.read()
        unpacked = ''
        packed = result.split('\n')
        for i in packed:
            try:
                unpacked += unpack(i)
            except:
                pass
        result += unpacked
        result = urllib.unquote_plus(result)
        result = re.sub('\s\s+', ' ', result)
        url = parseDOM(result, 'iframe', ret='src')[-1]
        url = url.replace(' ', '').split("'")[0]
        ch = re.compile('ch=""(.+?)""').findall(str(result))
        ch = ch[0].replace(' ', '')
        sw = re.compile(" sw='(.+?)'").findall(str(result))
        url = url + '/' + ch + '/' + sw[0]
        try:
            url = url.replace('watch//', 'watch/')
        except:
            pass
        request = urllib2.Request(url)
        request.add_header('Referer', referer)
        request.add_header('User-Agent',
                           'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36')
        response = urllib2.urlopen(request)
        result = response.read()
        file = re.compile("'file'.+?'(.+?)'").findall(result)[0]
        try:
            if not file.startswith('http'):
                raise Exception()
            request = urllib2.Request(file)
            response = urllib2.urlopen(request)
            url = response.geturl()
            if not '.m3u8' in url:
                raise Exception()
            url += '|%s' % urllib.urlencode({
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36',
                'Referer': file})
            return url
        except:
            pass
        strm = re.compile("'streamer'.+?'(.+?)'").findall(result)[0]
        swf = re.compile("SWFObject\('(.+?)'").findall(result)[0]
        url = '%s playpath=%s swfUrl=%s pageUrl=%s live=1 timeout=40' % (strm, file, swf, url)
        return url
    except:
        return None


def GetJSON(url):
    request = urllib2.Request(url)
    request.add_header('User-Agent', 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.3) Gecko/2008092417 Firefox/3.0.3')
    try:
        response = urllib2.urlopen(request)
        f = response.read()
        jsonDict = json.loads(f)
        return jsonDict
    except:
        #xbmcgui.Dialog().ok(__addonname__, 'Looks like '+url+' is down... Please try later...')
        return None


def unpack(source):
    payload, symtab, radix, count = _filterargs(source)
    if count != len(symtab):
        raise UnpackingError('Malformed p.a.c.k.e.r. symtab.')
    try:
        unbase = Unbaser(radix)
    except TypeError:
        raise UnpackingError('Unknown p.a.c.k.e.r. encoding.')
    def lookup(match):
        """Look up symbols in the synthetic symtab."""
        word = match.group(0)
        return symtab[unbase(word)] or word
    source = re.sub(r'\b\w+\b', lookup, payload)
    source = source.replace("\\'", "'")
    return _replacestrings(source)

dbg = True
dbglevel = 3

def log(description, level=0):
    if dbg and dbglevel > level:
        try:
            xbmc.log((u"[%s] %s : '%s'" % (plugin, inspect.stack()[1][3], description)).decode("utf-8"), xbmc.LOGNOTICE)
        except:
            xbmc.log(u"FALLBACK [%s] %s : '%s'" % (plugin, inspect.stack()[1][3], repr(description)), xbmc.LOGNOTICE)


def parseDOM(html, name=u"", attrs={}, ret=False):
    log("Name: " + repr(name) + " - Attrs:" + repr(attrs) + " - Ret: " + repr(ret) + " - HTML: " + str(type(html)), 3)

    if isinstance(name, str): # Should be handled
        try:
            name = name #.decode("utf-8")
        except:
            log("Couldn't decode name binary string: " + repr(name))

    if isinstance(html, str):
        try:
            html = [html.decode("utf-8")] # Replace with chardet thingy
        except:
            log("Couldn't decode html binary string. Data length: " + repr(len(html)))
            html = [html]
    elif isinstance(html, unicode):
        html = [html]
    elif not isinstance(html, list):
        log("Input isn't list or string/unicode.")
        return u""

    if not name.strip():
        log("Missing tag name")
        return u""

    ret_lst = []
    for item in html:
        temp_item = re.compile('(<[^>]*?\n[^>]*?>)').findall(item)
        for match in temp_item:
            item = item.replace(match, match.replace("\n", " "))

        lst = _getDOMElements(item, name, attrs)

        if isinstance(ret, str):
            log("Getting attribute %s content for %s matches " % (ret, len(lst) ), 3)
            lst2 = []
            for match in lst:
                lst2 += _getDOMAttributes(match, name, ret)
            lst = lst2
        else:
            log("Getting element content for %s matches " % len(lst), 3)
            lst2 = []
            for match in lst:
                log("Getting element content for %s" % match, 4)
                temp = _getDOMContent(item, name, match, ret).strip()
                item = item[item.find(temp, item.find(match)) + len(temp):]
                lst2.append(temp)
            lst = lst2
        ret_lst += lst

    log("Done: " + repr(ret_lst), 3)
    return ret_lst
    
def GetURL(url, referer=None):
    request = urllib2.Request(url)
    request.add_header('User-Agent', 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.3) Gecko/2008092417 Firefox/3.0.3')
    if referer:
    	request.add_header('Referer', referer)
    try:
    	response = urllib2.urlopen(request, timeout=5)
    	html = response.read()
    	return html
    except:
    	if 'reddit' in url:
    		xbmcgui.Dialog().ok(__addonname__, 'Looks like '+url+' is down... Please try later...')
    	return None


