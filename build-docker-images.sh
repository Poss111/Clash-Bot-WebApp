#docker compose stop
pushd ClashBot-WS-Service/
docker build -t poss11111/clash-bot-ws-service:test .
popd
pushd ClashBot-Service-OpenAPI/
docker build -t poss11111/clash-bot-webapp-service:test .
#docker compose up -d
popd

