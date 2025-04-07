require('isomorphic-fetch'); // or another library of choice.
const Dropbox = require('dropbox').Dropbox;
const dbx = new Dropbox({ accessToken: 'YOUR_ACCESS_TOKEN_HERE' });
dbx.filesListFolder({path: ''})
  .then(function(response) {
    console.log(response);
  })
  .catch(function(error) {
    console.log(error);
  });