#!/bin/
echo "Running..."
serviceUpdate=false
uiUpdate=false
for i in $(git diff --name-only $(git tag --sort version:refname | tail -n 2 | head -n 1) $(git tag --sort version:refname | tail -n 1))
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


