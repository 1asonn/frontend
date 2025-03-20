<template>
  <div>
    <div>this is the page of index!</div>
    <div class="time">
      <span>{{ currentTime }}</span>
    </div>
    <div class="AiAgent">
    </div>
  </div>
</template>

<script>
  import AiAgent from '../components/AiAgent.vue'

  export default{
      name:"Index",
      components:{
        AiAgent
      },
      data(){
        return{
          currentTime: new Date().toLocaleString()
        }
      },
      methods:{
      },
      created(){
        setInterval(() => {
            this.currentTime = new Date().toLocaleString()
        })
      }
  }
</script>
 
<style scoped>
 .AiAgent {
    position:fixed;
    bottom: 10%;
    right: 10%;
  }
</style>
