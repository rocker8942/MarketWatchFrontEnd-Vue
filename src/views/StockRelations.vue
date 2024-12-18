<template>
    <div>
    
        <h1>Stock Relations</h1>
    
    </div>
</template>

<script lang="ts">
import router from "@/router";
import { defineComponent } from "vue";

export default defineComponent({
    name: "StockRelations",
    setup() {

        const stockId = router.currentRoute.value.params.stockId;

        return {
            stockId

        };
    },
    mounted() {
        console.log(this.stockId);
    }
});
</script>