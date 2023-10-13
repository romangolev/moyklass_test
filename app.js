var express = require('express');
const PORT = process.env.PORT || 3001;
const knex = require('./knex/knex.js');
var app = express();

app.get('/', async function (req, res) {
     const q = await knex.select('id', 'name').from('students');
     res.send(q);
     console.log(q);
});

app.listen(PORT, () => {
     console.log(`Listening on port: ${PORT}`);
});

