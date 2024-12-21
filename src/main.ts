import { createApp, type App } from "vue";
import MainApp from "./App.vue";
import router from "./router";

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'



import "./assets/main.css";

import idsrvAuth from "./idsrvAuth";
import ApiService from "./core/services/apiService";

async function initApp(appInstance: App<Element>) {
 
  await ApiService.install(appInstance);

}

idsrvAuth.startup().then((ok) => {
  if (ok) {

    const app = createApp(MainApp).use(router);
    // a little something extra
    app.config.globalProperties.$oidc = idsrvAuth;

    initApp(app);

    app.use(ElementPlus);

    app.mount("#app");

  } else {
    console.log("Startup was not ok");
  }
});
