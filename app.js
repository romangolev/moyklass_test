var express = require('express');
const PORT = process.env.PORT || 3001;
var searchRouter = require('./routes/search');
var lessonsRouter = require('./routes/lessons')
var app = express();
app.use(express.json());


app.use('/', searchRouter);
app.use('/', lessonsRouter);

app.listen(PORT, () => {
     console.log(`Listening on port: ${PORT}`);
});
module.exports = app;
