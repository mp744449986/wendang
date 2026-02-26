<template>
  <div class="dashboard">
    <h2>仪表盘</h2>
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.totalManuals }}</div>
          <div class="stat-label">总手册数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.totalPages }}</div>
          <div class="stat-label">总页数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.totalViews }}</div>
          <div class="stat-label">总访问量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ stats.todayViews }}</div>
          <div class="stat-label">今日访问</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="recent-card">
      <template #header>
        <span>最近手册</span>
      </template>
      <el-table :data="recentManuals" style="width: 100%">
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDashboard } from '@/api/auth'

const stats = ref({
  totalManuals: 0,
  totalPages: 0,
  totalViews: 0,
  todayViews: 0
})
const recentManuals = ref([])

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(async () => {
  try {
    const res = await getDashboard()
    stats.value = res.stats
    recentManuals.value = res.recentManuals
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
})
</script>

<style scoped>
.dashboard h2 {
  margin-bottom: 20px;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}
.stat-label {
  color: #909399;
  margin-top: 8px;
}
</style>
