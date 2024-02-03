const express = require('express');
const { getCookie, setCookie } = require('cookies-next');
const { initAPIClient, getLoggedInUser, updateTokens, initalizeSession,getAuthorizationUrl } = require('./shared/oauth');
const db = require('./shared/db');


const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());



// Step 1: Redirect the user to the Pipedrive authorization URL
app.get('/authorize', (req, res) => {
  try {
    const client = initAPIClient({});
    console.log("Done Authorize")
    res.redirect(getAuthorizationUrl(client));
  } catch (error) {
    console.log('Authorization URL generation error:', error);
    res.status(500).json(error);
  }
});

// Step 2: Handle the OAuth callback
app.get('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const client = initAPIClient({});
    const token = await client.authorize(code);
    updateTokens(client, token);

    const user = await getLoggedInUser(client);
    const me = user.data;

    const credentials = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: String(Date.now() + token.expires_in * 1000),
    };

    await db.user.upsert({
      where: {
        accountId: String(me.id),
      },
      update: credentials,
      create: {
        accountId: String(me.id),
        name: me.name,
        ...credentials,
      },
    });

    // Redirect the user to the UI endpoint after successful authorization
    res.redirect('YOUR_UI_ENDPOINT'); // Replace 'YOUR_UI_ENDPOINT' with the actual URL
  } catch (error) {
    console.log('OAuth callback error:', error);
    res.status(500).json(error);
  }
});

// Step 3: Initialize user session
app.get('/init-session', async (req, res) => {
  try {
    const { userId } = req.query;
    const session = await initalizeSession(req, res, userId);
    res.json(session);
  } catch (error) {
    console.log('Session initialization error:', error);
    res.status(500).json(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
