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

//file upload
//done stores whether a file has been uploaded to the /tmp folder
var done = false;
//stores whether the file size limit has been exceded or not
var file_size_ex = false;

//uploads the file to /tmp  
app.use(multer(
{ 
    dest: __dirname + '/tmp/',
    limits:
    {
        //MAX FILESIZE 100MB
	    fileSize:104857600,
    },
    rename: function (fieldname, filename) 
    {
        return filename;
    },
    onFileUploadStart: function (file) 
    {
        console.log(file.originalname + ' is starting to upload.')
    },
    onFileUploadComplete: function (file) 
    {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
        done = true;
    },
    onFileSizeLimit: function (file) 
    {
        file_size_ex = true;
        console.log('File size limit exceeded: ', file.originalname)
  	    fs.unlink('./' + file.path) // delete the partially written file
    }
}));


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

app.use("/media",express.static(__dirname + "/media"));console.log("File download enabled for /media");
app.use("/static",express.static(__dirname + "/static"));console.log("File download enabled for /static");

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

//marksheet GETs START
app.get('/marksheet_list',function(req,res){

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
        var ajaxData = {};
        collection.find({"ip":ip}).toArray(function(err,items)
        {
            if(items.length == 0)
            {
                return;
            }
            if(items[0].type==0)
            {
                collection.find({}).toArray(function(err,items2){
                    for(var i in items2)
                    {
                        var file_name = items2[i].country_code + '_T_our.html';
                        var paths = [];
                        if(fs.existsSync('mk/'+file_name))
                            paths.push(file_name);
                        ajaxData[items2[i].country_code] = paths;
                    } 
                    res.json(ajaxData);
                    db.close();
                });
            }
            else
                db.close();
        });
        
	});
});

app.get('/marksheet/:id',function(req,res){
    var file_name = req.params.id;
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
                return;
            }
            if(items[0].type==0)
                res.sendFile(__dirname+'/mk/'+req.params.id);
            db.close();
        });
        
	});
});

app.get('/marks/:id',function(req,res){
    var file_name = req.params.id;
    if(file_name.split('_').length>2)
        return;
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
                return;
            }
            if(file_name.split('_')[0]==items[0].country_code)
                res.sendFile(__dirname+'/mk/'+req.params.id);
            db.close();
        });
        
	});
});
//marksheet GETs end

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
                else if(type == 2)
                {
                    res.sendFile(__dirname + '/mk/index.html');
                }
                else if(type == 3)
                {
                    res.sendFile(__dirname + '/pr/index.html');
                }
                else if(type == 4)
                {
                    res.sendFile(__dirname + '/guest/index.html');
                }
                else if(type == 5)
                {
                    res.sendFile(__dirname + '/exec/index.html');
                }
                else if(type == 6)
                {
                    res.sendFile(__dirname + '/disp/index.html');
                }
                else if(type == 7)
                {
                    res.sendFile(__dirname + '/god/index.html');
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

//upload START
//copies the uploaded file from /tmp to /downloads for the convener
app.post('/uploaded',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    db.close();
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type == 0)
                    {
                        //the /tmp path of the file
                        var temp_path = req.files.user_file.path;
                        //the name of the uploaded file
                        var file_name = req.files.user_file.name
                        //the new location to which the file will be copied 
                        var new_location = __dirname + '/downloads/' + file_name;
                        
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                               return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(file_name + " successfully copied to /downloads/");
                        });

                        //redirect the client to his homepage
                        res.redirect('/');
                        done = false;
                    }
                    db.close();
                }
            });
        });
        
    }
});

app.post('/uploadedTOC',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/TOC'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "TOC_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/TOC/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"TOC":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedT',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/T'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "T_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/T/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"T":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedD',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/D'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "D_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/D/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"D":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedOP',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/OP'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "OP_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/OP/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"OP":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedOPi',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/OPi'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "OPi_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/OPi/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"OPi":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedOM',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/OM'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "OM_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/OM/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"OM":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedOMi',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/OMi'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "OMi_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/OMi/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"OMi":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedOT',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/OT'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "OT_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/OT/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"OT":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedOTi',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/OTi'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "OTi_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/OTi/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"OTi":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});

app.post('/uploadedG',function(req,res)
{
    if(file_size_ex == true)
    {
        file_size_ex = false;
        done = false;
        res.redirect('/');
        return;
    }
    if(done==true)
    {
        //the /tmp path of the file
        var temp_path = req.files.user_file.path;
        var file_extension = req.files.user_file.extension; 
        //the name of the uploaded file
        var file_name = req.files.user_file.name
        //the new location to which the file will be copied according to
        //the user's ip

        var ip = req.ip.toString();
        var username = ""; 
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            var uploads = db.collection('uploads');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                console.log(err);
                //if(items != null  && typeof items[0]!=="undefined")
                    username = items[0].user;
                db.close();
            });
        }); 

        var common_new_location = __dirname + '/common/G'+ '/' + file_name;
     
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            var ip = req.ip;
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
                if(items.length == 0)
                {
                    return;
                }
                if(items[0].logged)
                {
                    var type = items[0].type;
                    if(type)
                    {
                        //LEADERS
                        var country_code = items[0].country_code
                        file_name = "G_" + country_code.toString() + "." + file_extension; 
                        var new_location = __dirname + '/uploads/'+ username + '/' + file_name;
                        //copy the file to the new_location from the temp_path 
                        fs.copy(temp_path.toString(), new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /uploads/" + username + "/");
                        });

                        fs.copy(temp_path.toString(), common_new_location.toString(), function(err) 
                        {
                            if (err) 
                            {
                            return console.error(err);
                            }
                            //print the uploaded file metadata on the console
                            console.log(req.files.user_file);
                            console.log(file_name + " successfully copied to /common/G/");
                        });

                        var users = db.collection('users');
                        users.update({"ip":ip},{$set:{"G":true}},function(err,result){db.close();});
                        //redirect the client to his homepage
                        db.close();
                        res.redirect('/')
                        done = false;                        
                    }
                }
            });
        });
    }
});
//upload END

//directory listing START
app.post('/list_dir',function(req,res)
{
    var jsonString = '';
    var ip = req.ip;
    console.log("'/list_dir' request received from " + ip.toString());  

    var reject = false;
    
    if(reject == true){return;}
    req.on('data',function(data)
    {
       jsonString += data;
    });
    req.on('end',function()
    {
       var jsonData = JSON.parse('{"'+decodeURI(jsonString).replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
       var directory_path = jsonData['folder'];
        
       var username = ""; 
	    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var collection = db.collection('users');
            collection.find({"ip":ip}).toArray(function(err,items)
            {
		if(typeof items[0]!=="undefined")
		{
                    username = items[0].user;
		}
                if(directory_path=='uploads')
               {
                    directory_path = __dirname + "/uploads/" + username + "/";
               }
               else if(directory_path=='downloads')
               {
                    directory_path = __dirname + "/downloads";
               }
                fs.readdir(directory_path, function(err,files)
                {
                   if(err)
                    {
                        console.log(err);
                    } 

                files.map(function(file)
                {
                    return path.join(directory_path,file);
                }).filter(function(file)
                {
                    return fs.statSync(file).isFile();
                });
                
                if(directory_path == __dirname + "/downloads")
                {
                    
                    //filtering of filenames to show only country specific files
                    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
                    {
                        if(err)
                        {
                            console.log(err);
                            return 0;
                        }
                        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
                        var collection = db.collection('users');
                        
                        collection.find({"ip":ip}).toArray(function(err,items)
                        {
                            if(items == null || typeof items[0]=="undefined")
                            {
                                console.log(err);
                                console.log("Something went wrong in list-dir signal.Pray to the Gods and carry on!");
                                return;
                            }
                            if(items[0].logged == true)
                            {
                                if(items[0].type == 0)
                                {
                                    id = "download";
                                    directory_path = "/downloads/";
                                    var result = {};
                                    result['id'] = id;
                                    result['directory_path'] = directory_path;
                                    result['files'] = files;
                                    res.json(result);
                                    console.log("Response to '/list_dir' sent in response to request from " + ip.toString());  
                                    db.close();       
                                    return;    
                                }
                                else
                                {
                                    collection.find({}).toArray(function(err,items)
                                    {
                                        if(items == null)
                                        {
                                            console.log(err);
                                            console.log("Something went wrong in list-dir signal.Pray to the Gods and carry on!");
                                            return;
                                        }
                                        for (i in items)
                                        {
                                            //default file name is Marks_country_code.xls
                                            var country_index = files.indexOf("Marks_" + items[i].country_code.toString() + ".xls")
                                            if(country_index > -1 && items[i].ip != ip)
                                            {
                                                //console.log("splicing");
                                                files.splice(country_index,1);
                                            }
                                        }
                                        id = "download";
                                        directory_path = "/downloads/";
                                        var result = {};
                                        result['id'] = id;
                                        result['directory_path'] = directory_path;
                                        result['files'] = files;
                                        res.json(result);
                                        console.log("Response to '/list_dir' sent in response to request from " + ip.toString());  
                                        db.close();           
                                    });

                                }
                             }
                             else
                             {
                                 console.log("Request rejected!");
                                 db.close();
                             }
                            
                        });
                    }); 
                }
                else
                {
                    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
                    {
                        if(err)
                        {
                            console.log(err);
                            return 0;
                        }
                        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
                        var users = db.collection('users');
                        
                        users.find({"ip":ip}).toArray(function(err,items){
                        
                            var result = {};
                            
                            if(err || typeof items[0]=="undefined")
                            {
                                 console.log(err);
				 return;
                            }
                            if(items[0].logged == true)
                            {
                                // Observation Meeting

                                if(items[0].OP_printed)result['OP_printed']=true;else result['OP_printed']=false;
                                if(items[0].OPi_printed)result['OPi_printed']=true;else result['OPi_printed']=false;
                                if(items[0].OM_printed)result['OM_printed']=true;else result['OM_printed']=false;
                                if(items[0].OMi_printed)result['OMi_printed']=true;else result['OMi_printed']=false;
                                if(items[0].OT_printed)result['OT_printed']=true;else result['OT_printed']=false;
                                if(items[0].OTi_printed)result['OTi_printed']=true;else result['OTi_printed']=false;
                                if(items[0].G_printed)result['G_printed']=true;else result['G_printed']=false;

                                id = "upload";
                                directory_path = "/uploads/" + username + "/";
                                result['id'] = id;
                                result['directory_path'] = directory_path;
                                result['files'] = files;
                                res.json(result);
                            }
                            db.close();
                        });
                    });
                }
               });  
                db.close();
            });
        }); 
       
    });
});
//direcotry listing END

//receive request for fb
app.post('/request_fb',function(req,res)
{
    var jsonString = '';
    var ip = req.ip;
    console.log("'/request_fb' request received from " + ip.toString());  

    req.on('data',function(data)
    {
       jsonString += data;
    });
    req.on('end',function()
    {
       var jsonData = JSON.parse('{"'+decodeURI(jsonString).replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
       var current = jsonData['current'];
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var fbs = db.collection('fbs');
		    fbs.find({qno:current}).toArray(function(err,feeds)
		    {
                var result = {};
                result['feeds'] = feeds;
                res.json(result);
                console.log("Response to '/request_fb' sent in response to request from " + ip.toString());  
			    db.close();
		    });
		});
    });
});

app.post('/request_fb_leader',function(req,res)
{
    var jsonString = '';
    var ip = req.ip;
    console.log("'/request_fb' request received from " + ip.toString());  

    req.on('data',function(data)
    {
       jsonString += data;
    });
    req.on('end',function()
    {
       var jsonData = JSON.parse('{"'+decodeURI(jsonString).replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
       var current = jsonData['current'];
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var fbs = db.collection('fbs');
		    fbs.find({qno:current,"ip":ip}).toArray(function(err,feeds)
		    {
                var result = {};
                result['feeds'] = feeds;
                res.json(result);
                console.log("Response to '/request_fb' sent in response to request from " + ip.toString());  
			    db.close();
		    });
		});
    });
});

//subpart START
//send subparts
app.post('/get_subparts',function(req,res)
{
    var jsonString = '';
    var ip = req.ip;
    console.log("'/get_subparts' request received from " + ip.toString());  

    req.on('data',function(data)
    {
       jsonString += data;
    });
    req.on('end',function()
    {
       var jsonData = JSON.parse('{"'+decodeURI(jsonString).replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
       var type = jsonData['val'];
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var collection = db.collection('subparts');
            collection.find({'type':type}).toArray(function(err,items){
                res.json(items[0]);
                db.close();
            });
        });
    });
});
//subpart END

//marksheets START
app.post('/save_mark_T',function(req,res){

    var jsonString = '';
    req.on('data',function(data)
        {
            jsonString += data;
        });
    req.on('end',function(){
        var jsonData = JSON.parse('{"' + decodeURI(jsonString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        var dbData = [];
        var country_name = '';
        for(var i in jsonData)
        {
            if(i!='country')
                dbData.push(parseFloat(jsonData[i]));
            else country_name = jsonData[i];
        }
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            if(country_name=='')
                var marks = db.collection('marks_T');
            else var marks = db.collection('ourMarks_T');
            var query_ob = {};
            if(country_name=='')query_ob["ip"] = ip;
            else query_ob["country_name"] = country_name;
            marks.update(query_ob,{$set:{"leaderMarks":dbData}},{upsert:true},function(err,result){
                res.json({"success":true});
                db.close();});
        });
    });
});

app.post('/submit_mark_T',function(req,res){

    var jsonString = '';
    req.on('data',function(data)
        {
            jsonString += data;
        });
    req.on('end',function(){
        var jsonData = JSON.parse('{"' + decodeURI(jsonString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        var dbData = [];
        for(var i in jsonData)
            dbData.push(parseFloat(jsonData[i]));
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var marks = db.collection('marks_T');
            var users = db.collection('users');
            var ourMarks_db = db.collection('ourMarks_T');
            var subparts = db.collection('subparts');
            marks.update({"ip":ip},{$set:{"leaderMarks":dbData}},{upsert:true},function(err,result){
                //TODO: the code to write the marks onto a file
                users.find({"ip":ip}).toArray(function(err,items){
                    var user = items[0];
                    var leaderMarks = dbData;
                    var country_code = user.country_code;
                    var country_name = user.country_name;
                    var number_of_students = user.number_of_students;
                    subparts.find({"type":"t"}).toArray(function(err,itemss){
                        var subpart_arr = itemss[0].subparts;
                        var maxMarks_arr = itemss[0].maxMarks;
                        ourMarks_db.find({"country_name":country_name}).toArray(function(err,items2){
                            var ourMarks = items2[0].leaderMarks;   //Yes, the field name is still leaderMarks
                            var fileName = "mk/" + country_code.toString() + "_T.html";
                            var our_fileName = "mk/" + country_code.toString() + "_T_our.html";
                            var com_fileName = "marks/" + country_code.toString() + "_T.html";
                            var stream = fs.createWriteStream(fileName);
                            stream.once('open',function(fd){
                                var htmlstr = '';
                                var tdstr_subparts = '';
                                var tdstr_maxMarks = '';
                                htmlstr += '<!DOCTYPE html> <html lang="en"> <head> <meta charset = "utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1"> <title>IPhO 2015 - Mumbai, India</title> <!--Bootstrap--> <link href = "/static/css/bootstrap.min.css" rel = "stylesheet" /> <!!--Custom CSS--> <link href = "/static/css/main.css" rel = "stylesheet" /> <link href = "media/favicon.ico" rel="shortcut icon" type="image/x-icon"/> <link href = "media/favicon.ico" rel="icon" type="image/x-icon"/> </head><body onload = "window.print()" onload = "window.print()">';
				htmlstr += '<h3>E-1 Marks</h3>';
                                htmlstr += '<table class = "table table-striped">';
                                for(var i = 0;i<ourMarks.length/number_of_students;i++)
                                {
                                    tdstr_subparts += '<td>'+subpart_arr[i]+'</td>';
                                    tdstr_maxMarks += '<td><b>'+maxMarks_arr[i]+'</b></td>';
                                } 
                                htmlstr += '<tr> <th>Code</th> </tr> <tr> <td></td> <td>Subparts</td> '+tdstr_subparts+'</tr> <tr > <td></td> <td>Maximum Marks</td> '+tdstr_maxMarks+'</tr>';
                                for(var i = 0;i<number_of_students;i++)
                                {
                                    htmlstr += '<tr><td>'+country_code+("0"+(i+1).toString()).slice(-2)+'</td><td></td>';
                                    for(var j = 0;j<ourMarks.length/number_of_students;j++)
                                    {
                                        htmlstr += '<td>'+ourMarks[i*ourMarks.length/number_of_students+j].toString() + '</td>';
                                    }
                                    htmlstr += '</tr><tr><td colspan="2"></td>';
                                    for(var j = 0;j<ourMarks.length/number_of_students;j++)
                                    {
                                        htmlstr += '<td>'+leaderMarks[i*ourMarks.length/number_of_students+j].toString() + '</td>';
                                    }
                                    htmlstr += '</tr><tr><td colspan="2"></td>';
                                    for(var j = 0;j<ourMarks.length/number_of_students;j++)
                                    {
                                        htmlstr += '<td>'+(ourMarks[i*ourMarks.length/number_of_students+j]-leaderMarks[i*ourMarks.length/number_of_students+j]).toFixed(1) + '</td>';
                                    }
                                    htmlstr += '</tr><tr style="height:30px;"></tr>';
                                }
                                htmlstr += '</table>';
                                htmlstr += '</body></html>';
                                
                                stream.write(htmlstr);
                                stream.end();
                            });
                            var our_stream = fs.createWriteStream(our_fileName);
                            our_stream.once('open',function(fd){
                                var htmlstr = '';
                                var tdstr_subparts = '';
                                var tdstr_maxMarks = '';
                                htmlstr += '<!DOCTYPE html> <html lang="en"> <head> <meta charset = "utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <meta name="viewport" content="width=device-width, initial-scale=1"> <title>IPhO 2015 - Mumbai, India</title> <!--Bootstrap--> <link href = "/static/css/bootstrap.min.css" rel = "stylesheet" /> <!!--Custom CSS--> <link href = "/static/css/main.css" rel = "stylesheet" /> <link href = "media/favicon.ico" rel="shortcut icon" type="image/x-icon"/> <link href = "media/favicon.ico" rel="icon" type="image/x-icon"/> </head><body>';
				htmlstr += '<h3>E-2 Marks</h3>';
                                htmlstr += '<table class = "table table-striped">';
                                for(var i = 0;i<ourMarks.length/number_of_students;i++)
                                {
                                    tdstr_subparts += '<td>'+subpart_arr[i]+'</td>';
                                    tdstr_maxMarks += '<td><b>'+maxMarks_arr[i]+'</b></td>';
                                } 
                                htmlstr += '<tr> <th>Code</th> </tr> <tr> <td></td> <td>Subparts</td> '+tdstr_subparts+'</tr> <tr > <td></td> <td>Maximum Marks</td> '+tdstr_maxMarks+'</tr>';
                                for(var i = 0;i<number_of_students;i++)
                                {
                                    htmlstr += '<tr><td>'+country_code+("0"+(i+1).toString()).slice(-2)+'</td><td></td>';
                                    for(var j = 0;j<ourMarks.length/number_of_students;j++)
                                    {
                                        htmlstr += '<td>'+ourMarks[i*ourMarks.length/number_of_students+j].toString() + '</td>';
                                    }
                                    htmlstr += '</tr><tr><td colspan="2"></td>';
                                    for(var j = 0;j<ourMarks.length/number_of_students;j++)
                                    {
                                        htmlstr += '<td>'+leaderMarks[i*ourMarks.length/number_of_students+j].toString() + '</td>';
                                    }
                                    htmlstr += '</tr><tr><td colspan="2"></td>';
                                    for(var j = 0;j<ourMarks.length/number_of_students;j++)
                                    {
                                        var difference = (ourMarks[i*ourMarks.length/number_of_students+j]-leaderMarks[i*ourMarks.length/number_of_students+j]).toFixed(1);
                                        if(difference==0) 
                                            htmlstr += '<td><b>'+ difference + '</b></td>';
                                        else if(difference>0)
                                            htmlstr += '<td><font style = "color:green"><b>'+ difference + '</b></font></td>';
                                        else
                                            htmlstr += '<td><font style = "color:red"><b>'+ difference + '</b></font></td>';
                                    }
                                    htmlstr += '</tr><tr style="height:30px;"></tr>';
                                }
                                htmlstr += '</table>';
                                htmlstr += '</body></html>';
                                
                                our_stream.write(htmlstr);
                                our_stream.end();
                            });
                            res.json({"success":true,"filename":com_fileName});
                            db.close();
                        });
                    });
                });
            });
        });
    });
});

app.post('/sheetEditableT',function(req,res)
{
    var country_name ='';
    var jsonString = '';
    req.on('data',function(data)
        {
            jsonString += data;
        });
    req.on('end',function(){
        country_name='';
        if(jsonString==''){}
        else{
            var jsonData = JSON.parse('{"' + decodeURI(jsonString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
            var country_name = jsonData['country_name'];
        }
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            if(req.ip != null)
            {
                var ip = req.ip.toString();
            }
            else
            {
                console.log("Null IP Error.Carry on");
                return;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var subparts = db.collection('subparts');
            if(country_name=='')
                var marks = db.collection('marks_T');
            else var marks = db.collection('ourMarks_T');
            var users = db.collection('users');
            
            var query = {};
            query['valid'] = 1;
            subparts.find({"type":"t"}).toArray(function(err,items){
                var subparts = items[0].subparts;
                var maxMarks = items[0].maxMarks;
                var query_ob = {};
                if(country_name=='')query_ob["ip"] = ip;
                else query_ob["country_name"] = country_name;
                users.find(query_ob).toArray(function(err,data){
                    var country_code = data[0].country_code;
                    var number_of_students = data[0].number_of_students;
                    var file_name = country_code + "_T.html";
                    var file_path = "mk/" + file_name;
                    if (fs.existsSync(file_path))
                    {
                        query['valid'] = 0;
                        res.json(query);
                        db.close();
                        return;
                    }
                    var new_ip = data[0].ip;
                    marks.find({$or:[{"ip":new_ip},{"country_name":country_name}]}).toArray(function(err,items2){
                        if(items2.length>=1)
                        {
                            var leaderMarks = items2[0].leaderMarks;
                        }
                        else
                            var leaderMarks = [];
                        query['subparts'] = subparts;
                        query['leaderMarks'] = leaderMarks;
                        query['maxMarks'] = maxMarks;
                        query['number_of_students'] = number_of_students;
                        query['country_code'] = country_code;
                        res.json(query);
                        db.close();
                    });
                });
            });
        });
    });
});
//marksheet END

io.on('connection',function(socket)
{
    if(socket.handshake.address != null)
    {
        var ip = socket.handshake.address.toString();
    }
    else {
        console.log("Null IP Error in io.on connection.Carry on");
        socket.disconnect();
        return;
    }
    if(ip == null){socket.io.close();return;}
    console.log("Connection established to the socket in reponse to " + ip);

    //send init signals START
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            db.close();
            return 0;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var users = db.collection('users');
        
        users.find({"ip":ip}).toArray(function(err,items)
        {

            if(items == null || typeof items[0] == "undefined")
            {
                db.close();
                return;
            }
            var val = items[0].number_of_votes;
            socket.emit('num_of_leaders',val);
            socket.emit('country-data',items[0]);
            console.log("'numberofleaders' signal broadcasted from the server in response to " + ip.toString());
            console.log("'country-data' signal broadcasted from the server in response to " + ip.toString());
            if(items[0].type==2)    //marks entry
            {
                users.find({}).toArray(function(err,items2){
                    console.log("'countries' signal broadcasted from the server in response to " + ip.toString());
                    socket.emit('countries',items2);
                    db.close();
                });
            }
            else
            {
                db.close(); 
            }
        });
    }); 

    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            db.close();
            return 0;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var messages = db.collection('messages');
        
        messages.find({}).toArray(function(err,items)
        {   
            message_table = items;
            io.sockets.emit('message-sent',message_table); 
            console.log("'message-sent' signal broadcasted from the server in response to " + ip.toString());
            db.close();
        });
    }); 
       
    MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
    {
        if(err)
        {
            console.log(err);
            db.close();
            return 0;
        }
        console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip);
        var flags = db.collection('flags');
        flags.find({"name":"feedback"}).toArray(function(err,items)
        {
            if(items != '')
            {
                if(parseInt(items[0].value)==0){
                    socket.emit('fbDisable');
                    console.log("'fbDisable' signal sent from the server in response to " + ip.toString());
                    db.close();
                }
                else
                {
                    socket.emit('fbEnable',items[0].value);
                    console.log("'fbEnable' signal sent from the server in response to " + ip.toString());
                    db.close();
                }
            }
            else
            {
                    socket.emit('fbDisable');
                    console.log("'fbDisable' signal sent from the server in response to " + ip.toString());
                    db.close();
            }
        });
    });
    //send init signals END

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
                    if(items[0].logged==false)
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
                        socket.emit('syn-err-mult');
                        console.log("'syn-err-mult' signal emitted from server in response to " + ip.toString());
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


    //file operations START
    socket.on('file-delete',function(id) 
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
        console.log("'file-delete' signal received from " + ip.toString());
        var message_table = [];
	    try
	    {
	    	fs.unlink(__dirname + id);
            }
	    catch(err)
            {
                console.log("File deletion failed");
	    }
    	socket.emit('file-deleted');
	});
    //file operations END

    //feedback START
    //start feedback
    socket.on('fbStart',function(q){
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'fbStart' signal for " + q +" received from " + ip.toString());

		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            
			var flags = db.collection('flags');
			var query = {};
			query['value'] = q;
		    flags.update({"name":"feedback"},{$set:query},{upsert:true},function(err,result){db.close();});
	    });
	    io.sockets.emit('fbEnable',q);
		console.log("'fbEnable' signal emitted from server in response to " + ip.toString());
    });
    
    //end feedback
    socket.on('fbEnd',function(){
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'fbEnd' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            
			var flags = db.collection('flags');
			var query = {};
			query['value'] = 0;
		    flags.update({"name":"feedback"},{$set:query},function(err,result){db.close();});
	    });
	    io.sockets.emit('fbDisable');
		console.log("'fbDisable' signal emitted from server in response to " + ip.toString());
    });

    //store and send feedback
    socket.on('fbContent',function(id,current,content,time){
        
		console.log("'fbContent' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            
			var fbs = db.collection('fbs');
            var users = db.collection('users');
            users.find({"ip":ip}).toArray(function(err,result){
                var country_code = result[0].country_code;
                var query = {};
                query['ip'] = ip;
                query['country_code'] = country_code;
                query['qid'] = id;  //question id
                query['qno'] = current;
                query['time'] = time;
                query['done'] = false;
                var query2 = {};
                query2['content'] = content;
                fbs.update(query,{$push:query2},{upsert:true},function(err,result){db.close();});
            });
	    });
    });

    socket.on('fbRequest',function(value){
        
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'fbRequest' for "+value+" signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var fbs = db.collection('fbs');
		    fbs.find({qno:value}).toArray(function(err,feeds)
		    {
				socket.emit('fbDisplay',feeds);
		        console.log("'fbDisplay' signal emitted from server in response to " + ip.toString());
			    db.close();
		    });
		});
    });

    socket.on('fb_stat_toggle',function(fb_id)
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
        console.log("'fb_stat_toggle' signal received from " + ip.toString());

        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                console.log(err);
                return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var fbs= db.collection('fbs');
            var _id = new ObjectID(fb_id);
            
            fbs.find({"_id":_id}).toArray(function(err,items)
            { 
                if(items[0].done == true)
                {
                    fbs.update({"_id":_id},{$set: {"done": false}},function(err){db.close();});
                }
                else
                {
                    fbs.update({"_id":_id},{$set: {"done": true}},function(err){db.close();});
                }
            });
            /*
            var doc = fbs.findOne({"_id": _id});
            console.log(doc);
            console.log(fb_id);
            fbs.update({"_id":ObjectID(fb_id)},{$set: {done: !doc.done}});
            */
            console.log("done toggled sucessfully for feedback id " + fb_id);
            return;
        });
    }); 
    //feedback END
    
    //logout START
	socket.on('end',function()
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
		console.log("'end' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var collection = db.collection('users');
            /*
            The ip of the user need not be checked of its existence in the database
            as the user could only have logged in when he was in the database.

            For security purposes,it seems however practical to ensure this redundancy.
            */
		    collection.find({"ip":ip}).toArray(function(err,items)
		    {
		        collection.update({"ip":ip},{$set:{"ip":"","logged":false}},function(err,result){});
		    });
            //send the end acknowleged signal
            socket.emit('end-ack');
		    console.log("'end-ack' signal emitted from server in response to " + ip.toString());
		});
	});
    //logout END

    //listing START
    //directory listing for the convener
    socket.on('list-all-uploads',function()
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
        console.log("'list-all-uploads' signal received from " + ip.toString());
        var all_uploads = [];
        MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
            if(err)
            {
                    console.log(err);
                    return 0;
            }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
            var users = db.collection('users');
                       
            users.find({}).toArray(function(err,items)
            {
                all_uploads = items;
                socket.emit('listed-all-uploads',all_uploads);
                console.log("'listed-all-uploads' signal emmited from server in response to " + ip.toString());
                db.close();
            });
        });

    });
    //listing END
    
    //flag stuff
    //packed and printed
    socket.on('flagPrint',function(val,type,ipi){
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'flagPrint' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var users = db.collection('users');
            var query = {};
            var field = type + '_printed';
            query[field] = val;
		    users.update({"ip":ipi},{$set:query},function(err,result){db.close();});
        });
    });
    socket.on('flagPack',function(val,type,ipi){
		
        if(socket.handshake.address != null)
        {
            var ip = socket.handshake.address.toString();
        }
        else
        {
            console.log("Null IP Error in io.on connection.Carry on");
            return;
        }
		console.log("'flagPack' signal received from " + ip.toString());
		MongoClient.connect("mongodb://localhost:27017/test",function(err,db)
        {
		    if(err)
		    {
			    console.log(err);
			    return 0;
		    }
            console.log("Connection established to the server at mongodb://localhost:27017/test in response to " + ip.toString());
		    var users = db.collection('users');
            var query = {};
            var field = type + '_packed';
            query[field] = val;
		    users.update({"ip":ipi},{$set:query},function(err,result){db.close();});
        });
    });
    //flag stuff END

    //super reresh
    /* Listen Baby Groot, Do not press the button */
    socket.on('super_refresh',function()
    {
        io.sockets.emit("super_refresh");
    });
});
app.use("/uploads/Armenia/",express.static(__dirname + "/uploads/Armenia/"));console.log("File download enabled for /uploads/Armenia/");
app.use("/uploads/Bangladesh/",express.static(__dirname + "/uploads/Bangladesh/"));console.log("File download enabled for /uploads/Bangladesh/");
app.use("/uploads/Belarus/",express.static(__dirname + "/uploads/Belarus/"));console.log("File download enabled for /uploads/Belarus/");
app.use("/uploads/Brazil/",express.static(__dirname + "/uploads/Brazil/"));console.log("File download enabled for /uploads/Brazil/");
app.use("/uploads/Bulgaria/",express.static(__dirname + "/uploads/Bulgaria/"));console.log("File download enabled for /uploads/Bulgaria/");
app.use("/uploads/Canada/",express.static(__dirname + "/uploads/Canada/"));console.log("File download enabled for /uploads/Canada/");
app.use("/uploads/China/",express.static(__dirname + "/uploads/China/"));console.log("File download enabled for /uploads/China/");
app.use("/uploads/Colombia/",express.static(__dirname + "/uploads/Colombia/"));console.log("File download enabled for /uploads/Colombia/");
app.use("/uploads/Croatia/",express.static(__dirname + "/uploads/Croatia/"));console.log("File download enabled for /uploads/Croatia/");
app.use("/uploads/Czech_Republic/",express.static(__dirname + "/uploads/Czech_Republic/"));console.log("File download enabled for /uploads/Czech_Republic/");
app.use("/uploads/Estonia/",express.static(__dirname + "/uploads/Estonia/"));console.log("File download enabled for /uploads/Estonia/");
app.use("/uploads/Georgia/",express.static(__dirname + "/uploads/Georgia/"));console.log("File download enabled for /uploads/Georgia/");
app.use("/uploads/Greece/",express.static(__dirname + "/uploads/Greece/"));console.log("File download enabled for /uploads/Greece/");
app.use("/uploads/Hungary/",express.static(__dirname + "/uploads/Hungary/"));console.log("File download enabled for /uploads/Hungary/");
app.use("/uploads/India/",express.static(__dirname + "/uploads/India/"));console.log("File download enabled for /uploads/India/");
app.use("/uploads/Indonesia/",express.static(__dirname + "/uploads/Indonesia/"));console.log("File download enabled for /uploads/Indonesia/");
app.use("/uploads/Iran/",express.static(__dirname + "/uploads/Iran/"));console.log("File download enabled for /uploads/Iran/");
app.use("/uploads/Kazakhstan/",express.static(__dirname + "/uploads/Kazakhstan/"));console.log("File download enabled for /uploads/Kazakhstan/");
app.use("/uploads/Kyrgyzstan/",express.static(__dirname + "/uploads/Kyrgyzstan/"));console.log("File download enabled for /uploads/Kyrgyzstan/");
app.use("/uploads/Lithuania/",express.static(__dirname + "/uploads/Lithuania/"));console.log("File download enabled for /uploads/Lithuania/");
app.use("/uploads/Malaysia/",express.static(__dirname + "/uploads/Malaysia/"));console.log("File download enabled for /uploads/Malaysia/");
app.use("/uploads/Mali/",express.static(__dirname + "/uploads/Mali/"));console.log("File download enabled for /uploads/Mali/");
app.use("/uploads/Mexico/",express.static(__dirname + "/uploads/Mexico/"));console.log("File download enabled for /uploads/Mexico/");
app.use("/uploads/Nepal/",express.static(__dirname + "/uploads/Nepal/"));console.log("File download enabled for /uploads/Nepal/");
app.use("/uploads/Pakistan/",express.static(__dirname + "/uploads/Pakistan/"));console.log("File download enabled for /uploads/Pakistan/");
app.use("/uploads/Phillipines/",express.static(__dirname + "/uploads/Phillipines/"));console.log("File download enabled for /uploads/Phillipines/");
app.use("/uploads/Poland/",express.static(__dirname + "/uploads/Poland/"));console.log("File download enabled for /uploads/Poland/");
app.use("/uploads/Portugal/",express.static(__dirname + "/uploads/Portugal/"));console.log("File download enabled for /uploads/Portugal/");
app.use("/uploads/Qatar/",express.static(__dirname + "/uploads/Qatar/"));console.log("File download enabled for /uploads/Qatar/");
app.use("/uploads/Romania/",express.static(__dirname + "/uploads/Romania/"));console.log("File download enabled for /uploads/Romania/");
app.use("/uploads/Serbia/",express.static(__dirname + "/uploads/Serbia/"));console.log("File download enabled for /uploads/Serbia/");
app.use("/uploads/Singapore/",express.static(__dirname + "/uploads/Singapore/"));console.log("File download enabled for /uploads/Singapore/");
app.use("/uploads/Slovakia/",express.static(__dirname + "/uploads/Slovakia/"));console.log("File download enabled for /uploads/Slovakia/");
app.use("/uploads/South_Korea/",express.static(__dirname + "/uploads/South_Korea/"));console.log("File download enabled for /uploads/South_Korea/");
app.use("/uploads/Slovenia/",express.static(__dirname + "/uploads/Slovenia/"));console.log("File download enabled for /uploads/Slovenia/");
app.use("/uploads/Sri_Lanka/",express.static(__dirname + "/uploads/Sri_Lanka/"));console.log("File download enabled for /uploads/Sri_Lanka/");
app.use("/uploads/Thailand/",express.static(__dirname + "/uploads/Thailand/"));console.log("File download enabled for /uploads/Thailand/");
app.use("/uploads/Ukraine/",express.static(__dirname + "/uploads/Ukraine/"));console.log("File download enabled for /uploads/Ukraine/");
app.use("/uploads/United_Kingdom/",express.static(__dirname + "/uploads/United_Kingdom/"));console.log("File download enabled for /uploads/United_Kingdom/");
app.use("/uploads/USA/",express.static(__dirname + "/uploads/USA/"));console.log("File download enabled for /uploads/USA/");
app.use("/uploads/Vietnam/",express.static(__dirname + "/uploads/Vietnam/"));console.log("File download enabled for /uploads/Vietnam/");
app.use("/uploads/Russia/",express.static(__dirname + "/uploads/Russia/"));console.log("File download enabled for /uploads/Russia/");
app.use("/uploads/India_Guest/",express.static(__dirname + "/uploads/India_Guest/"));console.log("File download enabled for /uploads/India_Guest/");
app.use("/uploads/Iran_Guest/",express.static(__dirname + "/uploads/Iran_Guest/"));console.log("File download enabled for /uploads/Iran_Guest/");
app.use("/uploads/Qatar_Guest/",express.static(__dirname + "/uploads/Qatar_Guest/"));console.log("File download enabled for /uploads/Qatar_Guest/");
app.use("/uploads/Romania_Guest/",express.static(__dirname + "/uploads/Romania_Guest/"));console.log("File download enabled for /uploads/Romania_Guest/");
app.use("/uploads/Russia_Guest/",express.static(__dirname + "/uploads/Russia_Guest/"));console.log("File download enabled for /uploads/Russia_Guest/");
app.use("/uploads/Serbia_Guest/",express.static(__dirname + "/uploads/Serbia_Guest/"));console.log("File download enabled for /uploads/Serbia_Guest/");
app.use("/uploads/Bangladesh_Guest/",express.static(__dirname + "/uploads/Bangladesh_Guest/"));console.log("File download enabled for /uploads/Bangladesh_Guest/");
app.use("/uploads/President/",express.static(__dirname + "/uploads/President/"));console.log("File download enabled for /uploads/President/");
app.use("/uploads/Secretary/",express.static(__dirname + "/uploads/Secretary/"));console.log("File download enabled for /uploads/Secretary/");
app.use("/uploads/Vahia/",express.static(__dirname + "/uploads/Vahia/"));console.log("File download enabled for /uploads/Vahia/");
app.use("/uploads/Convener1/",express.static(__dirname + "/uploads/Convener1/"));console.log("File download enabled for /uploads/Convener1/");
app.use("/uploads/Convener2/",express.static(__dirname + "/uploads/Convener2/"));console.log("File download enabled for /uploads/Convener2/");
app.use("/uploads/Convener3/",express.static(__dirname + "/uploads/Convener3/"));console.log("File download enabled for /uploads/Convener3/");
app.use("/uploads/Convener4/",express.static(__dirname + "/uploads/Convener4/"));console.log("File download enabled for /uploads/Convener4/");
app.use("/uploads/Convener5/",express.static(__dirname + "/uploads/Convener5/"));console.log("File download enabled for /uploads/Convener5/");
app.use("/uploads/sandesh/",express.static(__dirname + "/uploads/sandesh/"));console.log("File download enabled for /uploads/sandesh/");
app.use("/uploads/ayush/",express.static(__dirname + "/uploads/ayush/"));console.log("File download enabled for /uploads/ayush/");
app.use("/uploads/aloo/",express.static(__dirname + "/uploads/aloo/"));console.log("File download enabled for /uploads/aloo/");
app.use("/uploads/sharad/",express.static(__dirname + "/uploads/sharad/"));console.log("File download enabled for /uploads/sharad/");
app.use("/uploads/groot/",express.static(__dirname + "/uploads/groot/"));console.log("File download enabled for /uploads/groot/");
app.use("/uploads/display/",express.static(__dirname + "/uploads/display/"));console.log("File download enabled for /uploads/display/");
app.use("/downloads/",express.static(__dirname + "/downloads/"));console.log("File download enabled for /downloads/");
