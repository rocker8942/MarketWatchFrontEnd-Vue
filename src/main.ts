import { createApp, type App } from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';   // optional
import Row from 'primevue/row';                   // optional
import Aura from '@primevue/themes/aura';



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

    app.use(PrimeVue, {
      // Default theme configuration
      theme: {
          preset: Aura,
          options: {
              prefix: 'p',
              darkModeSelector: 'system',
              cssLayer: false
          }
      }
   });

    app.component('DataTable', DataTable);
    // eslint-disable-next-line vue/multi-word-component-names
    app.component('Column', Column);

    app.mount("#app");

  } else {
    console.log("Startup was not ok");
  }
});
