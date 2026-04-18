require('dotenv').config();

const express = require('express');
const instagramWebhook = require('./instagramWebhook');

const app = express();
const PORT = process.env.PORT || 3000;


/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

// Parse JSON bodies
app.use(express.json());

// Parse URL encoded bodies (important for Meta)
app.use(express.urlencoded({ extended: true }));


/*
|--------------------------------------------------------------------------
| Root Route (Browser Test)
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
    res.send('Instagram Webhook Server Running 🚀');
});


/*
|--------------------------------------------------------------------------
| Webhook Route
|--------------------------------------------------------------------------
*/

app.use('/webhook/instagram', instagramWebhook);


/*
|--------------------------------------------------------------------------
| Health Check Endpoint
|--------------------------------------------------------------------------
*/

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});


/*
|--------------------------------------------------------------------------
| Error Handler
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).send('Internal Server Error');
});


/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
    console.log('----------------------------------');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Webhook endpoint: /webhook/instagram`);
    console.log(`🌐 Test URL: http://localhost:${PORT}/webhook/instagram`);
    console.log('----------------------------------');
});