const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Provider type: JSON | API
const PROVIDER_TYPE = process.env.TOKEN_PROVIDER_TYPE || 'JSON';

class TokenProvider {

    async getAccessToken(platform = 'instagram') {

        switch (PROVIDER_TYPE) {

            case 'JSON':
                return this.getFromJSON(platform);

            case 'API':
                return this.getFromAPI(platform);

            default:
                throw new Error(`Unsupported token provider type: ${PROVIDER_TYPE}`);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | JSON TOKEN PROVIDER
    |--------------------------------------------------------------------------
    */

    getFromJSON(platform) {

        try {

            const jsonPath =
                process.env.JSON_STORAGE_PATH ||
                path.join(__dirname, '..', 'tokens.json');

            if (!fs.existsSync(jsonPath)) {
                console.warn("⚠️ tokens.json not found");
                return null;
            }

            const raw = fs.readFileSync(jsonPath, 'utf8');
            const tokens = JSON.parse(raw);

            return tokens?.[platform]?.access_token || null;

        } catch (error) {

            console.error("JSON token read error:", error.message);
            return null;

        }

    }

    /*
    |--------------------------------------------------------------------------
    | API TOKEN PROVIDER
    |--------------------------------------------------------------------------
    */

    async getFromAPI(platform) {

        try {

            const endpoint = process.env.TOKEN_API_ENDPOINT;

            if (!endpoint) {
                console.warn("⚠️ TOKEN_API_ENDPOINT missing");
                return null;
            }

            const response = await axios.get(`${endpoint}?platform=${platform}`);

            return response.data?.access_token || null;

        } catch (error) {

            console.error("External token API error:", error.message);
            return null;

        }

    }

}

module.exports = new TokenProvider();