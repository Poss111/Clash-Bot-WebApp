#docker compose stop
pushd ClashBot-WS-Service/
docker build -t poss11111/clash-bot-ws-service:latest .
popd
pushd ClashBot-Service-OpenAPI/
docker build -t poss11111/clash-bot-webapp-service:latest .
#docker compose up -d
popd

