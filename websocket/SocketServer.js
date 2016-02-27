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

io.on('disconnect',function(socket){
    console.log('disconnect fired io')
    if (addedUser) {
        --numUsers;
        delete clients[socket.username]
        addedUser = false;
        console.log('Client Disconnected io: ' + socket.username)
    }
})

io.on('connection', function (socket) {
 
    
    
  var addedUser = false;

  // when the client emits 'add user', this listens and executes
  socket.on('add client', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
	clients[username] = socket;
    addedUser = true;
    console.log('Client Added: ' + socket.username)
    clients[socket.username].emit('client connected');
	

  });
  
  
  socket.on('add server', function (data) {
    console.log('potential server')
    if (addedUser) return;

	if(data.key != socket_key) return;
	
    socket.username = data.username;
    ++numUsers;
	servers[socket.username] = socket;
    addedUser = true;
    console.log('Server Added: ' + socket.username)
    servers[socket.username].emit('server connected');
	


  });


  //socket.on('client received', function () {
	
  //});

  socket.on('client message', function (data) {
	// MAKE SURE THIS EXISTS!
    //console.log(data)
    if (servers[socket.username]){
        servers[socket.username].emit('client message',{
            message:data
        });
        console.log('Client Message to : ' + socket.username)
    }
    else{
        console.log('Server :' + socket.username + ' doesnt exist')
    }
  });
  
  socket.on('server message', function (data) {
	// MAKE SURE THIS EXISTS!
    //console.log(data)
    if(!socket.username){
        console.log("Server not authenticated!!")
        return
    }
    
    if (clients[socket.username]){
        clients[socket.username].emit('server message',{
            message:data
        });
        console.log ("Server sent message to: " + clients[socket.username].id.toString())
    }
    else{
        servers[socket.username].emit('no client')
        console.log('Client: ' + socket.username + ' not connected')
    }
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    console.log('Client disconnect fired socket')
    if (addedUser) && (clients[username] == socket) {
        --numUsers;
        delete clients[socket.username]
        addedUser = false;
        console.log('Client Disconnected socket: ' + socket.username)
    }
  });
});