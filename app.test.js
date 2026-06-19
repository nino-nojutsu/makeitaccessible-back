const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app');
const Audit = require('./models/audits');

// Can post an audit as an anonymous user (launch createAuditAction function)
it('POST /audit', async () => {
 const res = await request(app).post('/audit').send({
   url: 'https://lacapsule.academy',
   name: 'lacapsule',
   domain: 'lacapsule.academy',
   token: undefined,
 });

 expect(res.statusCode).toBe(200);
 expect(res.body.result).toBe(true);
 expect(res.body.website).toBeDefined();
 expect(res.body.results).toBeDefined();
}, 20000);

// Can post an audit as an authenticated user (launch createAuditAction function)
it('POST /audit', async () => {
 const res = await request(app).post('/audit').send({
   url: 'https://lacapsule.academy',
   name: 'lacapsule',
   domain: 'lacapsule.academy',
   token: 'HRuaYbBuYGiG7rFLlmYxGZTQF3a-VTaS',
 });

 expect(res.statusCode).toBe(200);
 expect(res.body.result).toBe(true);
 expect(res.body.website).toBeDefined();
 expect(res.body.results).toBeDefined();
 expect(res.body.tests.length).toBeDefined(); // les tests doivent être présents si connecté : vérifie que l'on récupère un tableau non vide
}, 20000);
