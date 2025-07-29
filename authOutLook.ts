// authOutlook.ts
import fs from 'fs';
import path from 'path';
import { PublicClientApplication, TokenCacheContext } from '@azure/msal-node';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

if (!process.env.CLIENT_ID) {
    throw new Error("CLIENT_ID environment variable not set");
}

const CLIENT_ID = process.env.CLIENT_ID;
const AUTHORITY = 'https://login.microsoftonline.com/common';
const SCOPES = ['Mail.Read'];
const TOKEN_PATH = path.join(process.cwd(), 'outlook_token.json');

// 🔁 Cache plugin to save/restore token from disk
const cachePlugin = {
  beforeCacheAccess: async (ctx: TokenCacheContext) => {
    if (fs.existsSync(TOKEN_PATH)) {
      ctx.tokenCache.deserialize(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    }
  },
  afterCacheAccess: async (ctx: TokenCacheContext) => {
    if (ctx.cacheHasChanged) {
      fs.writeFileSync(TOKEN_PATH, ctx.tokenCache.serialize());
    }
  },
};

const msalApp = new PublicClientApplication({
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
  },
  cache: {
    cachePlugin,
  },
});

export async function getOutlookAccessToken(): Promise<string> {
  const accounts = await msalApp.getTokenCache().getAllAccounts();

  if (accounts.length > 0) {
    // 🔁 Use refresh token if available
    const silentRes = await msalApp.acquireTokenSilent({
      account: accounts[0],
      scopes: SCOPES,
    });

    return silentRes.accessToken;
  }

  // 🔐 First-time device login
  const response = await msalApp.acquireTokenByDeviceCode({
    deviceCodeCallback: (res) => {
      console.log('\n🔐 Go to this link:');
      console.log(res.verificationUri);
      console.log('Enter this code:', res.userCode);
    },
    scopes: SCOPES,
  });

  return response.accessToken;
}
