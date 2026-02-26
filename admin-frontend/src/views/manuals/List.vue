<template>
  <div class="manual-list">
    <div class="header">
      <h2>手册管理</h2>
      <el-button type="primary" @click="$router.push('/manuals/create')">新建手册</el-button>
    </div>

    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="搜索">
          <el-input v-model="searchForm.search" placeholder="标题/型号" clearable @clear="loadManuals" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadManuals">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="manuals" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="brand" label="品牌" width="120" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="page_count" label="页数" width="80" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/manuals/${row.id}/edit`)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadManuals"
        @current-change="loadManuals"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getManuals, deleteManual } from '@/api/manuals'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const manuals = ref([])
const searchForm = reactive({
  search: '',
  status: ''
})
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const loadManuals = async () => {
  loading.value = true
  try {
    const res = await getManuals({
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    })
    manuals.value = res.manuals
    pagination.total = res.pagination.total
  } catch (error) {
    console.error('Failed to load manuals:', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这本手册吗？', '确认删除', {
      type: 'warning'
    })
    await deleteManual(row.id)
    ElMessage.success('删除成功')
    loadManuals()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete manual:', error)
    }
  }
}

onMounted(() => {
  loadManuals()
})
</script>

<style scoped>
.manual-list h2 {
  margin-bottom: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.search-form {
  margin-bottom: 20px;
}
</style>
