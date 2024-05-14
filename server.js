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
const cors = require('cors')
const port = 3000

app.use(cors())

// Test de la connexion
// const resp = await client.info();
// console.log(resp.body);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

app.get('/', async (req, res) => {
    res.send('Hello World!')
    const resp = await client.info();

    console.log(resp);
})

// Path: server.js
// Search API: Implémentez des requêtes de recherche simples (match, fulltext). //OK
app.get('/search', async (req, res) => {
    console.log(req.query.gameName);
    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match: {
                    name: req.query.gameName,
                    operator: 'and'
                }
            }
        }
    });

    res.send(searchResult.hits.hits);
});

// Fuzzy Matching: Ajoutez des fonctionnalités de recherche approximative. //OK
app.get('/fuzzy-search', async (req, res) => {
    console.log(req.query.gameName);
    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match: {
                    name: {
                        query: req.query.gameName,
                        fuzziness: 'AUTO'
                    }
                }
            }
        }
    });

    res.send(searchResult.hits.hits);
});

// Keyword Search: Implémentez des recherches basées sur des mots-clés spécifiques. //NON
app.get('/keyword-search', async (req, res) => {
    console.log(req.query.gameName);
    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match_phrase: {
                    name: req.query.gameName
                }
            }
        }
    });

    res.send(searchResult.hits.hits);
});

// Pagination: Ajoutez des fonctionnalités de pagination aux résultats de recherche. //NON
app.get('/search-with-pagination', async (req, res) => {
    console.log(req.query.gameName);
    const page = req.query.page || 1;
    const size = req.query.size || 10;
    const from = (page - 1) * size;

    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match: {
                    name: req.query.gameName
                }
            },
            from,
            size
        }
    });

    res.send(searchResult.hits.hits);
});

// Aggregation: Implémentez des agrégations pour des analyses statistiques sur les données. //NON
app.get('/aggregation', async (req, res) => {
    const searchResult = await client.search({
        index: 'steam',
        body: {
            size: 0,
            aggs: {
                genres: {
                    terms: {
                        field: 'genre.keyword',
                        size: 10
                    }
                }
            }
        }
    });

    res.send(searchResult.aggregations.genres.buckets);
});


// Tout les documents de l'index steam // OK
app.get('/all', async (req, res) => {
    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match_all: {} // Match tous les documents
            },
            size: 10000,
        }
    });
    res.send(searchResult.hits.hits)
});
