#!/bin/bash
echo "Running..."
serviceUpdate=false
uiUpdate=false
for i in $(git diff origin/master HEAD --name-only )
do
  if [[ "$i" == *"ClashBot-Notification-Service/"*  && !$notificationServiceUpdate ]];
  then
    notificationServiceUpdate=true
  fi
  if [[ "$i" == *"ClashBot-Service/"*  && !$serviceUpdate ]];
  then
    serviceUpdate=true
  fi
  if [[ "$i" == *"ClashBot-UI/"* && !$uiUpdate ]];
  then
    uiUpdate=true
  fi
done

echo "::set-output name=notificationServiceUpdate::$notificationServiceUpdate"
echo "::set-output name=serviceUpdate::$serviceUpdate"
echo "::set-output name=uiUpdate::$uiUpdate"
echo "Finished"


