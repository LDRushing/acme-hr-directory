// imports here for express and pg
const express = require('express');
const app = express();
const path = require('path');
const pg = require('pg');
// static routes here (you only need these for deployment)
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory')

app.use(express.json());
app.use(require('morgan')('dev'));
// app routes here
app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * from employees;
      `
        const result = await client.query(SQL)
        res.send(result.rows)
    } catch (ex) {
        next(ex)
    }
});
app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * from departments;
      `
        const result = await client.query(SQL)
        res.send(result.rows)
    } catch (ex) {
        next(ex)
    }
});
app.post('/api/employees', async (req, res, next) => {
    try {
        const SQL = `INSERT INTO employees(name, department_id)
        VALUES ($1, $2)
        RETURNING * `
        const result = await client.query(SQL, [req.body.name, req.body.department_id])
        res.send(result.rows[0])
    } catch (ex) {
        next(ex)
    }
});
app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE FROM employees
        WHERE id = $1;
      `
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch (ex) {
        next(ex)
    }
});
app.put('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `
      const result = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id
      ])
      res.send(result.rows[0])
    } catch (ex) {
      next(ex)
    }
  });

// create your init function
const init = async () => {
    await client.connect();
    console.log('connected to database')
    let SQL = `DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL);
    
    CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL);`
    await client.query(SQL)
    console.log('tables created')
    
    SQL = ` INSERT INTO departments(name) VALUES('Pick');
    INSERT INTO departments(name) VALUES('Pack');
    INSERT INTO departments(name) VALUES('Ship Dock');
    
    INSERT INTO employees(name, department_id) VALUES('Jenni Smith', (SELECT id FROM departments WHERE name='Pick'));
    INSERT INTO employees(name, department_id) VALUES('Pepper Jones', (SELECT id FROM departments WHERE name='Pick'));
    INSERT INTO employees(name, department_id) VALUES('Terri Bore', (SELECT id FROM departments WHERE name='Pack'));
    INSERT INTO employees(name, department_id) VALUES('Ina Fae', (SELECT id FROM departments WHERE name='Ship Dock'));
    INSERT INTO employees(name, department_id) VALUES('Cera Tops', (SELECT id FROM departments WHERE name='Ship Dock'));`;
    await client.query(SQL);
    console.log('data seeded');

    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`))

}
// init function invocation
init()