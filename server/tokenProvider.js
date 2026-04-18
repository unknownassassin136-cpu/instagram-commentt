const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

// Provider type: SQLITE | JSON | API
const PROVIDER_TYPE = process.env.TOKEN_PROVIDER_TYPE || 'JSON';

class TokenProvider {

    async getAccessToken(platform = 'instagram') {

        switch (PROVIDER_TYPE) {

            case 'SQLITE':
                return this.getFromSQLite(platform);

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
    | SQLITE TOKEN PROVIDER
    |--------------------------------------------------------------------------
    */

    getFromSQLite(platform) {

        return new Promise((resolve, reject) => {

            const dbPath =
                process.env.SQLITE_DB_PATH ||
                path.join(__dirname, '..', 'database.sqlite');

            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

            db.get(
                `SELECT access_token FROM tokens WHERE platform = ?`,
                [platform],
                (err, row) => {

                    db.close();

                    if (err) return reject(err);

                    resolve(row ? row.access_token : null);

                }
            );

        });

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
                console.warn("tokens.json not found");
                return null;
            }

            const raw = fs.readFileSync(jsonPath, 'utf8');
            const tokens = JSON.parse(raw);

            // return ONLY the token string
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

            if (!endpoint)
                throw new Error("TOKEN_API_ENDPOINT missing");

            const response =
                await axios.get(`${endpoint}?platform=${platform}`);

            return response.data?.access_token || null;

        } catch (error) {

            console.error("External token API error:", error.message);
            return null;

        }

    }

}

module.exports = new TokenProvider();