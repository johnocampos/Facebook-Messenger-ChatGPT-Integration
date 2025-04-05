const { URL, URLSearchParams } = require("url");
const config = require('../config');
const { ResponseBody } = require('./responseBody');
const { fetchArtists, fetchLearnMoreInfo } = require('./ArtService');
const { updateUserMemory, getUserMemory } = require('./service/memoryService'); // ✅ Memory Integration
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const axios = require("axios");
const vblPrompt = require('./vblPrompt');

class ResponseService {

    handleReceivedMessage = async (body) => {
        for (const entry of body.entry) {
            for (const message of entry.messaging) {
                const senderId = message.sender.id;

                if (message.postback && message.postback.payload === config.postbackGetStarted) {
                    await this.sendGreeting(senderId, config.welcomeMessage);
                    await this.sendArtistCarousel(senderId);
                }

                else if (message.postback && message.postback.title === config.postbackLearnMore) {
                    await this.sendArtistBio(senderId, message.postback.payload);
                }

                else if (message.message && message.message.text) {
                    const userMessage = message.message.text;
                    const userMemory = getUserMemory(senderId);

                    // ✅ Personalized greeting for returning users
                    if (userMemory && userMemory.name) {
                        await this.sendGreeting(
                            senderId,
                            `Hi ${userMemory.name}! 👋 It’s been a while since we last talked about "${userMemory.lastTopic || 'your beauty goals'}". How have you been?`
                        );
                    }

                    // ✅ Update memory
                    updateUserMemory(senderId, {
                        lastTopic: 'General Inquiry',
                        lastMessage: userMessage
                    });

                    const aiReply = await this.getChatGptReply(userMessage, userMemory);
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
        let url = new URL(apiUrl);
        url.search = new URLSearchParams({
            access_token: config.accessToken
        });
        let response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }).catch(err => console.log(err));
        if (response.ok) {
            const responseJson = await response.json().catch(err => console.log(err));
            console.log(responseJson);
        } else {
            console.log(response);
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

    getChatGptReply = async (userInput, userMemory = null) => {
        try {
            const messages = [
                {
                    role: "system",
                    content: vblPrompt
                },
                {
                    role: "user",
                    content: userInput
                }
            ];

            if (userMemory && userMemory.name) {
                messages.unshift({
                    role: "system",
                    content: `User's name is ${userMemory.name}. Their last topic was ${userMemory.lastTopic || 'N/A'}.`
                });
            }

            const response = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-4-turbo",
                    messages: messages
                },
                {
                    headers: {
                        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            console.error("ChatGPT Error:", error.response ? error.response.data : error.message);
            return "Sorry! May error kami sa system. Please try again later or message our team directly.";
        }
    };
}

module.exports = { ResponseService };
