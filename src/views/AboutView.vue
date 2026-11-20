<template>
  <div class="data-workspace">
    <PageHeader title="Account" />
    <dl v-if="claims.length" class="claims">
      <template v-for="claim in claims" :key="claim.label">
        <dt>{{ claim.label }}</dt>
        <dd>{{ claim.value }}</dd>
      </template>
    </dl>
    <p v-else>No account details available.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageHeader from "@/components/PageHeader.vue";

export default defineComponent({
  components: { PageHeader },
  computed: {
    claims(): Array<{ label: string; value: string }> {
      const profile = this.$oidc.userProfile;
      const fields = [
        { label: "Name", value: profile?.name },
        { label: "Username", value: profile?.preferred_username },
        { label: "Email", value: profile?.email },
      ];
      return fields.filter((field): field is { label: string; value: string } =>
        typeof field.value === "string" && field.value.length > 0
      );
    },
  },
});
</script>

<style scoped>
.claims {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 16px;
  max-width: 540px;
  font-size: 14px;
}

.claims dt {
  font-weight: 600;
}

.claims dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
