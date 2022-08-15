#!/bin/bash
echo "Running..."
serviceUpdate=false
wsServiceUpdate=false
uiUpdate=false
for i in $(git diff --name-only $(git tag --sort version:refname | tail -n 2 | head -n 1) $(git tag --sort version:refname | tail -n 1))
do
  if [[ "$i" == *"ClashBot-Service-OpenAPI/"*  && !$serviceUpdate ]];
  then
    serviceUpdate=true
  fi
  if [[ "$i" == *"ClashBot-WS-Service/"*  && !$wsServiceUpdate ]];
  then
    wsServiceUpdate=true
  fi
  if [[ "$i" == *"ClashBot-UI/"* && !$uiUpdate ]];
  then
    uiUpdate=true
  fi
done

parsedTag=${GITHUB_REF##*/}

echo "::set-output name=serviceUpdate::$serviceUpdate"
echo "::set-output name=wsServiceUpdate::$wsServiceUpdate"
echo "::set-output name=uiUpdate::$uiUpdate"
echo "::set-output name=parsedTag::$parsedTag"
echo "Finished"


