var express = require('express');
const PORT = process.env.PORT || 3001;
var searchRouter = require('./routes/search');
var app = express();

app.listen(PORT, () => {
     console.log(`Listening on port: ${PORT}`);
});

app.use('/', searchRouter);
module.exports = app;
