#set type of the client for an ip
inp='db.users.update({"user":"'$1'"},{$set:{"logged":false,"ip":""}})';
echo $inp
mongo test --eval $inp
