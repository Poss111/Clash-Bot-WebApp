exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['e2e\\src\\app.e2e-spec.ts'],
  onPrepare() {
    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json')
    });
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  }
};
