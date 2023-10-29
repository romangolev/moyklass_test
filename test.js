const { text } = require('express');
const server = require('./app.js');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);

describe('DB Requests', () => {

     it('GET / root', async () => {
          const res = await requestWithSupertest.get('/');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / one date', async () => {
          const res = await requestWithSupertest.get('/?date=2019-06-17');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / two dates', async () => {
          const res = await requestWithSupertest.get('/?date=2019-06-17,2020-06-17');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / status', async () => {
          const res = await requestWithSupertest.get('/?status=0');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / teacherIds one id', async () => {
          const res = await requestWithSupertest.get('/?teacherIds=1');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / teacherIds two ids', async () => {
          const res = await requestWithSupertest.get('/?teacherIds=1,3');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / studentsCount one input', async () => {
          const res = await requestWithSupertest.get('/?studentsCount=4');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });
     
     it('GET / studentsCount between input', async () => {
          const res = await requestWithSupertest.get('/?studentsCount=1,3');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / page', async () => {
          const res = await requestWithSupertest.get('/?page=2');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / lessonsPerPage', async () => {
          const res = await requestWithSupertest.get('/?lessonsPerPage=6');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

     it('GET / compound request', async () => {
          const res = await requestWithSupertest.get('/?date=2019-06-17,2020-06-17&status=1&studentsCount=2&teachersIds=1,2,3&lessonsPerPage=100&page=1');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
     });

});

describe('Icorrect input tests', () => {

     it('GET /incorrect status', async () => {
          const res = await requestWithSupertest.get('/?status=2');
          expect(res.status).toEqual(400);
          expect(res.text).toEqual('Incorrect status filter entered');
     });

     it('GET /incorrect date', async () => {
          const res = await requestWithSupertest.get('/?date=2023-13-21');
          expect(res.status).toEqual(400);
          expect(res.text).toEqual('Incorrect date filter entered');
     });

     it('GET /incorrect date between', async () => {
          const res = await requestWithSupertest.get('/?date=2023-11-21,2020-11-33');
          expect(res.status).toEqual(400);
          expect(res.text).toEqual('Incorrect date filter entered');
     });

     it('GET /incorrect status', async () => {
          const res = await requestWithSupertest.get('/?status=2');
          expect(res.status).toEqual(400);
          expect(res.text).toEqual('Incorrect status filter entered');
     });

     it('GET /incorrect page', async () => {
          const res = await requestWithSupertest.get('/?page=21');
          expect(res.status).toEqual(400);
          expect(res.text).toEqual('Incorrect page filter entered');
     });

});


describe('Create lessons', () => {

     it('Create lessons by LessonsCount 1', async () => {
          const res = await requestWithSupertest
          .post('/lessons')
          .send({
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
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json');
          expect(res.status).toEqual(200);
     });

     it('Create lessons by LessonsCount 2', async () => {
          const res = await requestWithSupertest
          .post('/lessons')
          .send({
               "teacherIds":[
                  1,
                  2
               ],
               "title":"Blue Ocean",
               "days":[
                  0,
               ],
               "firstDate":"2023-10-31",
               "lessonsCount":9
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json');
          expect(res.status).toEqual(200);
     });

     it('Create lessons by lastDate 1', async () => {
          const res = await requestWithSupertest
          .post('/lessons')
          .send({
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
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json');
          expect(res.status).toEqual(200);
     });

     it('Create lessons by lastDate 2', async () => {
          const res = await requestWithSupertest
          .post('/lessons')
          .send({
               "teacherIds":[
                  1,
                  2
               ],
               "title":"Blue Ocean",
               "days":[
                  1
               ],
               "firstDate":"2023-10-31",
               "lastDate":"2023-11-31"
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json');
          expect(res.status).toEqual(200);
     });
});

describe('Create lessons error haldler test', () => {

     it('Both parameters used', async () => {
          const res = await requestWithSupertest
          .post('/lessons')
          .send({
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
               "lessonsCount":9,
               "lastDate":"2023-11-31"

          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json');
          expect(res.status).toEqual(400);
     });

     it('None of the parameters used', async () => {
          const res = await requestWithSupertest
          .post('/lessons')
          .send({
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
               ]
          })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json');
          expect(res.status).toEqual(400);
     });

});