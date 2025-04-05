const { URL, URLSearchParams } = require("url");
const config = require('../config');
const { ResponseBody } = require('./responseBody');
const { fetchArtists, fetchLearnMoreInfo } = require('./ArtService');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const axios = require("axios"); // ChatGPT

class ResponseService {

    handleReceivedMessage = async (body) => {
        for (const entry of body.entry) {
            for (const message of entry.messaging) {
                const senderId = message.sender.id;

                // Get Started
                if (message.postback && message.postback.payload === config.postbackGetStarted) {
                    await this.sendGreeting(senderId, config.welcomeMessage);
                    await this.sendArtistCarousel(senderId);
                }

                // Learn More
                else if (message.postback && message.postback.title === config.postbackLearnMore) {
                    await this.sendArtistBio(senderId, message.postback.payload);
                }

                // Free-form chat
                else if (message.message && message.message.text) {
                    const userMessage = message.message.text;
                    let aiReply;
                    try {
                        aiReply = await this.getChatGptReply(userMessage);
                    } catch (err) {
                        console.error("ChatGPT Error:", err.response ? err.response.data : err.message);
                        aiReply = "Hi! Our AI assistant is currently offline. Please visit www.victorianbeautylounge.com or message us again shortly 💛";
                    }
                    await this.sendGreeting(senderId, aiReply);
                }
            }
        }
    };

    sendGreeting = async (senderId, message) => {
        const responseBody = new ResponseBody();
        await this.sendApi(config.urlMesseges, responseBody.greetingMessageBody(senderId, message));
    };

    sendArtistCarousel = async (senderId) => {
        const responseBody = new ResponseBody();
        await this.updateTypingIndicator(senderId, true);
        const artists = await fetchArtists();
        await this.sendApi(config.urlMesseges, responseBody.artistCarouselBody(senderId, artists));
        await this.updateTypingIndicator(senderId, false);
    };

    sendApi = async (apiUrl, body) => {
        const url = new URL(apiUrl);
        url.search = new URLSearchParams({
            access_token: config.accessToken
        });

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }).catch(err => console.error("❌ Fetch error:", err));

        if (response.ok) {
            const json = await response.json().catch(err => console.log("Parse error:", err));
            console.log("✅ Sent to Facebook:", json);
        } else {
            const errText = await response.text();
            console.error("❌ FB Send Failed:", errText);
        }
    };

    updateTypingIndicator = async (senderId, isActive) => {
        const responseBody = new ResponseBody();
        await this.sendApi(config.urlMesseges, responseBody.typingIndicatorBody(senderId, isActive));
    };

    sendArtistBio = async (senderId, artistName) => {
        const responseBody = new ResponseBody();
        await this.updateTypingIndicator(senderId, true);
        const artistBio = await fetchLearnMoreInfo(artistName);
        await this.sendApi(config.urlMesseges, responseBody.greetingMessageBody(senderId, artistBio));
        await this.updateTypingIndicator(senderId, false);
    };

    getAttachmentId = async (senderId) => {
        const responseBody = new ResponseBody();
        await this.sendApi(config.urlMesseges, responseBody.uploadImageBody(senderId));
    };

    getChatGptReply = async (userInput) => {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are the virtual assistant of Victorian Beauty Lounge Inc. (VBL), a high-end beauty lounge in the Philippines offering services like hair styling, nails, lashes, facials, gluta drip, diode hair removal, and more. Respond as a warm, elegant, professional beauty consultant. Always promote the VBL brand with poise and confidence. Provide accurate and helpful information. When people ask about services, bookings, pricing, or franchising, always answer in detail and guide them with links. Include calls to action when relevant. Be concise but friendly. Avoid long generic AI replies."
                    },
                    {
                        role: "user",
                        content: userInput
                    }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${config.chatGptKey}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.choices[0].message.content;
    };
}

module.exports = { ResponseService };
