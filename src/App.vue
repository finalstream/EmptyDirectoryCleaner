<template>
  <div id="app">
    <el-container>
      <el-main><router-view /></el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: "app",
  components: {},
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 10px;
}

.el-header {
  color: #3a8ee6;
}
</style>
