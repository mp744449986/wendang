<template>
  <div class="settings-page">
    <h2>系统设置</h2>
    <el-card>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="系统名称">在线文档浏览系统</el-descriptions-item>
        <el-descriptions-item label="版本">1.0.0</el-descriptions-item>
        <el-descriptions-item label="技术栈">
          <el-tag>Node.js</el-tag>
          <el-tag>Express</el-tag>
          <el-tag>PostgreSQL</el-tag>
          <el-tag>Vue 3</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
</script>

<style scoped>
.settings-page h2 {
  margin-bottom: 20px;
}
</style>
