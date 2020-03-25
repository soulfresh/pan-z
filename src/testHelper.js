// require all the test files in the test folder that end with Spec.js or Spec.jsx
const testsContext = require.context('./', true, /Spec.jsx?$/i);
testsContext.keys().forEach(testsContext);
