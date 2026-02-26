<template>
  <div class="ad-list">
    <h2>广告管理</h2>
    <el-card>
      <el-table :data="ads" v-loading="loading" style="width: 100%">
        <el-table-column prop="slot_name" label="广告位名称" width="150" />
        <el-table-column prop="slot_type" label="类型" width="120" />
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ad_code" label="广告代码" min-width="200">
          <template #default="{ row }">
            <div class="code-preview">{{ row.ad_code?.substring(0, 100) }}...</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑广告位" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="广告位名称">
          <el-input v-model="form.slot_name" disabled />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.slot_type">
            <el-option label="百度联盟" value="baidu" />
            <el-option label="360联盟" value="360" />
            <el-option label="Google AdSense" value="adsense" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="广告代码">
          <el-input v-model="form.ad_code" type="textarea" :rows="6" placeholder="请输入广告代码" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAds, updateAd } from '@/api/ads'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saving = ref(false)
const ads = ref([])
const dialogVisible = ref(false)
const form = reactive({
  id: null,
  slot_name: '',
  slot_type: '',
  ad_code: '',
  is_active: true
})

const loadAds = async () => {
  loading.value = true
  try {
    const res = await getAds()
    ads.value = res.ads
  } catch (error) {
    console.error('Failed to load ads:', error)
  } finally {
    loading.value = false
  }
}

const handleEdit = (row) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    await updateAd(form.id, form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadAds()
  } catch (error) {
    console.error('Failed to save ad:', error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadAds()
})
</script>

<style scoped>
.ad-list h2 {
  margin-bottom: 20px;
}
.code-preview {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
