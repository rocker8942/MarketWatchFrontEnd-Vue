import { createApp, type App } from "vue";
import App from "./App.vue";
import router from "./router";

import "./assets/main.css";

import idsrvAuth from "./idsrvAuth";
import ApiService from "./core/services/apiService";

async function initApp(appInstance: App<Element>) {
 
  await ApiService.install(appInstance);

}

idsrvAuth.startup().then((ok) => {
  if (ok) {

    const app = createApp(App).use(router);
    // a little something extra
    app.config.globalProperties.$oidc = idsrvAuth;

    // ApiService.install(app);

    initApp(app);

    app.mount("#app");

  } else {
    console.log("Startup was not ok");
  }
});
