var google = require('./lib/google.js')
var request = require('request');
var cheerio = require('cheerio');
var google_genuine = require('googleapis');
var customsearch = google_genuine.customsearch('v1');




google.resultsPerPage = 10
var nextCounter = 4

const API_KEY ='XXXXXXXXXXXX'  // YOUR GOOGLE API KEY
const CX = 'XXXXXXXXXXX'  // YOOUR GOOGLE CUSTOM SEARCH CX



function lookup(InputTitle, callback){
    
    console.log("call to lookup with title " + InputTitle)
    var NetflixFound = false
    var GoogleFound = false
    
    customsearch.cse.list({ cx: CX, q: InputTitle, auth: API_KEY }, function(err, resp) {
        if (err) {
            console.log('An error occured', err);
            return;
        }
        // Got the response from custom search
        console.log('Result: ' + resp.searchInformation.formattedTotalResults);
        if (resp.items && resp.items.length > 0) {
            console.log('First result name is ' + resp.items[0].title);
        }
        
        links = resp.items
        
        for (var i = 0; i < links.length; ++i) {
          
            GoogleFound = true

            var title = links[i].title
            var reg = /\(.*\).*/;
            var year = links[i].title.match(reg).toString();
            
            console.log(title)
            
            title = title.replace(reg,"").toString()
            year = year.split(")")[0].toString()
            

            //Cannot currently handle episodes
            reg = /TV Episode/;
            if(year.match(reg)){
                continue;
            }
            
                

            reg = /TV Series /
            var series = year.match(reg)
            year = year.replace(reg,"")

            if (series){
                reg = /\-.*\)/
            
                //var year = year.replace(reg,"").toString()
            }

            year = year.split("–")[0].toString()
            year = year.replace(/\(/,"").toString()
              
            var IMDBid = links[i].link.match(/\d{7}/).toString()

            console.log(year)
            console.log(title)
            if(series){console.log("TV SERIES")}
            else{console.log("MOVIE")}
            console.log(IMDBid)

            //str = links[i].title.split()
            console.log(links[i].title + ' - ' + links[i].link) // link.href is an alias for link.link
            console.log(links[i].description + "\n")
            
            netflixSearch(title,year,series,function(err, retval){
            
                 console.log(retval)
                 callback(err,retval,title,year,series,'tt'+IMDBid)


            }) 
            break

        }
    });


    

    function netflixSearch(title,year,series,callback2){

        var seriesIdx;
        if (series){seriesIdx = '3';}
        else{seriesIdx = '1';}

        url = 'http://instantwatcher.com/search?q='+title+'&sort=&view=text-synopsis&average_rating=&year='+year+'-'+year+'&runtime=&content_type[]='+seriesIdx+'&language_audio=&layout=none&page=';

        console.log(url)
        
        request(url,{timeout:1500}, function(error, response, html){
            if(error){
                callback2(new Error("could not be found because Netflix search not responding"));
            }
            var $ = cheerio.load(html);
            
            //console.log(html);
            $('div.iw-title').each(function(i,element){//.attr('data-title-path')
                response = $(this).attr('data-title-path')
                response = response.substring(7,16)
                //console.log($(this).child().text())
                console.log(response);
                callback2(error,response)
                NetflixFound = true
            })
            if (NetflixFound == false){
                console.log("This is not on netflix");
                //callback2(new Error(" is not on netflix streaming"));
                callback2(error,'-1')
            }
            
                


            
        })
    }
}

module.exports = {
    lookup : lookup
};
