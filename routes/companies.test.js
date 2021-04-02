// Setups
const request = require('supertest');
const app = require('../app');
const db = require('../db');


// Before each test, clean out data.
beforeEach(async function(){
     // Delete any data.
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
    //await db.query("SELECT setval('invoice_id_seq', 1, false)");

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


describe('GET /', ()=>{

    test('It should respond with an array of companies.', async ()=>{
        const response = await request(app).get("/companies");
        expect(response.body).toEqual(
            [ { code: 'apple', name: 'Apple' }, { code: 'ibm', name: 'IBM' } ]
        );
    });
});

describe('GET /apple', ()=>{

    test('It should return apple company details.', async ()=>{
        const response = await request(app).get("/companies/apple");
        let invoice_id = response.body.company.invoices.id;
        expect(response.body).toEqual(
            {
                "company": {
                    "code": "apple",
                    "name": "Apple",
                    "description": "Maker of OSX.",
                    "invoices": {
                        "id": invoice_id,
                        "amt": 100,
                        "paid": false,
                        "add_date": "2018-01-01T08:00:00.000Z",
                        "paid_date": null
                    }
                }
            }
        );
    });
    test('It should respond with 404 for invalid companies.', async ()=>{
        const response = await request(app).get("/companies/sadlsa");
        expect(response.status).toEqual(404);
    })
});


describe('POST /', ()=>{
    test('It should create a new company.', async ()=>{
        const res = await request(app).post("/companies")
            .send({name: "TestName", description: "TestDescription"});

        expect(res.body).toEqual(
            [{
                "code": "testname",
                "name": "TestName",
                "description": "TestDescription"
            }]
        )
    })
    test("It should return 500 for conflict", async ()=>{
        const response = await request(app)
            .post("/companies")
            .send({name: "Apple", description: "Huh?"});
    
        expect(response.status).toEqual(500);
    })
})

describe('PUT /', ()=>{
    test("It should update a company", async()=>{
        const res = await request(app)
            .put("/companies/apple")
            .send({name: "EditApple", description: "EleGiggles"});

        expect(res.body).toEqual(
            {
                company: { 
                    code: 'apple', name: 'EditApple', description: 'EleGiggles' 
                }
            }
        )
    })
    test("It should respond 404 for invalid companies.", async()=>{
        const res = await request(app)
            .put("/companies/askdsa")
            .send({name: "sadkjsada"});
        expect(res.status).toEqual(404);
    })
    test("It should respond 500 for missing data for company.", async()=>{
        const res = await request(app)
            .put("/companies/apple")
            .send();
        expect(res.status).toEqual(500);
    })
})

describe('DELETE /', ()=>{
    test('It should delete a company', async ()=>{
        const res = await request(app)
            .delete("/companies/apple");

        expect(res.body).toEqual(
            { "status": "deleted"}
        );
    })
    test("it should respond 404 for invalid company", async ()=>{
        const res = await request(app)
            .delete("/companies/apasdsaple");
        expect(res.status).toEqual(404);
    })
    
});