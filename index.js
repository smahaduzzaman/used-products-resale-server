const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const cars = require('./data/cars.json');
const categories = require('./data/categories.json');

app.get('/', (req, res) => {
    res.send('Hello Xclusive Cars!');
});

app.get('/cars', async (req, res) => {
    res.send(cars);
})

app.get('/cars/:id', async (req, res) => {
    const car = cars.find(car => car.id === req.params.id);
    res.send(car);
})

app.get('/categories', async (req, res) => {
    res.send(categories);
})

app.get('/category/:id', (req, res) => {
    const { id } = req.params;
    const car = cars.filter((car) => car.category.catId === id);
    res.send(car);
})

app.get('/category/:id', (req, res) => {
    const id = req.params.id;
    if (id === '100106') {
        res.send(cars);
    } else {
        const category = cars.filter(ct => ct.catId === id);
        res.send(category);
    }
})

app.listen(port, () => {
    console.log(`Xclusive Cars App Running at http://localhost:${port}`);
});