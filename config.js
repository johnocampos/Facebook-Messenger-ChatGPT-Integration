module.exports = {
  // Facebook Messenger API Endpoints
  urlProfile: 'https://graph.facebook.com/v17.0/me/messenger_profile',
  urlMesseges: 'https://graph.facebook.com/v17.0/me/messages',
  urlAttachment: 'https://graph.facebook.com/v17.0/me/message_attachment',

  // ✅ Your actual Page Access Token
  accessToken: process.env.FB_PAGE_TOKEN,

  // ✅ Your actual OpenAI GPT API Key
  chatGptKey: process.env.OPENAI_API_KEY,

  // Postback payloads
  postbackGetStarted: 'GET_STARTED',
  postbackLearnMore: 'Learn More',

  // Warm, brand-aligned welcome message
  welcomeMessage: 'Hi! Welcome to Victorian Beauty Lounge 💛 How can we help you today?'
};
