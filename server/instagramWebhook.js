const express = require('express');
const axios = require('axios');
const router = express.Router();

const tokenProvider = require('./tokenProvider');
const automationRules = require('./automationRules');
const messageTemplates = require('./messageTemplates');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;


/*
|--------------------------------------------------------------------------
| Meta Webhook Verification
|--------------------------------------------------------------------------
*/

router.get('/', (req, res) => {

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified successfully by Meta");
        return res.status(200).send(challenge);
    }

    res.status(200).send("Instagram Webhook Server Running 🚀");
});


/*
|--------------------------------------------------------------------------
| Instagram Webhook Event Processing
|--------------------------------------------------------------------------
*/

router.post('/', async (req, res) => {

    res.status(200).send("EVENT_RECEIVED");

    try {

        const body = req.body;

        if (
            !body ||
            !body.entry ||
            !body.entry[0] ||
            !body.entry[0].changes ||
            !body.entry[0].changes[0] ||
            !body.entry[0].changes[0].value
        ) {
            console.log("Invalid payload structure");
            return;
        }

        const value = body.entry[0].changes[0].value;

        const comment_text = value.text;
        const comment_id = value.id;
        const sender_id = value.from?.id;
        const media_id = value.media?.id;

        if (!comment_text || !comment_id || !sender_id) {
            console.log("Missing required comment data");
            return;
        }

        console.log(`📩 Comment received: "${comment_text}" from ${sender_id}`);
        console.log("🎬 REEL ID:", media_id);

        // Ignore bot's own reply comment
        if (comment_text === "Hey there! Details sent to your DM 📩") {
            return;
        }

        const rule = automationRules[media_id];

        if (!rule) {
            console.log("⚠️ No automation rule for this reel.");
            return;
        }

        if (comment_text.toLowerCase().includes(rule.keyword)) {

            console.log(`🔎 Keyword '${rule.keyword}' detected`);

            await runAutomation(comment_id, sender_id, rule.template);

        }

    } catch (error) {

        console.error("Webhook processing error:", error.message);

    }

});


/*
|--------------------------------------------------------------------------
| Automation Logic
|--------------------------------------------------------------------------
*/

async function runAutomation(comment_id, sender_id, templateName) {

    try {

        const accessToken = await tokenProvider.getAccessToken("instagram");

        console.log("🔑 TOKEN BEING USED:", accessToken);

        if (!accessToken) {
            throw new Error("Access token not found");
        }

        /*
        |--------------------------------------------------------------------------
        | Step 1: Reply to Comment
        |--------------------------------------------------------------------------
        */

        const replyUrl = `https://graph.instagram.com/v23.0/${comment_id}/replies`;

        await axios.post(replyUrl, {
            message: "Hey there! Details sent to your DM 📩",
            access_token: accessToken
        });

        console.log(`💬 Replied to comment ${comment_id}`);

        /*
        |--------------------------------------------------------------------------
        | Step 2: Send DM
        |--------------------------------------------------------------------------
        */

        const dmUrl = `https://graph.instagram.com/v23.0/me/messages`;

        const message = messageTemplates[templateName];

        if (!message) {
            console.log("⚠️ Template not found:", templateName);
            return;
        }

        await axios.post(dmUrl, {
            recipient: {
                id: sender_id
            },
            message: {
                text: message
            },
            access_token: accessToken
        });

        console.log(`📨 DM sent to ${sender_id}`);

    } catch (error) {

        console.error(
            "Automation error:",
            error.response?.data || error.message
        );

    }

}

module.exports = router;