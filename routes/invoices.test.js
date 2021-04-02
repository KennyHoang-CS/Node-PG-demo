// Setups
const request = require('supertest');
const app = require('../app');
const db = require('../db');

// Before each test, clean out data.
beforeEach(async function(){
    // Delete any data.
   await db.query("DELETE FROM companies");
   await db.query("DELETE FROM invoices");
   await db.query("SELECT setval('invoices_id_seq', 1, false)");

   // Create our data. 
   await db.query(`INSERT INTO companies (code, name, description)
                   VALUES 
                   ('apple', 'Apple', 'Maker of OSX.'),
                   ('ibm', 'IBM', 'Big blue.')`);

   const inv = await db.query(
       `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
           VALUES 
           ('apple', 100, false, '2018-01-01', null),
           ('apple', 200, true, '2018-02-01', '2018-02-02'), 
           ('ibm', 300, false, '2018-03-01', null)
           RETURNING id`);
});


// End the connection, so Jest won't complain. 
afterAll(async ()=>{
   await db.end();
});

describe("GET /", ()=>{
    test('it should return all invoices as a list.', async ()=>{
        const res = await request(app).get('/invoices');
        
        expect(res.body).toEqual(
            [
                { id: 1, comp_code: 'apple' },
                { id: 2, comp_code: 'apple' },
                { id: 3, comp_code: 'ibm' }
            ] 
        )
    })
})

describe("GET /invoices/1", ()=>{
    test('it should return an invoice', async ()=>{
        const res = await request(app).get('/invoices/1');

        expect(res.body).toEqual({
            "invoice": {
                "id": 1,
                "company": { "name": 'Apple', "description": 'Maker of OSX.' },
                "amt": 100,
                "paid": false,
                "add_date": '2018-01-01T08:00:00.000Z',
                "paid_date": null
            }
        })
    })
    test('it should return 404 for invalid invoice.' , async()=>{
        const res = await request(app).get('/invoices/999');

        expect(res.status).toEqual(404);
    })
})

describe('POST /invoices', ()=>{
    test('it should add an invoice', async ()=>{
        const res = await request(app).post('/invoices')
            .send({amt: 400, comp_code: 'ibm'});
        
        expect(res.body).toEqual(
            [
                {"add_date": 
                    "2021-04-01T07:00:00.000Z", 
                    "amt": 400, 
                    "comp_code": "ibm", 
                    "id": 4, 
                    "paid": false, 
                    "paid_date": null}
            ]
        )
    })
})

describe('PUT /', ()=>{
    test('it should update an invoice', async ()=>{
        const res = await request(app).put('/invoices/1')
            .send({amt: 5000, paid: false});
        
        expect(res.body).toEqual(
            {
                invoice: {
                    id: 1,
                    comp_code: 'apple',
                    amt: 5000,
                    paid: false,
                    add_date: '2018-01-01T08:00:00.000Z',
                    paid_date: null
                }
            }
        )
    })
    test('it should respond 404 for invalid invoices', async ()=>{
        const res = await request(app).put('/invoices/1111111111')
        .send({amt: 5000, paid: false});
        expect(res.status).toEqual(404);
    })
})

describe('DELETE /', ()=>{
    test('it should delete an invoice', async ()=>{
        const res = await request(app).delete('/invoices/1');
        expect(res.body).toEqual({"status": "deleted"});
    })
    test('it should respond 404 for invalid invoices', async ()=>{
        const res = await request(app).delete('/invoices/1111111111');
        expect(res.status).toEqual(404);
    })
})