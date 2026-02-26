<template>
  <div class="manual-create">
    <h2>新建手册</h2>
    <el-card>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入手册标题" />
        </el-form-item>
        <el-form-item label="品牌" prop="brand">
          <el-input v-model="form.brand" placeholder="请输入品牌名称" />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input v-model="form.model" placeholder="请输入型号" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="form.category" placeholder="请输入分类" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">创建</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createManual } from '@/api/manuals'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = reactive({
  title: '',
  brand: '',
  model: '',
  category: '',
  description: ''
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  brand: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  model: [{ required: true, message: '请输入型号', trigger: 'blur' }]
}

const generateSlug = (brand, model) => {
  return `${brand.toLowerCase().replace(/\s+/g, '-')}-${model.toLowerCase().replace(/\s+/g, '-')}`
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    const data = {
      ...form,
      slug: generateSlug(form.brand, form.model),
      file_type: 'pdf'
    }
    const res = await createManual(data)
    ElMessage.success('创建成功')
    router.push(`/manuals/${res.manual.id}/edit`)
  } catch (error) {
    console.error('Failed to create manual:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.manual-create h2 {
  margin-bottom: 20px;
}
</style>
