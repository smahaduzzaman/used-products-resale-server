const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello Product Reseller Site!');
});

app.listen(port, () => {
    console.log(`Product Reseller App Running at http://localhost:${port}`);
});