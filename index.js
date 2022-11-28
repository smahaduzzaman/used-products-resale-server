const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
        const paymentsCollection = await client.db("xclusiveCars").collection("payments");
        const adsCollection = await client.db("xclusiveCars").collection("ads");
        const wishlistCollection = await client.db("xclusiveCars").collection("wishlist");

        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const amount = order.price;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                "payment_method_types": [
                    "card"
                ]
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });


        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await ordersCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })


        app.get('/cars', async (req, res) => {
            const query = {};
            const cars = await carsCollection.find(query).toArray(); //.limit(3)
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


        // app.get('/category/:id', (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     categoriesCollection.find(query)
        //         .toArray((err, documents) => {
        //             res.send(documents[0]);
        //         })
        // }
        //     if (id === '08') {
        //         const query = carsCollection.find()
        //         res.send();
        //     }
        //     else {
        //         const category_news = news.filter(n => n.category_id === id);
        //         res.send(category_news);
        //     }
        // })


        app.get('/orders', async (req, res) => {
            const query = {};
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        })

        app.get('/orders/:id', async (req, res) => {
            const query = { _id: ObjectId(req.params.id) };
            const order = await ordersCollection.findOne(query);
            res.send(order);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;

            // Already Exist Check
            const query = {
                model: order.model,
                email: order.email,
                price: order.price,
            };

            const alreadyExist = await ordersCollection.findOne(query).toArray();
            if (alreadyExist.length) {
                return res.send({ acknowledged: false, message: 'Already Exist' });
            }

            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        app.post('/orders/ads', async (req, res) => {
            const ads = req.body;
            const result = await ordersCollection.insertOne(ads);
            res.send(result);
        })

        app.post('/wishlist', async (req, res) => {
            const wishlist = req.body;
            const result = await wishlistCollection.insertOne(wishlist);
            res.send(result);
        })

        app.get('/wishlist', async (req, res) => {
            const query = {};
            const wishlist = await wishlistCollection.find(query).toArray();
            res.send(wishlist);
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

        app.get('/users/buyers', async (req, res) => {
            const query = { role: 'buyer' };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers);
        })

        app.get('/users/sellers', async (req, res) => {
            const query = { role: 'seller' };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role == 'admin' });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'Invalid user' });
            }

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

        app.post('/cars', async (req, res) => {
            const car = req.body;
            const result = await carsCollection.insertOne(car);
            res.send(result);
        })


        // post ads to adsCollection
        app.post('/ads', async (req, res) => {
            const ad = req.body;
            const result = await adsCollection.insertOne(ad);
            res.send(result);
        })

        // get ads from adsCollection
        app.get('/ads', async (req, res) => {
            const query = {};
            const ads = await adsCollection.find(query).limit(2).toArray();
            res.send(ads);
        })


        app.get('/cars/allcars', async (req, res) => {
            const query = {};
            const allcars = await carsCollection.find(query).toArray();
            res.send(allcars);
        })
    }

    finally { }
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