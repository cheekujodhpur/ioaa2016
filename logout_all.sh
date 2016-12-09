#set type of the client for an ip
inp='db.users.update({},{$set:{"logged":false,"ip":""}},{multi:true})';
echo $inp
mongo test --eval $inp
