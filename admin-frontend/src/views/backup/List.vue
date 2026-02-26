<template>
  <div class="backup-page">
    <h2>备份管理</h2>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>备份列表</span>
          <el-button type="primary" @click="handleCreate">创建备份</el-button>
        </div>
      </template>

      <el-table :data="backups" v-loading="loading" style="width: 100%">
        <el-table-column prop="backup_id" label="备份ID" width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'manual' ? 'primary' : 'info'">
              {{ row.type === 'manual' ? '手动' : '定时' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size_bytes" label="大小" width="120">
          <template #default="{ row }">
            {{ formatSize(row.size_bytes) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="started_at" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.started_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getBackups, createBackup, deleteBackup } from '@/api/backup'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const backups = ref([])

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const formatSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const loadBackups = async () => {
  loading.value = true
  try {
    const res = await getBackups()
    backups.value = res.backups
  } catch (error) {
    console.error('Failed to load backups:', error)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  try {
    await createBackup({ include_images: true })
    ElMessage.success('备份任务已创建')
    loadBackups()
  } catch (error) {
    console.error('Failed to create backup:', error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个备份记录吗？', '确认删除', {
      type: 'warning'
    })
    await deleteBackup(row.backup_id)
    ElMessage.success('删除成功')
    loadBackups()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete backup:', error)
    }
  }
}

onMounted(() => {
  loadBackups()
})
</script>

<style scoped>
.backup-page h2 {
  margin-bottom: 20px;
}
</style>
