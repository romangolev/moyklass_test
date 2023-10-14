var express = require('express');

const { check, validationResult } = require('express-validator')
const knex = require('../knex/knex.js');

var router = express.Router();

router.get('/', [check('content-type').equals('application/json')], async function (req, res) {
     const filters = req.query;

     console.log(filters.date);
     console.log(filters.status);
     console.log(filters.teacherIds);
     console.log(filters.studentsCount);
     console.log(filters.page);
     console.log(filters.lessonsPerPage);

     //testing students count
     if (filters.studentsCount && filters.studentsCount.split(',').length == 1){
          console.log('studentsCount1')
     } else if (filters.studentsCount && filters.studentsCount.split(',').length > 1) {
          console.log('studentsCount2')
     } else {
          console.log('studentsCount0')
          var subq = await knex.select('id','date','title','status','lesson_students.student_id')
          .from('lessons')
          .groupBy('id','date','title','status')
          .innerJoin('lesson_students','lesson_students.lesson_id','id')

     console.log(subq)
     }

     // main query to the database starts here
     // then filters will be added according to the 
     // query parameters in the header
     const query = knex.select('id','date','title','status',
               knex.raw('array_agg(distinct teacher_id) AS teacher_ids'),
               knex.raw('array_agg(distinct student_id) AS student_ids')).from( 
               function(){
                    const date1regex = /^\d{4}-\d{2}-\d{2}$/; // single date regex
                    const date2regex = /^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/;  // double date regex    
                    if (filters.date && date1regex.test(filters.date)){
                         this.select().from('lessons').as('LSS')
                         .where({'date':filters.date});
                    } else if (filters.date && date2regex.test(filters.date)){
                         dates = filters.date.split(',');
                         this.select().from('lessons').as('LSS')
                         .whereBetween('date', dates);
                    } else {
                         this.select().from('lessons').as('LSS')
                    }
               }
          ).groupBy('id','date','title','status').innerJoin(
               function(){
                    if (filters.teacherIds && filters.teacherIds.split(',').length == 1){
                         console.log('teacher_id1')
                         this.select().from('lesson_teachers')
                              .where('teacher_id',filters.teacherIds).as('LTE')
                    } else if (filters.teacherIds && filters.teacherIds.split(',').length > 1){
                         console.log('teacher_id2')
                         this.select().from('lesson_teachers')
                              .whereIn('teacher_id',filters.teacherIds.split(',')).as('LTE')
                    } else {
                         console.log('teacher_id0')
                         this.select().from('lesson_teachers').as('LTE')
                    }
               },'lesson_id','id')
          .innerJoin('lesson_students','lesson_students.lesson_id','id')
          //.leftJoin('lesson_students','lesson_students.lesson_id','id')

     // Filter for status
     if  (filters.status){
          query.where({'status':filters.status});
     }

     var filteredData = await query;

     for (var elem in filteredData) {
          let visits = await calcVisits(filteredData[elem].id.toString());
          delete filteredData[elem].teacher_ids
          delete filteredData[elem].student_ids
          filteredData[elem].visitCount = visits['visitCount'];
          filteredData[elem].students = visits['students'];
          filteredData[elem].teachers = visits['teachers'];
     }
     res.send(filteredData);
});


async function calcVisits (lessonid){
     let props = {}
     // Get students information based on requested lesson id
     const teachers = await knex.select('teachers.id','teachers.name')
                              .from('lesson_teachers')
                              .where({'lesson_id':lessonid})
                              .leftJoin('teachers','lesson_teachers.teacher_id','teachers.id');
     // Get students information based on requested lesson id
     const students = await knex.select('students.id','students.name','lesson_students.visit')
                              .from('lesson_students')
                              .where({'lesson_id':lessonid})
                              .leftJoin('students','lesson_students.student_id','students.id');
     // Calculate visits
     let visits = students.filter(value => value.visit === true).length;
     // Attach properties together in the desired format
     props.visitCount = visits
     props.students = students
     props.teachers = teachers
     // reurn attached properties
     return props
}

module.exports = router;