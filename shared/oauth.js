// shared/oauth.js
const cookiesNext=require("cookies-next")
const pipedrive=require("pipedrive")
require('dotenv').config();

// Initialize the API client
const initAPIClient = ({ accessToken = '', refreshToken = '' }) => {
  const client = new pipedrive.ApiClient();
  const oAuth2 = client.authentications.oauth2;
  console.log(client)
  // Set the Client Credentials based on the Pipedrive App details
  oAuth2.clientId = process.env.CLIENT_ID;
  oAuth2.clientSecret = process.env.CLIENT_SECRET;
  oAuth2.redirectUri = process.env.REDIRECT_URL;
  console.log(oAuth2.clientId)
  if (accessToken) oAuth2.accessToken = accessToken;
  if (refreshToken) oAuth2.refreshToken = refreshToken;

  return client;
};

// Gets the API client based on session cookies
const getAPIClient = (req, res) => {
  const session = cookiesNext.getCookie('session', { req, res });
  return initAPIClient({
    accessToken: JSON.parse(session).token,
  });
};

// Generate the authorization URL for the 1st step
 const getAuthorizationUrl = (client) => {
  const authUrl = client.buildAuthorizationUrl();
  console.log('Authorization URL generated');
  return authUrl;
};

// Get the currently authorized user details
 const getLoggedInUser = async (client) => {
  const api = new pipedrive.UsersApi(client);
  const data = await api.getCurrentUser();
  console.log('Currently logged-in user details obtained');
  return data;
};

// Update Access and Refresh tokens
 const updateTokens = (client, token) => {
  console.log('Updating access + refresh token details');
  const oAuth2 = client.authentications.oauth2;
  oAuth2.accessToken = token.access_token;
  oAuth2.refreshToken = token.refresh_token;
};

// Get Session Details
const initalizeSession = async (req, res, userId) => {
  try {
    // 1.1 Check if the session cookie is already set
    console.log(`Checking if a session cookie is set for ${userId}`);
    const session = cookiesNext.getCookie('session', { req, res });

    // ... (rest of the logic)

  } catch (error) {
    console.log("Couldn't create session :[");
    console.log(error);
  }
};

// Set cookies
const setSessionCookie = (auth, id, name, token, expiry, req, res) => {
  const newSession = {
    auth,
    id,
    name,
    token,
  };

  const cookieParams = {
    maxAge: Math.round((parseInt(expiry) - Date.now()) / 1000),
    sameSite: 'none',
    secure: true,
    req,
    res,
  };
  // 1.4. Set the cookie
  cookiesNext.setCookie('session', JSON.stringify(newSession), cookieParams);

  return newSession;
};

module.exports={
    initAPIClient,
    getAPIClient,
    getAuthorizationUrl,
    getLoggedInUser,
    updateTokens,
    initalizeSession,
    setSessionCookie
}