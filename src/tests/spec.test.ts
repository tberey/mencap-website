// import { Server } from '../Server';
// import chai from 'chai';
// import chaiHttp from 'chai-http';
// import 'mocha';

// chai.use(chaiHttp);

// const app = (new Server(false, '8000','localhost')).appAccessor();

// describe('[API] GET Check', () => {
//     it('Should return a 200 status', () => {
//         return chai.request(app).get('/test').then(res => chai.expect(res.status).to.equal(200));
//     });
// });

// describe('[API] POST Check', () => {
//     it('Should return a 200 status', () => {
//         return chai.request(app).post('/test').send({test: "testing"}).then(res => {
//             chai.expect(res.status).to.equal(200);
//         });
//     });
// });
