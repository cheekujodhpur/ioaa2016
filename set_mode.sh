if [[ $1 == "vote" ]];
then cp u/index_vote.html u/index.html
cp guest/index_vote.html guest/index.html
echo "Changed to mode vote";
fi
if [[ $1 == "marks" ]];
then cp u/index_marks.html u/index.html
cp guest/index_marks.html guest/index.html
echo "Changed to mode marks";
fi
