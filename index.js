const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const username = process.env.DB_USER;
const password = process.env.DB_PASS;

const uri = `mongodb+srv://${username}:${password}@cluster0.fceds.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const carsCollection = await client.db("xclusiveCars").collection("cars");
        const categoriesCollection = await client.db("xclusiveCars").collection("categories");
        const ordersCollection = await client.db("xclusiveCars").collection("orders");

        app.get('/cars', async (req, res) => {
            const query = {};
            const cars = await carsCollection.find(query).toArray();
            res.send(cars);
        })

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })


        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        })

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const category = await categoriesCollection.findOne(query);
            res.send(category);
        })


    }

    finally {
    }
}

run().catch(console.log);


app.get('/', (req, res) => {
    res.send('Hello Xclusive Cars!');
});

// app.get('/cars', async (req, res) => {
//     res.send(cars);
// })

// app.get('/cars/:id', async (req, res) => {
//     const car = cars.find(car => car.id === req.params.id);
//     res.send(car);
// })

// app.get('/categories', async (req, res) => {
//     res.send(categories);
// })

// app.get('/category/:id', (req, res) => {
//     const { id } = req.params;
//     const car = cars.filter((car) => car.category.catId === id);
//     res.send(car);
// })

// app.get('/category/:id', (req, res) => {
//     const id = req.params.id;
//     const category = cars.filter(ct => ct.catId === id);
//     res.send(category);
// })

app.listen(port, () => {
    console.log(`Xclusive Cars App Running at http://localhost:${port}`);
});