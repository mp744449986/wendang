<template>
  <div class="manual-edit">
    <h2>编辑手册</h2>
    <el-card v-loading="pageLoading">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入手册标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status">
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="form.brand" placeholder="请输入品牌名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="型号" prop="model">
              <el-input v-model="form.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分类" prop="category">
              <el-input v-model="form.category" placeholder="请输入分类" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>

        <el-divider>文档上传</el-divider>

        <el-form-item label="上传文档">
          <el-upload
            ref="uploadRef"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :data="{ manual_id: manualId }"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :show-file-list="true"
            :limit="1"
            accept=".pdf,.ppt,.pptx,.doc,.docx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、PPT、Word 文件，最大 200MB</div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="loading">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="pages.length > 0" style="margin-top: 20px;">
      <template #header>
        <span>页面列表 ({{ pages.length }} 页)</span>
      </template>
      <el-table :data="pages" style="width: 100%">
        <el-table-column prop="page_number" label="页码" width="80" />
        <el-table-column label="预览" width="120">
          <template #default="{ row }">
            <el-image
              :src="'/' + row.image_webp"
              style="width: 100px; height: 60px;"
              fit="contain"
            />
          </template>
        </el-table-column>
        <el-table-column prop="section_title" label="章节标题" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getManual, updateManual, getManualPages } from '@/api/manuals'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const manualId = computed(() => route.params.id)

const formRef = ref()
const pageLoading = ref(true)
const loading = ref(false)
const pages = ref([])

const form = reactive({
  title: '',
  brand: '',
  model: '',
  category: '',
  description: '',
  status: 'draft'
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  brand: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  model: [{ required: true, message: '请输入型号', trigger: 'blur' }]
}

const uploadUrl = computed(() => '/api/upload')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

const beforeUpload = (file) => {
  const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx']
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  if (!allowedTypes.includes(ext)) {
    ElMessage.error('只支持 PDF、PPT、Word 文件')
    return false
  }
  if (file.size > 200 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 200MB')
    return false
  }
  return true
}

const handleUploadSuccess = (response) => {
  ElMessage.success(`文档处理完成，共 ${response.pageCount} 页`)
  loadPages()
}

const handleUploadError = (error) => {
  ElMessage.error('上传失败：' + (error.message || '未知错误'))
}

const loadManual = async () => {
  try {
    const res = await getManual(manualId.value)
    Object.assign(form, res.manual)
    pages.value = res.manual.pages || []
  } catch (error) {
    ElMessage.error('加载失败')
    router.push('/manuals')
  } finally {
    pageLoading.value = false
  }
}

const loadPages = async () => {
  try {
    const res = await getManualPages(manualId.value)
    pages.value = res.pages
  } catch (error) {
    console.error('Failed to load pages:', error)
  }
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    await updateManual(manualId.value, form)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('Failed to save manual:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadManual()
})
</script>

<style scoped>
.manual-edit h2 {
  margin-bottom: 20px;
}
</style>
