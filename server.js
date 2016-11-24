#!/usr/bin/env nodejs
/*
server.js file of the Server system for IOAA-2016 India

To run the server,
nodejs server.js

Copyright (c) 2016 Kumar Ayush, Sandesh Kalantre, Sharad Mirani, Alankar Kotwal

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to use
, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of 
the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

//load the required modules
var express = require('express')
  , app = express()
  , http = require('http')
  , MongoClient = require('mongodb').MongoClient
  , server = http.createServer(app)
  , multer  = require('multer')
  , serve_index = require('serve-index')
  , path = require("path")
  , fs = require("fs-extra")
  , log_timestamp = require('log-timestamp')(function() { return '[ ' + (new Date).toLocaleString() + ' ] %s'});
var io = require('socket.io').listen(server);


var ObjectID = require('mongodb').ObjectID;
//server running at port 8080
server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');

//tell node to send the required files when requested
//static files
app.get('/static/css/bootstrap.min.css', function(req,res){res.sendFile(__dirname+'/static/css/bootstrap.min.css');});
app.get('/static/css/simple-sidebar.css', function(req,res){res.sendFile(__dirname+'/static/css/simple-sidebar.css');});
app.get('/static/css/main.css', function(req,res){res.sendFile(__dirname+'/static/css/main.css');});
app.get('/static/js/jquery.min.js', function(req,res){res.sendFile(__dirname+'/static/js/jquery.min.js');});
app.get('/static/js/bootstrap.min.js', function(req,res){res.sendFile(__dirname+'/static/js/bootstrap.min.js');});
app.get('/static/js/knockout-2.2.0.js', function(req,res){res.sendFile(__dirname+'/static/js/knockout-2.2.0.js');});
app.get('/static/js/jquery.tablesorter.js', function(req,res){res.sendFile(__dirname+'/static/js/jquery.tablesorter.js');});
app.get('/static/js/Chart.min.js', function(req,res){res.sendFile(__dirname+'/static/js/Chart.min.js');});
app.get('/media/ioaa-logo.png', function(req,res){res.sendFile(__dirname+'/media/ioaa-logo.png');});
app.get('/media/favicon.ico', function(req,res){res.sendFile(__dirname+'/media/favicon.ico');});
app.get('/media/tifr-logo-s.png', function(req,res){res.sendFile(__dirname+'/media/tifr-logo-s.png');});
app.get('/static/fonts/glyphicons-halflings-regular.woff2', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff2');});
app.get('/static/fonts/glyphicons-halflings-regular.woff', function(req,res){res.sendFile(__dirname+'/static/fonts/glyphicons-halflings-regular.woff');});

//authentication page
app.get('/auth.html',function(req,res)
{
	res.sendFile(__dirname + '/auth.html');
});

//change password page
app.get('/chpass.html',function(req,res)
{
	res.sendFile(__dirname + '/chpass.html');
});

app.get('/', function (req, res)
{
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            return;
        }
        if(req.ip != null)
        {
            var ip = req.ip.toString();
        }
        else
        {
            console.log("Null IP Error.Carry on");
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var collection = db.collection('users');
        collection.find({"ip":ip}).toArray(function(err,items)
        {
            if(items.length == 0)
            {
                res.sendFile(__dirname + '/auth.html');
                return;
            }
            if(items[0].logged)
            {
                //if client is not logged in send him to chpass.html
                if(!items[0].first)
                {
                    res.redirect('/chpass.html');
                }

                //if client is logged in then determine his type and send him to the corresponding page
                var type = items[0].type;
                if(type == 0)
                {
                    res.sendFile(__dirname + '/su/index.html');				
                }
                else if(type == 1)
                {
                    res.sendFile(__dirname + '/u/index.html');
                }
                else
                {
                    res.sendFile('/chpass.html');
                    console.log("User type not recognised for the " + ip);
                }
            }
            else
            {
                res.sendFile(__dirname + '/auth.html');
            }
            db.close();
        });
        
	});
});

io.on('connection',function(socket)
{
    if(socket.handshake.address != null)
    {
        var ip = socket.handshake.address.toString();
    }
    else
    {
        console.log("Null IP Error in io.on connection.Carry on");
        socket.disconnect();
        return;
    }
    if(ip == null){socket.io.close();return;}
    console.log("Connection established to the socket in reponse to " + ip);

    //login START
	socket.on('syn',function(user,pass)
    {
		console.log("'syn' signal received from " + ip.toString());
		// Connect to the db
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var collection = db.collection('users');
            collection.find({"user":user}).toArray(function(err,items)
		    {
                if(typeof items[0]!=="undefined")
                {
                    var truePass = items[0].pass;
                    if(truePass == pass)
                    {
                
                        collection.update({"user":user},{$set:{"logged":true,"ip":ip}},function(err,result){});
                        socket.emit('fin');
                        console.log("'fin' signal emitted from server in response to " + ip.toString());
                    }
                    else
                    {
                        socket.emit('syn-err');
                        console.log("'syn-err' signal emitted from server in response to " + ip.toString());
                    }
                }
			    else
			    {
				    socket.emit('syn-err');
		            console.log("'syn-err' signal emitted from server in response to " + ip.toString());
			    }
			db.close();
		    });
		});
	});
    //login END

    //Change Password START
	socket.on('chpass',function(oldpass,newpass)
    {
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'chpass' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var collection = db.collection('users');
			collection.find({"ip":ip}).toArray(function(err,items){
				if(oldpass!=items[0].pass)	//entered the same password
				{
					socket.emit('chpass-err');
        			console.log("'chpass-err' signal broadcasted from the server in response to " + ip.toString());
					db.close();
				}
				else
				{
					var query = {};
					query['pass'] = newpass;
					query['first'] = true;
					collection.update({"ip":ip},{$set:query},function(err,result){db.close();});
					socket.emit('chpass-fin');
        			console.log("'chpass-fin' signal broadcasted from the server in response to " + ip.toString());
				}
			});
		});
	});
    //Change Password END
    
    //vote START
	//set vote question
	socket.on('setvote',function(body,options,time)
    {
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'setvote' signal received from " + ip.toString());
        //the five letter long alphanumeric id of a question is generated randomly
		var id = Math.random().toString(36).substr(2,5);
		//TODO: check for valid id
		
        //Add option 'Abstain'
        options.push('Abstain');

        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err) { console.log(err); return 0; }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var question_db = db.collection('voteq');
			var count_db = db.collection('votec');
		    question_db.insert({"id":id,"body":body},function(err,result){});
			count_db.insert({"id":id},function(err,result){});
            
            for(var i = 1;i<=options.length;i++)
            {
			    var query = {};
			    query['opt'+i] = options[i-1];
			    question_db.update({"id":id},{$set:query},function(err,result){});
				query['opt'+i] = 0;
				if(i!=options.length)
			    	count_db.update({"id":id},{$set:query},function(err,result){});
			    else
					count_db.update({"id":id},{$set:query},function(err,result){db.close();});
		    }
		});
		voted = [];
		io.sockets.emit('govote',id,body,options,time);
        console.log("'govote' signal broadcasted from the server in response to " + ip.toString());
		
		//show results
		setTimeout(function(){
			MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    	    {
			    if(err)
			    {
			  		console.log(err);
				    return 0;
			    }
            	console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
				var count_db = db.collection('votec');
				count_db.find({"id":id}).toArray(function(err,items){
						io.sockets.emit('voteresults',items[0],body,options);
						console.log("'voteresults' signal broadcasted from the server for question id: "+id);
				db.close();
				});
			});
        //a 5000ms delay is added to ensure that logvote from all users has been received
		},parseInt(time)*1000+3000);
	});
	
	//receive vote inputs
	socket.on('logvote',function(id,option,option2)
    {
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		if(!ip)return;
		if(voted.indexOf(ip)>=0)return; //already voted
		voted.push(ip);
		console.log("'logvote' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var users = db.collection('users');
            users.find({"ip":ip}).toArray(function(err,items)
            {
                if(items[0].logged==true)
                {
                    var collection = db.collection('votec');
                    var query = {};
                    if(undefined!=option)
                    {
                        //vote from both users is same
                        if(option==option2)
                            query[option] = 2;
                        else{
                            //vote from second user
                            query[option]=1;
                            if(undefined!=option2)	//single window votes
                                query[option2]=1;
                        }
                        collection.update({"id":id},{$inc:query},function(err,result){db.close();});
                    }
                    else if(undefined!=option2)
                    {
                        query[option2] = 1;
                        collection.update({"id":id},{$inc:query},function(err,result){db.close();});
                    }
                }
            });
		});
	});
    //vote END

	socket.on('refresh',function(){
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		if(!ip)return;
		console.log("'refresh' signal received from " + ip.toString());
		io.sockets.emit('refreshAll');
	});
    
    //message board START
    socket.on('message-submit',function(message)
    {
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
        console.log("'message-submit' signal received from" + ip.toString());

        var message_table = [];
        // Connect to the db
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var messages = db.collection('messages');
            var messages_archive = db.collection('messages_archive');
         
            //the five letter long alphanumeric id of a question is generated randomly
            var id = Math.random().toString(36).substr(2,5);
            messages.insert({"id":id,"message":message},function(err,result){});
            messages_archive.insert({"id":id,"time":(new Date).toLocaleString(),"message":message},function(err,result){});
                      

            messages.find({}).toArray(function(err,items)
            {  
                message_table = items;
                io.sockets.emit('message-sent',message_table); 
                console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
                db.close();
            });
          });
    });

    socket.on('message-delete',function(id)
    {
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
        console.log("'message-delete' signal received from " + ip.toString());
        var message_table = [];
        // Connect to the db
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var messages = db.collection('messages');
            messages.remove({"id":id},function(err,result){});
            console.log("Message with id: " + id.toString() + " deleted from the database");
            
            messages.find({}).toArray(function(err,items)
            {    
                message_table = items;
                io.sockets.emit('message-sent',message_table);
                console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
                db.close();
            });
        });
    });

    socket.on('message-refresh',function()
    {
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
        console.log("'message-refresh' signal received from " + ip.toString());
        var message_table = [];
        // Connect to the db
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var messages = db.collection('messages');
            messages.remove({},function(err,result){db.close();});
            console.log("All messages deleted from the database in response to " + ip.toString());
             
        });
        io.sockets.emit("message-sent",message_table);
        console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
    });
    //message board END
});
