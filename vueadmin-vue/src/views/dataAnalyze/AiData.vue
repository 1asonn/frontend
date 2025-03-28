<template>
    <div>this is AiData Page!</div>
</template>


<script>
import { DataAnalyze } from '@/api/aiAgent'
export default {
    name: 'AiData',
    data() {
        return {
            
        }
    },
    created(){
        DataAnalyze()
    }
}
</script>

<style>

</style>