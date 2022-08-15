#!/bin/bash
echo "Running..."
output=$(aws ecr describe-images --repository-name $1 --query 'sort_by(imageDetails,& imagePushedAt)[-1]')
echo "Timestamp for image: $(echo $output | jq -r '.imagePushedAt')"
echo "$2=$ECR_REGISTRY/$1:$(echo $output | jq -r '.imageTags[0]')" >> $GITHUB_ENV
echo "Finished"