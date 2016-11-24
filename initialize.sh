#!/bin/bash

#drop the old databases
inp='db.users.drop()'
echo $inp
mongo test --eval $inp

#all the ip
while read -r LINE;
do 
    if [[ $LINE != '#'* ]];
    then
        ./add_user.sh $LINE;
    fi    
done < country_code_user.txt 