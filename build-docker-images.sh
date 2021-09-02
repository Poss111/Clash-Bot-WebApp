pushd ClashBot-UI/
npm run-script build
docker build -t poss11111/clash-bot-ui:test .
popd
pushd ClashBot-Service/
docker build -t poss11111/clash-bot-service:test .
docker compose up -d
popd

