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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

// Test de la connexion
// const resp = await client.info();
// console.log(resp.body);

async function getTotalDocsCount() {
    try {
        const response = await client.count({ index: 'steam' });
        return response.count;
    } catch (error) {
        console.error("Erreur lors de la récupération du nombre total de documents de l'index :", error);
        throw error;
    }
}

app.get('/', async (req, res) => {
    res.send('Hello World!')
    const resp = await client.info();
    console.log(resp);
})

// Tout les documents de l'index steam // OK
app.get('/all', async (req, res) => {
    const Total = await getTotalDocsCount();
    const page = req.query.page || 1;
    const size = req.query.size || 10;
    const from = (page - 1) * size;
    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match_all: {} // Match tous les documents
            },
            from,
            size
        }
    });
    res.json({
        success: true,
        total: Total,
        per_page: size,
        current_page: page,
        last_page: Math.ceil(Total / size),
        from: from + 1,
        to: from + searchResult.hits.hits.length,
        data: searchResult.hits.hits,
    })
});

// Search API: Implémentez des requêtes de recherche simples (match, fulltext). //OK
app.get('/search', async (req, res) => {
    const Total = await getTotalDocsCount();
    const page = req.query.page || 1;
    const size = req.query.size || 10;
    const from = (page - 1) * size;
    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match: {
                    name: req.query.gameName,
                }
            },
            from,
            size
        }
    });

    res.json({
        success: true,
        total: Total,
        per_page: size,
        current_page: page,
        last_page: Math.ceil(Total / size),
        from: from + 1,
        to: from + searchResult.hits.hits.length,
        data: searchResult.hits.hits,
    })
});

// Fuzzy Matching: Ajoutez des fonctionnalités de recherche approximative. //OK
app.get('/fuzzy-search', async (req, res) => {
    const Total = await getTotalDocsCount();
    const page = req.query.page || 1;
    const size = req.query.size || 10;
    const from = (page - 1) * size;
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
            },
            from,
            size
        }
    });

    res.json({
        success: true,
        total: Total,
        per_page: size,
        current_page: page,
        last_page: Math.ceil(Total / size),
        from: from + 1,
        to: from + searchResult.hits.hits.length,
        data: searchResult.hits.hits,
    })
});

// Keyword Search: Implémentez des recherches basées sur des mots-clés spécifiques. //OK //REQUIERE lE NOM DU JEU EXACT
app.get('/keyword-search', async (req, res) => {
    const Total = await getTotalDocsCount();
    const page = req.query.page || 1;
    const size = req.query.size || 10;
    const from = (page - 1) * size;
    const searchResult = await client.search({
        index: 'steam',
        body: {
            query: {
                match_phrase: {
                    name: req.query.gameName
                }
            },
            from,
            size
        }
    });

    res.json({
        success: true,
        total: Total,
        per_page: size,
        current_page: page,
        last_page: Math.ceil(Total / size),
        from: from + 1,
        to: from + searchResult.hits.hits.length,
        data: searchResult.hits.hits,
    })
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