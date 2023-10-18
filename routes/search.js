var express = require('express');

const { check, validationResult } = require('express-validator')
const knex = require('../knex/knex.js');
const { attachPaginate } = require('knex-paginate');
attachPaginate();
var router = express.Router();


router.get('/', [check('content-type').equals('application/json')], async function (req, res, next) {
     // get the request properties as filters
     const filters = req.query;

     `
     The following filters might be applied to the search:

     filters.date
     filters.status
     filters.teacherIds
     filters.studentsCount
     filters.page
     filters.lessonsPerPage
     `
     // get ids of students if the studentsCount filter had been applied
     let ids = countStudents(filters.studentsCount)

     // main query to the database starts here
     // then filters will be added according to the 
     // query parameters in the header
     const query = knex.select('id','date','title','status',
               knex.raw('array_agg(distinct teacher_id) AS teacher_ids'),
               knex.raw('array_agg(distinct student_id) AS student_ids')).from( 
               function(){
                    // select lessons table
                    this.select().from('lessons')

                    // Filter dates
                    const date1regex = /^\d{4}-\d{2}-\d{2}$/; // single date regex
                    const date2regex = /^\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}$/;  // double date regex    
                    if (filters.date && date1regex.test(filters.date)){
                         this.where({'date':filters.date});
                    } else if (filters.date && date2regex.test(filters.date)){
                         dates = filters.date.split(',');
                         this.whereBetween('date', dates);
                    }

                    // Filter by students count
                    if (Array.isArray(ids) && ids.length ){
                         this.whereIn('id',ids);
                    } 

                    this.as('LSS')
               }
          ).groupBy('id','date','title','status').innerJoin(
               function(){
                    // select all from table lesson_teachers
                    this.select().from('lesson_teachers')
                    // add filters for teacher_ids in case they had been applied
                    if (filters.teacherIds &&
                         Array.isArray(filters.teacherIds.split(',')) &&
                         filters.teacherIds.split(',').length == 1){
                         // teacher ids for a single id filter
                         this.where({'teacher_id':filters.teacherIds})
                    } else if (filters.teacherIds && Array.isArray(filters.teacherIds.split(',')) && filters.teacherIds.split(',').length > 1){
                         // teacher ids for a multiple ids filter
                         this.whereIn('teacher_id',filters.teacherIds.split(','))
                    } 
                    this.as('LTE')
               },'lesson_id','id')
          .innerJoin('lesson_students','lesson_students.lesson_id','id')

     // Filter for status
     if  (filters.status){
          query.where({'status':filters.status});
     }

     // set default values for pagination
     let lesPerPage = 5;
     if (filters.lessonsPerPage){
          lesPerPage = filters.lessonsPerPage;
     }
     let curPage = 1;
     if (filters.page){
          curPage = filters.page
     }

     // add pagination option using knex-paginate
     // await promise from the DB
     var filteredData = 
     await query.paginate({ perPage: parseInt(lesPerPage),
                            currentPage: parseInt(curPage),
                            isLengthAware: true });
     console.log(filteredData.pagination)
     
     // change data scheme
     for (var elem in filteredData.data) {
          let visits = await calcVisits(filteredData.data[elem].id.toString());
          delete filteredData.data[elem].teacher_ids
          delete filteredData.data[elem].student_ids
          filteredData.data[elem].visitCount = visits['visitCount'];
          filteredData.data[elem].students = visits['students'];
          filteredData.data[elem].teachers = visits['teachers'];
     }

     if (filters.page > filteredData.pagination.lastPage){
          try{
               throw new Error("Incorrect page entered")
          } catch (error) {
               next(error)
               res.status(500)
               res.render('error',{error:error})
          }
     } else {
          res.send(filteredData.data);
     }
     
});


async function countStudents (filtervalue){
     let ids = []
     // students count
     if (filtervalue && filtervalue.split(',').length == 1){
          // case with one variable in request
          const students = await knex.select('lesson_id')
                                   .from('lesson_students')
                                   .count('lesson_id as students_count')
                                   .groupBy('lesson_id')
                                   .havingRaw('COUNT(lesson_id) = ?', filtervalue);                                   
          
          students.forEach(element => {  
               ids.push(element['lesson_id'])
          });

     } else if (filtervalue && filtervalue.split(',').length > 1) {
          // case with two variables in request
          const students = await knex.select('lesson_id')
                                   .from('lesson_students')
                                   .count('lesson_id as students_count')
                                   .groupBy('lesson_id')
                                   .havingRaw('COUNT(lesson_id) >= ? AND COUNT(lesson_id) <= ?', filtervalue.split(','));                                   

          students.forEach(element => {
               ids.push(element['lesson_id'])
          });

     } 
     return ids
}

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