#!/bin/bash
echo "Running..."
echo "$(git branch)"
serviceUpdate=false
uiUpdate=false
for i in $(git diff master --name-only )
do
  if [[ "$i" == *"ClashBot-Service/"*  && !$serviceUpdate ]];
  then
    serviceUpdate=true
  fi
  if [[ "$i" == *"ClashBot-UI/"* && !$uiUpdate ]];
  then
    uiUpdate=true
  fi
done

echo "::set-output name=serviceUpdate::$serviceUpdate"
echo "::set-output name=uiUpdate::$uiUpdate"
echo "Finished"


