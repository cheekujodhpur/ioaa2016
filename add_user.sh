#!/bin/bash

#add ip to the system
#to use this script run it as:
#./app_ip.sh ip
#create the upload directory for the user

mkdir -p ./uploads/$1
#create entry in the database
inp='db.users.insert({"user":"'$1'","country_name":"'$2'","country_code":"'$3'","number_of_votes":"'$4'","number_of_students":"'$5'","type":'$6',"pass":"ioaa2016","logged":false,"first":false})'
echo $inp
mongo test --eval $inp

echo 'app.use("/uploads/'$1'/",express.static(__dirname + "/uploads/'$1'/"));console.log("File download enabled for /uploads/'$1'/");' >> server.js
