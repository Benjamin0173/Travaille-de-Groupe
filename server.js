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
// https://www.kaggle.com/datasets/nikdavis/steam-store-games/data
// Path: server.js
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const port = 3000
app.use(bodyParser.json());
app.use(cors())

app.listen(port, () => {
    console.log(`Api listening at http://localhost:${port}`)
})

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
    try {
        const resp = await client.info();
        console.log(resp);
        res.send(resp)

    }
    catch (e) {
        console.log(e);
        res.send(e, 500);
    }
})

// Tout les documents de l'index steam // OK
app.get('/all', async (req, res) => {
    try {
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
    }
    catch (e) {
        console.log(e);
        res.send(e, 500);
    }

});

// Search API: Implémentez des requêtes de recherche simples (match, fulltext). //OK
app.get('/search', async (req, res) => {
    try {
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

        let totalResults;
        if (typeof searchResult.hits.total === 'number') {
            totalResults = searchResult.hits.total;
        } else {
            totalResults = searchResult.hits.total.value;
        }

        res.json({
            success: true,
            total: totalResults,
            per_page: size,
            current_page: page,
            last_page: Math.ceil(totalResults / size),
            from: from + 1,
            to: from + searchResult.hits.hits.length,
            data: searchResult.hits.hits,
        })
    }
    catch (e) {
        console.log(e);
        res.send(e, 500);
    }
});

// Fuzzy Matching: Ajoutez des fonctionnalités de recherche approximative. //OK
app.get('/fuzzy-search', async (req, res) => {
    try {
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

        let totalResults;
        if (typeof searchResult.hits.total === 'number') {
            totalResults = searchResult.hits.total;
        } else {
            totalResults = searchResult.hits.total.value;
        }

        res.json({
            success: true,
            total: totalResults,
            per_page: size,
            current_page: page,
            last_page: Math.ceil(totalResults / size),
            from: from + 1,
            to: from + searchResult.hits.hits.length,
            data: searchResult.hits.hits,
        })
    } catch (e) {
        console.log(e);
        res.send(e, 500);
    }
});

// Keyword Search: Implémentez des recherches basées sur des mots-clés spécifiques. //OK //REQUIERE lE NOM DU JEU EXACT
app.get('/keyword-search', async (req, res) => {
    try {
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

        let totalResults;
        if (typeof searchResult.hits.total === 'number') {
            totalResults = searchResult.hits.total;
        } else {
            totalResults = searchResult.hits.total.value;
        }

        res.json({
            success: true,
            total: totalResults,
            per_page: size,
            current_page: page,
            last_page: Math.ceil(totalResults / size),
            from: from + 1,
            to: from + searchResult.hits.hits.length,
            data: searchResult.hits.hits,
        })
    }
    catch (e) {
        console.log(e);
        res.send(e, 500);
    }

});

// Aggregation: Implémentez des agrégations pour des analyses statistiques sur les données. //OK
app.get('/aggregation', async (req, res) => {
    try {
        const searchResult = await client.search({
            index: 'steam',
            body: {
                size: 0,
                aggs: {
                    price: {
                        stats: {
                            field: 'price'
                        }
                    }
                }
            }
        });

        res.send(searchResult.aggregations);

    } catch (e) {
        console.log(e);
        res.send(e, 500);
    }


});

// Scroll API: Implémentez la pagination avec la Scroll API. //OK
app.get('/scroll', async (req, res) => {
    try {
        const scrollId = req.query.scrollId;
        // Use the search API to get the data.
        let searchResult;
        if (!scrollId) {
            searchResult = await client.search({
                index: 'steam',
                scroll: '10m',
                body: {
                    size: 10 // Nombre de résultats par page
                }
            });
        }
        else {
            searchResult = await client.scroll({
                scroll_id: scrollId,
                scroll: '10m'
            });
        }

        res.json({
            success: true,
            scroll_id: searchResult._scroll_id,
            data: searchResult.hits.hits
        });
    } catch (e) {
        console.log(e);
        res.send(e, 500);
    }
});

// Cat API: Utilisez la Cat API pour obtenir des informations sur les index. //OK
app.get('/cat', async (req, res) => {
    try {
        const response = await client.cat.indices({ index: 'steam', v: true });
        res.send(response);
    } catch (e) {
        console.log(e);
        res.send(e, 500);
    }
}
);

// Index API: Utilisez l'Index API pour obtenir des informations sur un index spécifique. //OK
app.get('/index', async (req, res) => {
    try {
        const response = await client.index({ index: 'steam' });
        res.send(response);
    } catch (e) {
        console.log(e);
        res.send(e, 500);
    }
});


app.post('/upload', async (req, res) => {
    try {
        //Récupérer les données du jeu à ajouter depuis la requête
        const newData = req.body;
        console.log(req.body)
        console.log(req.query.indexname)

        // Ajouter les données à l'index ElasticSearch
        const response = await client.index({
            index: req.query.indexname,
            body: newData
        });
        console.log(response)
        res.status(201).json({ message: 'Jeu de Données ajouté avec succès' });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du Jeu de Données :', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout du Jeu de Données' });
    }
});