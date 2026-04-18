<template>
  <n-button size="small" type="info" @click="showModal = true">{{ props.title }}</n-button>
  <n-modal v-model:show="showModal" preset="card" :title="props.title" size="huge" :style="{ width: 'min(900px, calc(100vw - 24px))' }"
    :bordered="false">
    <div>
      <n-form ref="formRef" :model="formData">
        <n-form-item label="产品名称">
          <n-input v-model:value="formData.houseName" placeholder="请输入产品名称" />
        </n-form-item>

        <div class="edit-house-row">
          <n-form-item label="地基面积(m²)" class="edit-house-row__item">
            <n-input v-model:value="formData.foundationArea" placeholder="请输入地基面积" />
          </n-form-item>
          <n-form-item label="建筑面积(m²)" class="edit-house-row__item">
            <n-input v-model:value="formData.constructionArea" placeholder="请输入建筑面积" />
          </n-form-item>
        </div>

        <n-form-item label="层数">
          <n-select v-model:value="formData.floors" placeholder="请选择层数" :options="layersOptions" />
        </n-form-item>

        <n-form-item label="室内布局">
          <div class="edit-house-layout">
            <n-select v-model:value="formData.interiorLayout[0]" :options="interiorOptions1" class="edit-house-layout__select" />
            <span>室</span>
            <n-select v-model:value="formData.interiorLayout[1]" :options="interiorOptions2" class="edit-house-layout__select" />
            <span>厅</span>
            <n-select v-model:value="formData.interiorLayout[2]" :options="interiorOptions3" class="edit-house-layout__select" />
            <span>卫</span>
          </div>
        </n-form-item>

        <n-form-item label="价格">
          <n-input v-model:value="formData.price" placeholder="请输入实际价格" />
        </n-form-item>

        <n-form-item label="建筑风格">
          <n-select v-model:value="formData.style" placeholder="请选择建筑风格" :options="styleOptions" />
        </n-form-item>

        <n-form-item label="施工方式">
          <n-select v-model:value="formData.constructionMethod" placeholder="请选择施工方式"
            :options="constructionMethodOptions" />
        </n-form-item>

        <ImgUpload ref="coverUploadRef" v-model:model-value="formData.coverImage" label="产品封面图片" upload-text="添加封面"
          :max="1" @pending-delete="handleCoverPendingDelete" @pending-upload="handleCoverPendingUpload"
          @cancel-operations="handleCoverCancelOperations" />
        <ImgUpload ref="effectUploadRef" v-model:model-value="formData.effects" label="效果图" upload-text="添加效果图"
          @pending-delete="handleEffectPendingDelete" @pending-upload="handleEffectPendingUpload"
          @cancel-operations="handleEffectCancelOperations" />
        <ImgUpload ref="planUploadRef" v-model:model-value="formData.plans" label="平面图" upload-text="添加平面图"
          @pending-delete="handlePlanPendingDelete" @pending-upload="handlePlanPendingUpload"
          @cancel-operations="handlePlanCancelOperations" />

        <ThreeUpload :productId="formData.id" :initialUrl="formData.three" />
      </n-form>
    </div>

    <template #footer>
      <div class="edit-house-actions responsive-actions">
        <n-button @click="showModal = false">取消</n-button>
        <n-button type="success" @click="handleSave" :loading="saving">提交</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import API from '@/api/house/house'
import { useMessage } from 'naive-ui'
import ImgUpload from '@/components/admin/imgUpload.vue'
import { resolveAssetUrl } from '@/utils/asset'
import { resolveModelAssetUrl } from '@/utils/modelAsset'
// ThreeUpload 似乎是您文件中的一个组件，如果它不存在，请移除
// import ThreeUpload from '@/components/admin/ThreeUpload.vue' // 假设的路径

const message = useMessage()
const showModal = ref(false)
const saving = ref(false)

// Ref
const effectUploadRef = ref(null)
const planUploadRef = ref(null)
const coverUploadRef = ref(null) // 新增

// Pending Operations
const pendingEffectOperations = ref({ delete: [], upload: [] })
const pendingPlanOperations = ref({ delete: [], upload: [] })
const pendingCoverOperations = ref({ delete: [], upload: [] }) // 新增

const props = defineProps({
  title: {
    type: String,
    default: '添加户型',
  },
  itemId: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['saved'])

const normalizeImageAsset = (item) => {
  if (!item || typeof item !== 'object') return item
  return {
    ...item,
    url: resolveAssetUrl(item.url || ''),
  }
}

// 选项配置
const layersOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
]
const styleOptions = [
  { label: '现代风格', value: 'modern' },
  { label: '中式风格', value: 'chinese' },
  { label: '欧式风格', value: 'european' },
]
const constructionMethodOptions = [
  { label: '砖混', value: '砖混', type: 1 },
  { label: '重钢', value: '重钢', type: 2 },
]
const interiorOptions1 = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
]
const interiorOptions2 = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
]
const interiorOptions3 = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
]
// ...

// 表单数据
const formData = ref({
  id: 0,
  houseName: '',
  foundationArea: '',
  constructionArea: '',
  floors: null,
  interiorLayout: [0, 0, 0],
  price: '',
  style: '',
  constructionMethod: '',
  effects: [],
  plans: [],
  three: '',
  coverImage: [], // 适配 ImgUpload，改为数组
})

const imagesInitialized = ref(false)

watch(showModal, async (newVal) => {
  if (!newVal) {
    imagesInitialized.value = false
    return
  }

  // 重置所有待处理操作
  pendingEffectOperations.value = { delete: [], upload: [] }
  pendingPlanOperations.value = { delete: [], upload: [] }
  pendingCoverOperations.value = { delete: [], upload: [] } // 新增

  if (effectUploadRef.value) {
    effectUploadRef.value.clearPendingOperations()
  }
  if (planUploadRef.value) {
    planUploadRef.value.clearPendingOperations()
  }
  if (coverUploadRef.value) {
    // 新增
    coverUploadRef.value.clearPendingOperations()
  }

  if (props.itemId) {
    // 编辑模式
    try {
      //
      // !!! 500 错误发生在这里 !!!
      //
      const res = await API.getHouseDetails(props.itemId)
      //
      // !!! 如果后端修复，代码会继续执行 !!!
      //
      const data = res.data

      const formatImages = (images) => {
        if (!images || !Array.isArray(images)) return []
        if (images.length === 0) return []
        const firstItem = images[0]
        if (typeof firstItem === 'object' && firstItem.id && firstItem.url) {
          return images.map((item) =>
            normalizeImageAsset({
              id: item.id,
              url: item.url,
              name: item.name,
              size: item.size,
              type: item.type,
            })
          )
        }
        if (typeof firstItem === 'string') {
          return images.map((url, index) => ({
            id: `temp-${Date.now()}-${index}`,
            url: resolveAssetUrl(url),
          }))
        }
        return []
      }

      const mergeById = (localList, backendList) => {
        const map = new Map()
          ; (localList || []).forEach((item) => {
            if (item && item.id != null) map.set(item.id, item)
          })
          ; (backendList || []).forEach((item) => {
            if (item && item.id != null) map.set(item.id, item)
          })
        return Array.from(map.values())
      }

      // 基本字段赋值
      formData.value.id = data.id
      formData.value.houseName = data.name || ''
      formData.value.foundationArea = String(data.baseArea || '')
      formData.value.constructionArea = String(data.buildArea || '')
      formData.value.floors = data.floors || null
      formData.value.interiorLayout = data.roomLayout || [0, 0, 0]
      formData.value.price = String(data.price || '')
      formData.value.style = data.style || ''
      formData.value.constructionMethod = data.constructionMethod || ''
      formData.value.three = resolveModelAssetUrl(data.model3d || '')

      // 效果图
      const backendEffects = formatImages(data.renderings)
      formData.value.effects = mergeById(formData.value.effects, backendEffects)
      const backendPlans = formatImages(data.floorPlans)
      formData.value.plans = mergeById(formData.value.plans, backendPlans)

      // --- 修改：加载封面图 (适配 ImgUpload) ---
      //
      //
      // !!! 第 1 处修改： data.coverImage -> data.coverImageUrl !!!
      //
      //
      if (data.coverImageUrl) {
        // ImgUpload 需要一个数组
        formData.value.coverImage = [
          normalizeImageAsset({
            id: 'cover-1', // 'id' 必须是唯一的
            url: data.coverImageUrl, // !!! 使用 coverImageUrl
            status: 'finished',
            name: '封面图.png',
          }),
        ]
      } else {
        formData.value.coverImage = []
      }
      // --- 结束 ---

      imagesInitialized.value = true
    } catch (error) {
      //
      // !!! 500 错误会在这里被捕获 !!!
      //
      console.error('获取详情失败 (可能是500错误):', error)
      message.error('获取详情失败: ' + (error.message || '服务器内部错误'))
      showModal.value = false
    }
  } else {
    // 添加模式：重置表单
    formData.value = {
      id: 0,
      houseName: '',
      foundationArea: '',
      constructionArea: '',
      floors: null,
      interiorLayout: [0, 0, 0],
      price: '',
      style: '',
      constructionMethod: '',
      effects: [],
      plans: [],
      three: '',
      coverImage: [], // 适配 ImgUpload
    }
    imagesInitialized.value = true
  }
})

// --- 新增：封面图操作处理 ---
const handleCoverPendingDelete = (deleteList) => {
  pendingCoverOperations.value.delete = deleteList
}
const handleCoverPendingUpload = (uploadList) => {
  pendingCoverOperations.value.upload = uploadList
}
const handleCoverCancelOperations = () => {
  pendingCoverOperations.value = { delete: [], upload: [] }
}
// --- 结束 ---

// --- 效果图操作处理 ---
const handleEffectPendingDelete = (deleteList) => {
  pendingEffectOperations.value.delete = deleteList
}
const handleEffectPendingUpload = (uploadList) => {
  pendingEffectOperations.value.upload = uploadList
}
const handleEffectCancelOperations = () => {
  pendingEffectOperations.value = { delete: [], upload: [] }
}

// --- 平面图操作处理 ---
const handlePlanPendingDelete = (deleteList) => {
  pendingPlanOperations.value.delete = deleteList
}
const handlePlanPendingUpload = (uploadList) => {
  pendingPlanOperations.value.upload = uploadList
}
const handlePlanCancelOperations = () => {
  pendingPlanOperations.value = { delete: [], upload: [] }
}

// --- API：删除效果图 ---
const deleteEffectImage = async (imageData) => {
  try {
    const image = imageData.image
    if (
      image &&
      typeof image === 'object' &&
      image.id !== undefined &&
      image.id !== null
    ) {
      if (typeof image.id === 'number' && image.id > 0) {
        await API.deleteEffectImage(image.id)
        message.success('效果图删除成功')
        return true
      } else if (typeof image.id === 'string' && image.id.startsWith('temp-')) {
        return true
      }
    }
    return true
  } catch (error) {
    console.error('效果图删除失败:', error)
    message.error('效果图删除失败')
    throw error
  }
}

// --- API：删除平面图 ---
const deletePlanImage = async (imageData) => {
  try {
    const image = imageData.image
    if (
      image &&
      typeof image === 'object' &&
      image.id !== undefined &&
      image.id !== null
    ) {
      if (typeof image.id === 'number' && image.id > 0) {
        await API.deletePlanImage(image.id)
        message.success('平面图删除成功')
        return true
      } else if (typeof image.id === 'string' && image.id.startsWith('temp-')) {
        return true
      }
    }
    return true
  } catch (error) {
    console.error('平面图删除失败:', error)
    message.error('平面图删除失败')
    throw error
  }
}

// --- API：上传效果图 (多图) ---
const uploadEffectImages = async (productId) => {
  if (!pendingEffectOperations.value.upload.length || !productId) {
    return []
  }
  try {
    const formDataToSend = new FormData()
    pendingEffectOperations.value.upload.forEach((file) => {
      formDataToSend.append('renderingFiles', file)
    })
    const res = await API.addEffectImage(productId, formDataToSend)
    if (res.data && Array.isArray(res.data)) {
      const uploadedImages = res.data.map((item) =>
        normalizeImageAsset({
          id: item.id,
          url: item.url,
          name: item.name,
          size: item.size,
          type: item.type,
        })
      )
      message.success(res.msg || res.message || '效果图上传成功')
      return uploadedImages
    }
    return []
  } catch (error) {
    console.error('效果图上传失败:', error)
    message.error('效果图上传失败')
    throw error
  }
}

// --- API：上传平面图 (多图) ---
const uploadPlanImages = async (productId) => {
  if (!pendingPlanOperations.value.upload.length || !productId) {
    return []
  }
  try {
    const formDataToSend = new FormData()
    pendingPlanOperations.value.upload.forEach((file) => {
      formDataToSend.append('floorPlanFiles', file)
    })
    const res = await API.addPlanImage(productId, formDataToSend)
    if (res.data && Array.isArray(res.data)) {
      const uploadedImages = res.data.map((item) =>
        normalizeImageAsset({
          id: item.id,
          url: item.url,
          name: item.name,
          size: item.size,
          type: item.type,
        })
      )
      message.success(res.msg || res.message || '平面图上传成功')
      return uploadedImages
    }
    return []
  } catch (error) {
    console.error('平面图上传失败:', error)
    message.error('平面图上传失败')
    throw error
  }
}

// --- API：处理效果图删除列表 ---
const handleEffectDeletes = async () => {
  if (pendingEffectOperations.value.delete.length === 0) return
  const sortedDeletes = [...pendingEffectOperations.value.delete].sort(
    (a, b) => b.index - a.index
  )
  const successfullyDeleted = []
  for (const deleteOp of sortedDeletes) {
    try {
      const success = await deleteEffectImage(deleteOp)
      if (success) {
        successfullyDeleted.push(deleteOp.index)
      }
    } catch (error) {
      console.error(`删除效果图失败:`, error)
    }
  }
  successfullyDeleted
    .sort((a, b) => b - a)
    .forEach((index) => {
      if (index >= 0 && index < formData.value.effects.length) {
        formData.value.effects.splice(index, 1)
      }
    })
}

// --- API：处理平面图删除列表 ---
const handlePlanDeletes = async () => {
  if (pendingPlanOperations.value.delete.length === 0) return
  const sortedDeletes = [...pendingPlanOperations.value.delete].sort(
    (a, b) => b.index - a.index
  )
  const successfullyDeleted = []
  for (const deleteOp of sortedDeletes) {
    try {
      const success = await deletePlanImage(deleteOp)
      if (success) {
        successfullyDeleted.push(deleteOp.index)
      }
    } catch (error) {
      console.error('删除平面图失败:', error)
    }
  }
  successfullyDeleted
    .sort((a, b) => b - a)
    .forEach((index) => {
      if (index >= 0 && index < formData.value.plans.length) {
        formData.value.plans.splice(index, 1)
      }
    })
}

// --- 新增：API：上传封面图 (单图) ---
const uploadCoverImage = async (productId) => {
  if (!pendingCoverOperations.value.upload.length || !productId) {
    return
  }
  try {
    const formDataToSend = new FormData()
    const fileToUpload = pendingCoverOperations.value.upload[0] // ImgUpload 传的是 File
    formDataToSend.append('coverImageFile', fileToUpload) // 后端要的 key

    await API.uploadCover(productId, formDataToSend)
    message.success('封面图上传成功')
  } catch (error) {
    console.error('封面图上传失败:', error)
    message.error('封面图上传失败')
    throw error
  }
}

// --- 新增：API：处理封面图删除 ---
const handleCoverDeletes = async (productId) => {
  if (pendingCoverOperations.value.delete.length === 0) return

  try {
    // 封面只有一个，所以只看第一个
    const deleteOp = pendingCoverOperations.value.delete[0]
    const image = deleteOp.image

    // 只有当删除的是一个 "finished" (已保存) 的图片时，才调用API
    if (image && image.status === 'finished') {
      await API.deleteCover(productId)
      message.success('封面图删除成功')
    }
    // 无论如何都从 formData 清空
    formData.value.coverImage = []
  } catch (error) {
    console.error(`删除封面图失败:`, error)
    message.error('删除封面图失败')
    throw error
  }
}

// --- 主要保存逻辑 ---
const handleSave = async () => {
  // 字段验证
  if (!formData.value.houseName || !formData.value.houseName.trim()) {
    message.error('请输入产品名称')
    return
  }
  const baseAreaNum = Number(formData.value.foundationArea)
  if (!Number.isFinite(baseAreaNum) || baseAreaNum <= 0) {
    message.error('请输入有效的占地面积')
    return
  }
  const buildAreaNum = Number(formData.value.constructionArea)
  if (!Number.isFinite(buildAreaNum) || buildAreaNum <= 0) {
    message.error('请输入有效的建筑面积')
    return
  }
  const floorsNum = Number(formData.value.floors)
  if (!Number.isInteger(floorsNum) || floorsNum <= 0) {
    message.error('请选择有效的层数')
    return
  }
  const layout = formData.value.interiorLayout.map((n) => Number(n))
  if (
    layout.length !== 3 ||
    layout.some((n) => !Number.isInteger(n) || n < 0)
  ) {
    message.error('请正确填写室/厅/卫布局')
    return
  }
  const priceNum = Number(formData.value.price)
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    message.error('请输入有效的价格')
    return
  }
  if (!formData.value.style) {
    message.error('请选择建筑风格')
    return
  }
  if (!formData.value.constructionMethod) {
    message.error('请选择施工方式')
    return
  }

  saving.value = true

  try {
    let productId = props.itemId
    let isNewProduct = !productId

    // 准备基本数据
    const basicData = {
      name: formData.value.houseName.trim(),
      baseArea: baseAreaNum,
      buildArea: buildAreaNum,
      floors: floorsNum,
      roomLayout: layout,
      price: priceNum,
      style: formData.value.style,
      constructionMethod: formData.value.constructionMethod,
      model3d: formData.value.three || '',
    }

    // 1. 创建或更新产品
    if (isNewProduct) {
      const createRes = await API.addHouseData(basicData)
      if (!createRes || createRes.code !== 200 || createRes.data == null) {
        message.error(createRes?.msg || createRes?.message || '创建产品失败')
        saving.value = false
        return
      }
      productId = createRes.data
      formData.value.id = productId
    } else {
      basicData.id = productId
      await API.updateHouseData(basicData, productId)
    }

    // 2. 将所有的图片上传/删除任务组成数组，进行并行处理 (串行改并行)
    const imageTasks = []

    // 封面图任务
    const hasCoverUpload = pendingCoverOperations.value.upload.length > 0
    const hasCoverDelete = pendingCoverOperations.value.delete.length > 0
    if (hasCoverUpload) {
      imageTasks.push(uploadCoverImage(productId))
    } else if (hasCoverDelete) {
      imageTasks.push(handleCoverDeletes(productId))
    }

    // 效果图任务
    const hasEffectUpload = pendingEffectOperations.value.upload.length > 0
    const hasEffectDelete = pendingEffectOperations.value.delete.length > 0
    if (hasEffectUpload) {
      imageTasks.push(uploadEffectImages(productId))
    }
    if (hasEffectDelete) {
      imageTasks.push(handleEffectDeletes())
    }

    // 平面图任务
    const hasPlanUpload = pendingPlanOperations.value.upload.length > 0
    const hasPlanDelete = pendingPlanOperations.value.delete.length > 0
    if (hasPlanUpload) {
      imageTasks.push(uploadPlanImages(productId))
    }
    if (hasPlanDelete) {
      imageTasks.push(handlePlanDeletes())
    }

    // 并行发送网络请求，大大减少堵塞时间
    if (imageTasks.length > 0) {
      await Promise.all(imageTasks)
    }

    // 3. 清空所有待处理状态
    pendingCoverOperations.value = { delete: [], upload: [] }
    pendingEffectOperations.value = { delete: [], upload: [] }
    pendingPlanOperations.value = { delete: [], upload: [] }

    // 4. (已优化) 移除了 await refreshHouseDetails(productId)
    // 因为此处保存完毕后会立刻 emit('saved') 触发列表刷新并关闭 modal。
    // 此处如果在弹窗关闭前再发一次查询详情的网络请求，纯属浪费时间引起卡顿。

    message.success(isNewProduct ? '产品创建成功' : '产品更新成功')
    emit('saved')
    showModal.value = false
  } catch (error) {
    console.error('保存失败:', error)
    message.error(
      '保存失败: ' +
        (error.response?.data?.msg ||
          error.response?.data?.message ||
          (typeof error.response?.data === 'string' ? error.response.data : '') ||
          error.message)
    )
  } finally {
    saving.value = false
  }
}

</script>

<style lang="scss" scoped>
/* 您的样式保持不变 */
.preview-container {
  margin-top: 10px;
  border: 1px solid #eaeaea;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.upload-3d-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-house-row {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.edit-house-row__item {
  flex: 1;
}

.edit-house-layout {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-house-layout__select {
  width: 80px;
}

.edit-house-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.file-info {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
}

@media (max-width: 768px) {
  .edit-house-row {
    flex-direction: column;
  }

  .edit-house-layout {
    flex-wrap: wrap;
  }

  .edit-house-layout__select {
    flex: 1 1 88px;
    width: auto;
    min-width: 88px;
  }
}
</style>
