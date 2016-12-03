#!/bin/bash

rm mk/*T*.html

#drop the old databases
inp='db.users.drop()'
echo $inp
mongo test --eval $inp

inp='db.subparts.drop()' echo $inp mongo test --eval $inp

inp='db.uploads.drop()'
echo $inp
mongo test --eval $inp

inp='db.votec.drop()'
echo $inp
mongo test --eval $inp

inp='db.voteq.drop()'
echo $inp
mongo test --eval $inp

inp='db.messages.drop()'
echo $inp
mongo test --eval $inp

inp='db.messages_archive.drop()'
echo $inp
mongo test --eval $inp

inp='db.fbs.drop()'
echo $inp
mongo test --eval $inp

inp='db.flags.drop()'
echo $inp
mongo test --eval $inp

inp='db.marks_T.drop()'
echo $inp
mongo test --eval $inp

inp='db.ourMarks_T.drop()'
echo $inp
mongo test --eval $inp

cp ./server_editable.js server.js

#all the ip
while read -r LINE;
do 
    if [[ $LINE != '#'* ]];
    then
        ./add_user.sh $LINE;
    fi    
done < country_code_user.txt 

./add_subparts.sh <data/t_subparts.txt
./add_subparts.sh <data/t1_subparts.txt
./add_subparts.sh <data/t2_subparts.txt
./add_subparts.sh <data/t3_subparts.txt
./add_subparts.sh <data/d_subparts.txt
./add_subparts.sh <data/g_subparts.txt
./add_subparts.sh <data/o1_subparts.txt
./add_subparts.sh <data/o2_subparts.txt
./add_subparts.sh <data/o3_subparts.txt

echo 'app.use("/downloads/",express.static(__dirname + "/downloads/"));console.log("File download enabled for /downloads/");' >> server.js
