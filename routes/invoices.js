// Setups
const express = require('express');
const ExpressError = require('../expressError');
let router = new express.Router();
const db = require('../db');

/**
 * Route to get all invoices. 
 */
router.get('/', async (req, res, next) =>{
    
    try{
        // Query our invoices list. 
        const invoiceResults = await db.query(`SELECT id, comp_code FROM invoices`);
        // Check if invoices results are empty.
        if (invoiceResults.rows.length === 0){
            throw new ExpressError(`invoices does not exist.`, 404);
        }

        return res.json(invoiceResults.rows);
    
    } catch (err){
        return next(err);
    }
});

/**
 * Route to return a single invoice.
 */
router.get('/:id', async (req, res, next) => {
    
    try{
        // Get the invoice id data from invoices. 
        let { id } = req.params;
        const result = await db.query(
            `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description
            FROM invoices AS i 
                INNER JOIN companies AS c ON (i.comp_code = c.code)
                WHERE id = $1`, [id]);

        // Check if result are empty. 
        if (result.rows.length === 0){
            throw new ExpressError(`Invoice does not exist for ${id}`, 404);
        }
        
        const data = result.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description,
            },
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
        };

        return res.json({ invoice: invoice});
    
    } catch (err){
        return next(err);
    }
});

/**
 * Route to add an invoice.
 */
router.post('/', async (req, res, next) =>{
    try{
        // Get the new data from request body.
        const { comp_code, amt } = req.body;

        // Insert into invoices database. 
        const results = 
        await db.query('INSERT INTO invoices (comp_code, amt)' +
            'VALUES ($1, $2) RETURNING *', [comp_code, amt]);

        return res.json(results.rows)
    
    } catch (err){
        return next(err);
    }
})

/**
 * Route to update a single invoice.
 */
router.put('/:id', async (req, res, next) => {
    
    try{
        // Get the data. 
        let { id } = req.params;
        let { amt, paid } = req.body;
        let paidDate = null; 

        const currResult = await db.query(`
            SELECT paid FROM invoices WHERE id =$1`, [id]
        );

        // Check if invoice exists.  
        if (currResult.rows.length === 0){
            throw new ExpressError(`Invoice ${id} does not exist.`, 404);
        }
        
        let currPaidDate = currResult.rows[0].paid_date;

        // Adjust the paid date accordingly. 
        if(!currPaidDate && paid){
            paidDate = new Date();
        } else if (!paid){
            paidDate = null;
        } else{
            paidDate = currPaidDate;
        }

        // Update the company in database. 
        const invoiceResults = await db.query(
            `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 
            WHERE id = $4
            RETURNING *`, [amt, paid, paidDate, id]
        );

        return res.json({ invoice: invoiceResults.rows[0] });
    
    } catch (err){
        return next(err);
    }
});

/**
 * Route to delete a single invoice.
 */
router.delete('/:id', async (req, res, next) => {
    
    try{
        // Get the invoice id.
        const { id } = req.params;

        // Check if invoice exists.
        const invoiceExists = await db.query(
            `SELECT * FROM invoices WHERE id=$1`, [id]
        );

        // Throw 404 error if company does not exist. 
        if(invoiceExists.rows.length === 0){
            throw new ExpressError(`Invoice ${id} does not exist.`, 404);
        }

        // Invoice exists, so delete from invoices database. 
        const invoiceResults = await db.query(
            `DELETE FROM invoices WHERE id=$1`, [id]
        );
    
        return res.json({ status: "deleted" });
    
    } catch (err){
        return next(err);
    }
});

module.exports = router;