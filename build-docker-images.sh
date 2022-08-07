docker compose stop
pushd Clash-Bot-WS-Service/
docker build -t poss11111/clash-bot-ws-service:latest .
popd
pushd Clash-Bot-Service-TS/
docker build -t poss11111/clash-bot-webapp-service:latest .
docker compose up -d
popd

