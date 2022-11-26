const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

function verifyJWT(req, res, next) {
    console.log("token inside verifyJWT", req.headers.authorization)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Invalid token' });
        }
        req.decoded = decoded;
        next();
    });

}


async function run() {
    try {
        const carsCollection = await client.db("xclusiveCars").collection("cars");
        const categoriesCollection = await client.db("xclusiveCars").collection("categories");
        const ordersCollection = await client.db("xclusiveCars").collection("orders");
        const usersCollection = await client.db("xclusiveCars").collection("users");

        app.get('/cars', async (req, res) => {
            const query = {};
            const cars = await carsCollection.find(query).limit(3).toArray();
            res.send(cars);
        })

        app.get('/viewallcars', async (req, res) => {
            const query = {};
            const allcars = await carsCollection.find(query).toArray();
            res.send(allcars);
        })

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })

        // app.get('/orders', async (req, res) => {
        //     const query = {};
        //     const orders = await ordersCollection.find(query).toArray();
        //     res.send(orders);
        // })

        app.post('/orders', async (req, res) => {
            const order = req.body;

            // Already Exist Check
            const query = {
                model: orders.model,
                email: orders.email,
                price: orders.price,
            };

            const alreadyExist = await ordersCollection.findOne(query).toArray();
            if (alreadyExist.length) {
                return res.send({ acknowledged: false, message: 'Already Exist' });
            }

            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Invalid email' });
            }
            const query = { email: email };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        })

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const category = await categoriesCollection.findOne(query);
            res.send(category);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
                res.send({ token: token });
            } else {
                res.status(403).send({ token: null });
            }
        })

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upset: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
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