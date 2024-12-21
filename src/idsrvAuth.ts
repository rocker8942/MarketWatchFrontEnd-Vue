import type { User } from "oidc-client";
import { createOidcAuth, SignInType, LogLevel } from "./vue-oidc-client";
import Globalconfig from "./core/config/globalConfig"; 

const loco = window.location;
// const appRootUrl = `${loco.protocol}//${loco.host}${process.env.BASE_URL}`
const appRootUrl = `${loco.protocol}//${loco.host}`;

const idsrvAuth = createOidcAuth(
  "main",
  SignInType.Window,
  appRootUrl,
  {
    authority: Globalconfig.APIServer,
    client_id: "MarketWatchWeb_App",
    response_type: "code",
    scope: "offline_access MarketWatchWeb",
    prompt: "login",
  },
  console,
  LogLevel.Debug
);

// handle events
idsrvAuth.events.addAccessTokenExpiring(function () {
  // eslint-disable-next-line no-console
  console.log("access token expiring");
});

idsrvAuth.events.addAccessTokenExpired(function () {
  // eslint-disable-next-line no-console
  console.log("access token expired");
});

idsrvAuth.events.addSilentRenewError(function (err: Error) {
  // eslint-disable-next-line no-console
  console.error("silent renew error", err);
});

idsrvAuth.events.addUserLoaded(function (user: User) {
  // eslint-disable-next-line no-console
  console.log("user loaded", user);
});

idsrvAuth.events.addUserUnloaded(function () {
  // eslint-disable-next-line no-console
  console.log("user unloaded");
});

idsrvAuth.events.addUserSignedOut(function () {
  // eslint-disable-next-line no-console
  console.log("user signed out");
});

idsrvAuth.events.addUserSessionChanged(function () {
  // eslint-disable-next-line no-console
  console.log("user session changed");
});

export default idsrvAuth;
