#!/bin/bash
echo "Running..."
serviceUpdate=false
wsServiceUpdate=false
uiUpdate=false
for i in $(git diff origin/master HEAD --name-only )
do
  if [[ "$i" == *"ClashBot-Service-OpenAPI/"*  && !$serviceUpdate ]];
  then
    serviceUpdate=true
  fi
  if [[ "$i" == *"ClashBot-WS-Service/"*  && !$wsServiceUpdate ]];
  then
    serviceUpdate=true
  fi
  if [[ "$i" == *"ClashBot-UI/"* && !$uiUpdate ]];
  then
    uiUpdate=true
  fi
done

echo "::set-output name=wsServiceUpdate::$wsServiceUpdate"
echo "::set-output name=serviceUpdate::$serviceUpdate"
echo "::set-output name=uiUpdate::$uiUpdate"
echo "Finished"


