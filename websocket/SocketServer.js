// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var secret= require('./secrets.js')

var socket_key = secret.API_KEYS.socket_key



var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello Worldn');
}).listen(8080);
console.log('Server running at http://127.0.0.1:80/');

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/alexa_kodi'));


var numUsers = 0;
var clients={}
var servers={}


io.on('connection', function (socket) {
 
    
    
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add client', function (username) {
    console.log('potential client')
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
	clients[username] = socket;
    addedUser = true;
    console.log('client added: ' + socket.id.toString()) 
    console.log(username)
	

  });
  
  
  socket.on('add server', function (data) {
    console.log('potential server')
    console.log(data)
    if (addedUser) return;

	if(data.key != socket_key) return;
	
    socket.username = data.username;
    ++numUsers;
	servers[socket.username] = socket;
    addedUser = true;
    console.log('Server Added')
	


  });


  socket.on('client received', function () {
	
  });

  socket.on('client message', function (data) {
	// MAKE SURE THIS EXISTS!
    console.log('client message')
    console.log(data)
    if (servers[socket.username]){
        servers[socket.username].emit('client message',{
            message:data
        });

    }
    else{
        console.log('server ' + socket.username.toString() + ' doesnt exist')
    }
  });
  
  socket.on('server message', function (data) {
	// MAKE SURE THIS EXISTS!
    console.log('server message')
    console.log(data)
    if(!socket.username){
        console.log("server not authenticated")
        return
    }
    
    if (clients[socket.username]){
        clients[socket.username].emit('server message',{
            message:data
        });
        console.log (" sent server messaage to " + clients[socket.username].id.toString())
    }
    else{
        console.log('client server doesnt exist')
    }
  });

  // when the user disconnects.. perform this
  socket.on('client disconnect', function () {
    if (addedUser) {
        --numUsers;
        delete clients[socket.username]
        addedUser = false;
    }
  });
});