var express = require('express');

const tableToPost = 'lessons';

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
     "firstDate":"2023-10-31",
     "lessonsCount":9
}



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
     "firstDate":"2023-10-31",
     "lastDate":"2023-11-31"
}
`



router.post('/lessons',
     body('teacherIds').isInt(),
     body('title').isString(),
     body('days').isInt(),
     body('firstDate').isDate(),
     async function (req, res) {
          // validate inputed json
          const validationErrors = validationResult(req);
          // if there are no errors during validation
          if (validationErrors.isEmpty()){
               // check if there is only parameter used from both: lessonsCount and lastDate   
               if (typeof req.body.lessonsCount !== typeof undefined &&
                    typeof req.body.lastDate !== typeof undefined){
                         // both parameters defined
                         // return error
                         res.status(400).send("One of parameters (lessonsCount, lastDate) should be inroduced");
               } else if (typeof req.body.lessonsCount !== typeof undefined &&
                    typeof req.body.lastDate === typeof undefined) {
                         // lessons parameter defined 
                         // create json based on a number of lessons
                         let lessons = await createLessonsByNumber(req.body);
                         // push data into DB
                         // return array of ids of newly created items 
                         res.status(200).send(lessons);
               } else if (typeof req.body.lessonsCount === typeof undefined &&
                    typeof req.body.lastDate !== typeof undefined) {
                         
                         // lastDate parameter defined 
                         // create json based on a 2 dates
                         let lessons = await createLessonsByDates(req.body);
                         // push data into DB
                         // return array of ids of newly created items
                         if (lessons == []){
                              res.status(400).send("Nothing has been added. Try to input another parameters");
                         } else {
                              res.status(200).send(lessons);
                         }
               } else {
                         // both parameters undefined
                         // return error
                         res.status(400).send("Only one of parameters (lessonsCount, lastDate) should be inroduced");
               }
               
          } else {
               // if json is not valid, return errors
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

async function createLessonsByDates(data){
     let newLessonIds = []
     // convert date
     let firstDate = new Date(data.firstDate);
     let lastDate = new Date(data.lastDate);

     // find which date will be the first

     // check if input date is single or it's an array

     if (Object.prototype.toString.call(data.days) === '[object Array]' &&
          data.days.length > 1 ) {
          // handle multiple days input
          let multipleDayOffset;
          let multipleDayStart;
          let arrayCounter = 0;
          let arrayCurrentIndex;
          let arrayWeekCounter;

          // check if the day of start in the array
          for (const day in data.days) {
               if (day === firstDate.getDay()){
                    multipleDayOffset = 0;
                    multipleDayStart = new Date(firstDate);
                    arrayCurrentIndex = data.days.indexOf(day);
               }
          }
          if (multipleDayOffset !== 0){
               // get the date from which we are going to create new tasks
               let closest = getClosest(data.days, firstDate.getDay());
               arrayCounter = closest[1];
               multipleDayOffset = closest[0] - firstDate.getDay() + closest[1] * 7;
               multipleDayStart = new Date(firstDate).setDate(firstDate.getDate() + multipleDayOffset);
               arrayCurrentIndex = data.days.indexOf(closest[0]);
               arrayWeekCounter = closest[1];
          }

          for (let index = 0; index <= 300; index++){

               let weekOffset = data.days[arrayCurrentIndex];
               // adds a new week and starts array anew
               if (typeof weekOffset == typeof undefined){
                    // start new week and loop through the array anew
                    weekOffset = 0;
                    arrayCurrentIndex = 0;
                    arrayWeekCounter++;
               }

               // calculate the day of the next lesson here:
               let otherDate = new Date(multipleDayStart).setDate(new Date(multipleDayStart).getDate() + weekOffset - new Date(multipleDayStart).getDay() + arrayWeekCounter*7);
               let otherdateConverted = new Date(otherDate).toISOString().split('T')[0];

               const diffTime = Math.abs(new Date(otherDate) - firstDate);
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

               // create tasks if the day difference is no more than one year
               if ((diffDays <= 365) && (otherDate < lastDate)) {
                    try{
                         let newLesson = await createTasks({
                              date: otherdateConverted,
                              title: data.title,
                         })
                         newLessonIds.push(newLesson['id']);
                    } catch { }
               } else null

               arrayCurrentIndex++;
          }

     } else {
          // handle single day input
          let singleDayStart;
          // check if the singleDayStart is a single item Array or an integer and resolve it
          if (Object.prototype.toString.call(data.days) === '[object Array]' &&
          data.days.length == 1 ) {
               singleDayStart = data.days[0];
          } else if (Object.prototype.toString.call(data.days) ==='[object Number]'){
               singleDayStart = data.days;
          };

          // set the day offset for the first day of the lessons
          let dayOffset;
          if (firstDate.getDay() === singleDayStart){
               // day of the week for start matches the day of the fist lesson
               dayOffset = 0;
          } else if (firstDate.getDay() < singleDayStart){
               // selected day of the week goes first
               dayOffset = singleDayStart - firstDate.getDay();
          } else if (firstDate.getDay() > singleDayStart) {
               // selected day falls behind the day of the start
               dayOffset = 7 + singleDayStart - firstDate.getDay();
          }

          for (let index = 0; index<=300; index++) {
               let otherDate = new Date(firstDate).setDate(firstDate.getDate() + dayOffset + index*7);
               let dateConverted = new Date(otherDate).toISOString().split('T')[0];
               const diffTime = Math.abs(new Date(otherDate) - firstDate);
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               
               // create tasks if the day difference is no more than one year
               if ((diffDays <= 365) && (otherDate < lastDate)) {
                    try{
                         let newLesson = await createTasks({
                              date: dateConverted,
                              title: data.title,
                         })
                         newLessonIds.push(newLesson['id']);
                    } catch { }
               } else null
          }
     }
     
     // return created ids for lessons
     return newLessonIds
}


async function createLessonsByNumber(data){
     let newLessonIds = []
     // convert date
     let firstDate = new Date(data.firstDate);

     // find which date will be the first

     // check if input date is single or it's an array

     if (Object.prototype.toString.call(data.days) === '[object Array]' &&
          data.days.length > 1 ) {
          // handle multiple days input
          let multipleDayOffset;
          let multipleDayStart;
          let arrayCounter = 0;
          let arrayCurrentIndex;
          let arrayWeekCounter;

          // check if the day of start in the array
          for (const day in data.days) {
               if (day === firstDate.getDay()){
                    multipleDayOffset = 0;
                    multipleDayStart = new Date(firstDate);
                    arrayCurrentIndex = data.days.indexOf(day);
               }
          }
          if (multipleDayOffset !== 0){
               // get the date from which we are going to create new tasks
               let closest = getClosest(data.days, firstDate.getDay());
               arrayCounter = closest[1];
               multipleDayOffset = closest[0] - firstDate.getDay() + closest[1] * 7;
               multipleDayStart = new Date(firstDate).setDate(firstDate.getDate() + multipleDayOffset);
               arrayCurrentIndex = data.days.indexOf(closest[0]);
               arrayWeekCounter = closest[1];
          }

          for (let index = 0; index <= (data.lessonsCount-1) && index <= 300; index++){

               let weekOffset = data.days[arrayCurrentIndex];
               // adds a new week and starts array anew
               if (typeof weekOffset == typeof undefined){
                    // start new week and loop through the array anew
                    weekOffset = 0;
                    arrayCurrentIndex = 0;
                    arrayWeekCounter++;
               }

               // calculate the day of the next lesson here:
               let otherDate = new Date(multipleDayStart).setDate(new Date(multipleDayStart).getDate() + weekOffset - new Date(multipleDayStart).getDay() + arrayWeekCounter*7);
               let otherdateConverted = new Date(otherDate).toISOString().split('T')[0];

               const diffTime = Math.abs(new Date(otherDate) - firstDate);
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

               // create tasks if the day difference is no more than one year
               if (diffDays <= 365) {
                    try{
                         let newLesson = await createTasks({
                              date: otherdateConverted,
                              title: data.title,
                         })
                         newLessonIds.push(newLesson['id']);
                    } catch { }
               } else null

               arrayCurrentIndex++;
          }

     } else {
          // handle single day input
          let singleDayStart;
          // check if the singleDayStart is a single item Array or an integer and resolve it
          if (Object.prototype.toString.call(data.days) === '[object Array]' &&
          data.days.length == 1 ) {
               singleDayStart = data.days[0];
          } else if (Object.prototype.toString.call(data.days) ==='[object Number]'){
               singleDayStart = data.days;
          };

          // set the day offset for the first day of the lessons
          let dayOffset;
          if (firstDate.getDay() === singleDayStart){
               // day of the week for start matches the day of the fist lesson
               dayOffset = 0;
          } else if (firstDate.getDay() < singleDayStart){
               // selected day of the week goes first
               dayOffset = singleDayStart - firstDate.getDay();
          } else if (firstDate.getDay() > singleDayStart) {
               // selected day falls behind the day of the start
               dayOffset = 7 + singleDayStart - firstDate.getDay();
          }

          for (let index = 0; index <= (data.lessonsCount-1) && index<=300; index++) {
               let otherDate = new Date(firstDate).setDate(firstDate.getDate() + dayOffset + index*7);
               let dateConverted = new Date(otherDate).toISOString().split('T')[0];
               const diffTime = Math.abs(new Date(otherDate) - firstDate);
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               
               // create tasks if the day difference is no more than one year
               if (diffDays <= 365) {
                    try{
                         let newLesson = await createTasks({
                              date: dateConverted,
                              title: data.title,
                         })
                         newLessonIds.push(newLesson['id']);
                    } catch { }
               } else null
          }
     }
     
     // return created ids for lessons
     return newLessonIds
}

function getClosest(arr, goal){

     `    
     returns an array of 2 values:
     1st value : number of the day which is closest to the selected date
     2nd value : 0 if closest day occurs on the week of the selected day and 1 if it's the next week
     `

     const closest = arr.reduce((prev, curr) => {
          return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
     });
     if (closest - goal < 0 ){
          if (typeof arr[arr.indexOf(closest) + 1] !== typeof undefined) {
               return [arr[arr.indexOf(closest) + 1], 0];
          } else {
               return [arr[0], 1];
          }
     } else {
          return [closest, 0];
     }
}

async function createTasks(data){
     // creates new lessin with on the prompted date with the prompted title
     let newId;
     // here goes the table name where to save the data 
     await knex(tableToPost).insert({
                    date: data.date,
                    title: data.title,
               })
               .returning('id')
               .then(([id]) => newId = id);  //id here

     console.log('Created new lesson on '+ data.date);
     return newId
}

module.exports = router;