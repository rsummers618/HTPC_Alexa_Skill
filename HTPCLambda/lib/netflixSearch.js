Netflix = {
  search: function (search, page) {
    var deferred = $.Deferred();
    search = search ? search : '';
    page = page ? page : 1;

    var yql_url = 'https://query.yahooapis.com/v1/public/yql';
    // TODO parameterize hardcoded options
    var url = ['http://instantwatcher.com/search?sort=available_from+desc&view=synopsis&infinite=on&average_rating=&year=&runtime=&content_type%5B%5D=1&language_audio=&layout=none&page=', page, '&q=', search.split(' ').join('+') ].join('');
    var query = ['SELECT * FROM html WHERE url="', url, '" and xpath="//div[@class=', "'", 'iw-title list-title box-synopsis-mode', "'", ']"'].join('');

    $.ajax({
      'url': yql_url,
      'method': 'GET',
      'data': {
        'q': query,
        'format': 'json',
        'jsonCompat': 'new',
        'callback': '?',
        'diagnostics': true
      },
      'dataType': 'jsonp',
    }).done(function(data){
      var movies = [];

      function getProperty(element) {
        if(Array.isArray(element.a)) {
          return element.a.map(function(item){ return item.content; }).join(', ');
        } else {
          return element.a.content;
        }
      }

      function getMovieFromDiv(movieDiv) {
        var movie = {
          image: movieDiv.a.img ? movieDiv.a.img.src : '',
          title: cleanText(movieDiv.span[0].a.content),
          year: movieDiv.span[1].a.content,
          netflix_url: movieDiv.span[2].a[0].href
        }

        function cleanText(text){
          return $('<div />').html(text).text();
        }

        var otherData = movieDiv.span[2].span;
        for (var j = 0; j < otherData.length; j++) {
          var property = otherData[j].class;
          var content = otherData[j].content;

          if(property === 'actors') {
            movie.actors = getProperty(otherData[j]);
          } else if(property === 'directors'){
            movie.directors = getProperty(otherData[j]);
          } else if(!movie[property]) {
            movie[property] = content;
          } else {
            movie[property] = [movie[property], content]
          }
        }

        return movie;
      }

      if(data.query.results) {
        if(Array.isArray(data.query.results.div)) {
          for (var i = 0; i < data.query.results.div.length; i++) {
            var movieDiv = data.query.results.div[i];
            var movie = getMovieFromDiv(movieDiv);
            movies.push(movie);
          }
        } else {
          var movie = getMovieFromDiv(data.query.results.div);
          movies.push(movie);
        }
      }

      deferred.resolve(movies);
    }).fail(function(error){
      deferred.reject(error);
    });

    return deferred;
  }
}
