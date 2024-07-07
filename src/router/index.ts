import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import idsrvAuth from "../idsrvAuth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      meta: {
        authName: idsrvAuth.authName,
      },
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/strategy",
      name: "strategy",
      meta: {
        authName: idsrvAuth.authName,
      },
      component: () => import("../views/StrategyView.vue"),
    },
    {
      path: "/stockPrice",
      name: "stockPrice",
      meta: {
        authName: idsrvAuth.authName,
      },
      component: () => import("../views/StockPrice.vue"),
    },
  ],
});

idsrvAuth.useRouter(router);

export default router;
