<template>
  <div class="about">
    <h1>This is a login-protected page</h1>
    <ul class="claims">
      <li v-for="c in claims" :key="c.key">
        <strong>{{ c.key }}</strong
        >: {{ c.value }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
export default {
  computed: {
    user(): any {
      return { ...this.$oidc.userProfile, accessToken: this.$oidc.accessToken };
    },
    claims() {
      if (this.user) {
        return Object.keys(this.user).map((key) => ({
          key,
          value: this.user[key],
        }));
      }
      return [];
    },
  },
};
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
