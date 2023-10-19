var express = require('express');

const { check, validationResult, body } = require('express-validator')
const knex = require('../knex/knex.js');
var router = express.Router();
`
JSON Post example
{
     "teacherIds":[
        1,
        2
     ],
     "title":"Blue Ocean",
     "days":[
        0,
        1,
        3,
        6
     ],
     "firstDate":"2019-09-10",
     "lessonsCount":9,
     "lastDate":"2019-12-31"
  }
`

router.post('/lessons',
     body('teacherIds').isInt(),
     body('title').isString(),
     body('days').isInt(),
     body('firstDate').isDate(),
     function (req, res) {
          const validationErrors = validationResult(req)
          if (validationErrors.isEmpty()){
               console.log(req.body);     

               // check if there is only parameter used from both: lessonsCount and lastDate
               console.log(req.body.lessonsCount)
               console.log(req.body.lastDate)
               console.log(typeof req.body.lessonsCount !== typeof undefined)
               console.log(typeof req.body.lastDate === typeof undefined)
               if (typeof req.body.lessonsCount !== typeof undefined &&
                    typeof req.body.lastDate !== typeof undefined){
                         console.log("both defined")
                         res.status(400).send("Only one of parameters (lessonsCount, lastDate) should be inroduced")
               } else if (typeof req.body.lessonsCount == typeof undefined &&
                    typeof req.body.lastDate !== typeof undefined) {
                         console.log("lessons defined")
                         res.status(200).send(res.body);
               } else if (typeof req.body.lessonsCount !== typeof undefined &&
                    typeof req.body.lastDate === typeof undefined) {
                         console.log("lastDate defined")  
                         res.status(200).send(res.body);                       
               } else (
                         console.log("both undefined")
               )
          } else {
               console.log(validationErrors)
               res.status(400).json({
                    error: {
                      message: validationErrors.array()[0].msg,
                      value: validationErrors.array()[0].value,
                      path: validationErrors.array()[0].path
                    }
               });
          }
     }
);


module.exports = router;