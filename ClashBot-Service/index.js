const startUpApp = require('./application');
const port = 80;

startUpApp().then(app => {
    app.listen(port, () => {
        console.log(`Clash Bot Service up and running on Port ('${port}')!`);
    });
});

