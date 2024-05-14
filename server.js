const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    node: 'https://cd22bbe4fc224ff08bab1a2ca205c096.us-central1.gcp.cloud.es.io:443',// Elasticsearch endpoint
    auth: {
        apiKey: 'R0J6X2RZOEJmam1BMTFzMjVlblQ6VkRMTV9RVkxUMGlDVEFPeXh1Q1J0UQ=='
    },
    ssl: {
        rejectUnauthorized: false // Disable certificate verification
    }
})

// Path: server.js
const express = require('express')
const app = express()
const port = 3000

// const resp = await client.info();
// console.log(resp.body);

app.get('/', async (req, res) => {
    res.send('Hello World!')
    const resp = await client.info();

    console.log(resp);
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

// Path: server.js
app.get('/search', async (req, res) => {
    const searchResult = await client.search({
        index: 'steam',
        q: 'Team Fortress 2'
    });

    console.log(searchResult.hits.hits)
    res.send(searchResult.hits.hits)

});

app.get('/all', async (req, res) => {
    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match_all: {} // Match tous les documents
            }
        }
    });

    console.log(searchResult.hits.hits)
    res.send(searchResult.hits.hits)

});
