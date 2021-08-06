#!/bin/sh
echo "Running..."
serviceUpdate=false
uiUpdate=false
for i in $(git diff --name-only $(git tag --sort version:refname | tail -n 2 | head -n 1) $(git tag --sort version:refname | tail -n 1))
do
  if [[ "$i" == *"ClashBot-Service/"* ]];
  then
    serviceUpdate=true
  fi
done

echo "$serviceUpdate"
echo "Finished"


