<template>
  <div class="stats-page">
    <h2>统计数据</h2>
    <el-card>
      <el-form :inline="true">
        <el-form-item label="时间范围">
          <el-select v-model="period" @change="loadStats">
            <el-option label="今天" value="day" />
            <el-option label="最近7天" value="week" />
            <el-option label="最近30天" value="month" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-value">{{ stats.totalViews }}</div>
            <div class="stat-label">总访问量</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header><span>热门手册</span></template>
            <el-table :data="stats.topManuals" style="width: 100%">
              <el-table-column prop="title" label="标题" />
              <el-table-column prop="brand" label="品牌" width="100" />
              <el-table-column prop="views" label="访问量" width="100" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header><span>热门页面</span></template>
            <el-table :data="stats.topPages" style="width: 100%">
              <el-table-column prop="title" label="手册" />
              <el-table-column prop="page_number" label="页码" width="80" />
              <el-table-column prop="views" label="访问量" width="100" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getStats } from '@/api/stats'

const period = ref('week')
const stats = reactive({
  totalViews: 0,
  dailyViews: [],
  topManuals: [],
  topPages: []
})

const loadStats = async () => {
  try {
    const res = await getStats(period.value)
    Object.assign(stats, res)
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.stats-page h2 {
  margin-bottom: 20px;
}
.stat-card {
  text-align: center;
  padding: 20px;
}
.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
}
.stat-label {
  color: #909399;
  margin-top: 10px;
}
</style>
