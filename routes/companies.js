// Setups
const express = require('express');
const ExpressError = require('../expressError');
let router = new express.Router();
const db = require('../db');



/**
 * Route to return a list of companies.
 */
router.get('/', async (req, res, next) => {
    try{
        // Query our companies list. 
        const companyResults = await db.query(`SELECT code, name FROM companies`);

        // Check if company results are empty.
        if (companyResults.rows.length === 0){
            throw new ExpressError(`Company ${code} does not exist.`, 404);
        }

        return res.json(companyResults.rows);
    
    } catch (err){
        return next(err);
    }
});

/**
 * Route to add a company.
 */
router.post('/', async (req, res, next) =>{
    try{
        // Get the new data from request body.
        const { code, name, description } = req.body;

        // Insert into company database. 
        const results = 
        await db.query('INSERT INTO companies (code, name, description)' +
            'VALUES ($1, $2, $3) RETURNING *', [code, name, description]);

        return res.json(results.rows)
    
    } catch (err){
        return next(err);
    }
})
    
/**
 * Route to return a single company.
 */
router.get('/:code', async (req, res, next) => {
    
    try{
        // Get the code and query it. 
        let { code } = req.params;
        const companyResults = await db.query(
            `SELECT c.code, c.name, c.description, 
            i.id, i.amt, i.paid, i.add_date, i.paid_date  
            FROM companies AS c 
            INNER JOIN invoices AS i 
            ON (c.code = i.comp_code)
            WHERE code = $1`, [code]
        );
        
        // Check if company results are empty. 
        if (companyResults.rows.length === 0){
            throw new ExpressError(`Company ${code} does not exist.`, 404);
        }
        
        // Format the data to return as JSON. 
        const data = companyResults.rows[0];
        console.log(data)
        const company = {
            code: data.code,
            name: data.name,
            description: data.description,
            invoices: {
                id: data.id,
                amt: data.amt,
                paid: data.paid,
                add_date: data.add_date,
                paid_date: data.paid_date,
            },
        };

        return res.json({ company: company });
    
    } catch (err){
        return next(err);
    }
});

/**
 * Route to update a single company.
 */
router.put('/:code', async (req, res, next) => {
    
    try{
        // Get the data. 
        const { code } = req.params;
        const { name, description } = req.body;

        // Update the company in database. 
        const companyResults = await db.query(
            `UPDATE companies SET name=$1, description=$2 WHERE code = $3
            RETURNING *`, [name, description, code
        ]);

        // Check if company results are empty. 
        if (companyResults.rows.length === 0){
            throw new ExpressError(`Company ${code} does not exist.`, 404);
        }
        
        return res.json({ company: companyResults.rows[0] });
    
    } catch (err){
        return next(err);
    }
});

/**
 * Route to delete a single company.
 */
router.delete('/:code', async (req, res, next) => {
    
    try{
        // Get the company code.
        const { code } = req.params;

        // Check if company code exists.
        const companyExists = await db.query(
            `SELECT * FROM companies WHERE code=$1`, [code]
        );

        // Throw 404 error if company does not exist. 
        if(companyExists.rows.length === 0){
            throw new ExpressError(`Company ${code} does not exist.`, 404);
        }

        // Company exists, so delete from companies database. 
        const companyResults = await db.query(
            `DELETE FROM companies WHERE code=$1`, [code]
        );
    
        return res.json({ status: "deleted" });
    
    } catch (err){
        return next(err);
    }
});

module.exports = router;