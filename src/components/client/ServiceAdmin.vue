<template>
  <n-layout :has-sider="!isCompactViewport" class="client-center-layout h-full">
    <n-layout-sider
      v-if="!isCompactViewport"
      bordered
      :width="240"
      :native-scrollbar="false"
      class="client-center-sider h-full"
    >
      <n-card title="服务商中心" class="client-center-fill-card">
        <n-menu :options="menuOptions" v-model:value="activeMenu" />
      </n-card>
    </n-layout-sider>

    <n-layout-content class="client-center-content">
      <div class="p-6">
        <n-card
          v-if="isCompactViewport"
          title="服务商中心"
          class="client-center-mobile-menu"
        >
          <div class="client-center-mobile-nav">
            <button
              v-for="item in mobileMenuItems"
              :key="item.key"
              type="button"
              class="client-center-mobile-nav__item"
              :class="{ 'is-active': activeMenu === item.key }"
              @click="activeMenu = item.key"
            >
              <span class="client-center-mobile-nav__icon">
                <n-icon size="24">
                  <component :is="item.icon" />
                </n-icon>
              </span>
              <span class="client-center-mobile-nav__label">{{ item.label }}</span>
              <span class="client-center-mobile-nav__desc">
                {{ item.description }}
              </span>
            </button>
          </div>
        </n-card>
        <n-card title="服务商管理">
          <div v-if="activeMenu === 'company'">
            <n-space vertical>
              <div class="client-center-header">
                <n-h2>企业工作台</n-h2>
                <div v-if="vendorInfo.id">
                  <n-tag
                    v-if="vendorInfo.status === 1"
                    type="success"
                    size="large"
                  >
                    <template #icon
                      ><n-icon :component="CheckmarkCircle"
                    /></template>
                    审核通过
                  </n-tag>
                  <n-tag
                    v-else-if="vendorInfo.status === 2"
                    type="info"
                    size="large"
                  >
                    <template #icon><n-icon :component="Time" /></template>
                    审核中
                  </n-tag>
                  <n-tag
                    v-else-if="vendorInfo.status === 0"
                    type="error"
                    size="large"
                  >
                    <template #icon
                      ><n-icon :component="CloseCircle"
                    /></template>
                    审核驳回
                  </n-tag>
                </div>
              </div>

              <n-alert
                v-if="vendorInfo.status === 2"
                type="info"
                title="审核进度"
              >
                您的入驻申请正在审核中，请耐心等待。
              </n-alert>
              <n-alert
                v-if="vendorInfo.status === 0"
                type="error"
                title="申请被驳回"
              >
                驳回原因：{{ vendorInfo.message || '未提供具体原因' }}
              </n-alert>

              <n-spin :show="loading">
                <n-card title="企业基本信息" v-if="vendorInfo.id">
                  <template #header-extra>
                    <n-button
                      v-if="canEditVendorInfo"
                      type="primary"
                      tertiary
                      @click="handleEdit"
                    >
                      修改信息
                    </n-button>
                  </template>
                  <n-descriptions
                    :label-placement="descriptionsLabelPlacement"
                    bordered
                    :column="1"
                    :label-style="
                      isCompactViewport ? undefined : 'width: 120px; font-weight: bold;'
                    "
                  >
                    <n-descriptions-item label="公司名称">
                      <span class="vendor-company-name">{{
                        vendorInfo.companyName
                      }}</span>
                    </n-descriptions-item>
                    <n-descriptions-item label="账号">{{
                      vendorInfo.username || '--'
                    }}</n-descriptions-item>
                    <n-descriptions-item label="服务类型">
                      <n-tag :type="getServiceTypeTag(vendorInfo.serviceType)">
                        {{ getServiceTypeText(vendorInfo.serviceType) }}
                      </n-tag>
                    </n-descriptions-item>
                    <n-descriptions-item
                      label="主营材料"
                      v-if="vendorInfo.materialCategory?.length"
                    >
                      <n-space class="vendor-material-tags" wrap>
                        <n-tag
                          v-for="(mat, index) in vendorInfo.materialCategory"
                          :key="mat.id"
                          size="small"
                          :bordered="false"
                          class="vendor-material-tag"
                          :style="getMaterialTagStyle(index)"
                        >
                          {{ mat.name }}
                        </n-tag>
                      </n-space>
                    </n-descriptions-item>
                    <n-descriptions-item label="负责人">{{
                      vendorInfo.companyChargerName
                    }}</n-descriptions-item>
                    <n-descriptions-item label="联系电话">{{
                      vendorInfo.phone
                    }}</n-descriptions-item>
                    <n-descriptions-item label="公司地址">{{
                      vendorInfo.companyAddress
                    }}</n-descriptions-item>
                    <n-descriptions-item label="公司介绍">{{
                      vendorInfo.companyIntroduction || '暂无介绍'
                    }}</n-descriptions-item>
                  </n-descriptions>

                  <n-divider title-placement="left">资质证书</n-divider>
                  <div
                    v-if="vendorInfo.certificate?.length > 0"
                    class="cert-grid"
                  >
                    <div
                      v-for="(cert, index) in vendorInfo.certificate"
                      :key="index"
                      class="cert-item"
                    >
                      <div class="cert-card">
                        <n-icon size="40" color="var(--color-brand-700)"
                          ><DocumentTextOutline
                        /></n-icon>
                        <div class="cert-name">资质文件 {{ index + 1 }}</div>
                        <a
                          :href="cert.fileUrl"
                          target="_blank"
                          class="cert-link"
                          >查看/下载</a
                        >
                      </div>
                    </div>
                  </div>
                  <n-empty v-else description="暂无资质文件" />
                </n-card>
                <n-empty v-else description="无法加载企业信息" />
              </n-spin>
            </n-space>
          </div>

          <div v-if="activeMenu === 'orders'">
            <n-space vertical>
              <div class="client-center-header">
                <n-h2>我的订单</n-h2>
              </div>
              <n-tabs
                v-model:value="orderStatusTab"
                type="segment"
                animated
                class="vendor-order-tabs"
                @update:value="handleOrderTabChange"
              >
                <n-tab-pane name="1">
                  <template #tab>
                    <span class="vendor-order-tab-label">
                      <span>已接受</span>
                      <n-badge
                        v-if="acceptedNeedHandleCount > 0"
                        :value="acceptedNeedHandleCount"
                        :max="999"
                        color="#d03050"
                        class="vendor-order-tab-badge"
                      />
                    </span>
                  </template>
                </n-tab-pane>
                <n-tab-pane name="3">
                  <template #tab>
                    <span class="vendor-order-tab-label">
                      <span>未回复</span>
                      <n-badge
                        v-if="unrepliedOrderCount > 0"
                        :value="unrepliedOrderCount"
                        :max="999"
                        color="#d03050"
                        class="vendor-order-tab-badge"
                      />
                    </span>
                  </template>
                </n-tab-pane>
                <n-tab-pane name="2" tab="已完成" />
              </n-tabs>
              <div
                v-if="!ordersLoading && !orderList.length"
                class="vendor-order-empty client-center-empty-card"
              >
                <n-empty description="当前暂无订单数据" size="large" />
              </div>
              <div v-else class="vendor-order-table">
                <n-spin :show="ordersLoading">
                  <div
                    v-if="sortedOrderList.length > 0"
                    class="vendor-order-table__inner client-center-paper"
                  >
                    <div class="vendor-order-table__head">
                      <div>处理状态</div>
                      <div>类型</div>
                      <div>内容/材料</div>
                      <div>价格</div>
                      <div>操作</div>
                    </div>
                    <div
                      v-for="row in sortedOrderList"
                      :key="row.id"
                      class="vendor-order-table__row"
                    >
                      <div class="vendor-order-table__cell">
                        <span class="vendor-order-table__label">处理状态</span>
                        <n-tag
                          :type="
                            isNeedHandleConstructionStatus(row.constructionStatusText)
                              ? 'success'
                              : 'info'
                          "
                        >
                          {{
                            isNeedHandleConstructionStatus(row.constructionStatusText)
                              ? '需要处理'
                              : '等待处理'
                          }}
                        </n-tag>
                      </div>
                      <div class="vendor-order-table__cell">
                        <span class="vendor-order-table__label">类型</span>
                        <span>{{ row.type === 1 ? '施工单' : '材料单' }}</span>
                      </div>
                      <div class="vendor-order-table__cell">
                        <span class="vendor-order-table__label">内容/材料</span>
                        <span>
                          {{
                            row.type === 1
                              ? '建筑施工'
                              : `${row.materialName} (${row.materialCategory})`
                          }}
                        </span>
                      </div>
                      <div class="vendor-order-table__cell vendor-order-table__cell--price">
                        <span class="vendor-order-table__label">价格</span>
                        <span>¥{{ row.price }}</span>
                      </div>
                      <div class="vendor-order-table__cell vendor-order-table__cell--actions">
                        <span class="vendor-order-table__label">操作</span>
                        <div class="vendor-order-table__actions">
                          <n-button
                            v-if="Number(row.orderStatus) === 3"
                            size="small"
                            type="success"
                            @click="handleAcceptConfirm(row)"
                          >
                            接单
                          </n-button>
                          <n-button
                            v-if="Number(row.orderStatus) === 3"
                            size="small"
                            type="error"
                            @click="handleRejectConfirm(row)"
                          >
                            拒单
                          </n-button>
                          <n-button
                            v-if="canCancelVendorOrder(row)"
                            size="small"
                            type="warning"
                            @click="handleCancelOrder(row)"
                          >
                            取消
                          </n-button>
                          <n-button
                            size="small"
                            type="primary"
                            @click="openOrderDetail(row)"
                          >
                            详情/进度
                          </n-button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="vendor-order-empty client-center-empty-card">
                    <n-empty description="当前暂无订单数据" size="large" />
                  </div>
                </n-spin>
              </div>
              <div
                v-if="pagination.itemCount > 0"
                class="vendor-order-pagination client-center-pagination"
              >
                <n-pagination
                  v-model:page="pagination.page"
                  :page-size="pagination.pageSize"
                  :item-count="pagination.itemCount"
                  :page-slot="3"
                  show-quick-jumper
                  @update:page="handlePageChange"
                />
              </div>
            </n-space>
          </div>

          <div v-if="activeMenu === 'logout'">
            <n-card title="退出登录">
              <n-space vertical align="center">
                <n-h3>确定要退出系统吗？</n-h3>
                <n-space>
                  <n-button @click="activeMenu = 'company'">取消</n-button>
                  <n-button type="error" @click="logout">确认退出</n-button>
                </n-space>
              </n-space>
            </n-card>
          </div>
        </n-card>
      </div>
    </n-layout-content>

    <n-modal
      v-model:show="showEditModal"
      preset="card"
      title="修改入驻信息"
      :style="editModalStyle"
      size="huge"
    >
      <n-form
        ref="editFormRef"
        :model="editForm"
        :rules="formRules"
        :label-placement="formLabelPlacement"
        :label-width="isCompactViewport ? undefined : 120"
      >
        <n-alert type="warning" class="client-center-alert">
          {{ editTipText }}
        </n-alert>
        <div class="service-type-card client-center-accent-card">
          <div class="service-type-card__label">服务类型</div>
          <div class="service-type-card__content service-type-card__content--form">
            <n-select
              v-model:value="editForm.serviceType"
              :options="serviceTypeOptions"
              placeholder="请选择服务类型"
              :disabled="!canChangeServiceType"
            />
            <div class="service-type-card__helper">
              <n-tag :type="getServiceTypeTag(editForm.serviceType)" size="small">
                当前选择：{{ getServiceTypeText(editForm.serviceType) }}
              </n-tag>
              <span>
                {{
                  canChangeServiceType
                    ? '审核通过后修改服务类型会重新进入平台审核，期间其他服务暂不可用。'
                    : serviceTypeLockReason
                }}
              </span>
            </div>
          </div>
        </div>
        <n-form-item label="账号" path="username"
          ><n-input v-model:value="editForm.username" disabled
        /></n-form-item>
        <n-form-item v-if="requiresPasswordOnEdit" label="密码" path="password"
          ><n-input
            type="password"
            v-model:value="editForm.password"
            show-password-on="click"
            placeholder="请输入登录密码"
        /></n-form-item>
        <n-grid :cols="editGridCols" :x-gap="24" :y-gap="12">
          <n-grid-item
            ><n-form-item label="公司名称" path="companyName"
              ><n-input v-model:value="editForm.companyName" /></n-form-item
          ></n-grid-item>
          <n-grid-item
            ><n-form-item label="负责人" path="companyChargerName"
              ><n-input
                v-model:value="editForm.companyChargerName" /></n-form-item
          ></n-grid-item>
          <n-grid-item
            ><n-form-item label="联系电话" path="phone"
              ><n-input v-model:value="editForm.phone" /></n-form-item
          ></n-grid-item>
        </n-grid>
        <n-form-item label="公司地址" path="companyAddress">
          <n-space vertical class="client-center-full-width">
            <n-cascader
              v-model:value="selectedCompanyRegionCode"
              :options="companyRegionCascaderOptions"
              check-strategy="child"
              filterable
              clearable
              placeholder="请选择省 / 市 / 区"
              @update:value="handleCompanyRegionUpdate"
            />
            <n-input
              v-model:value="companyAddressForm.detail"
              type="textarea"
              placeholder="请输入街道门牌，例如：科华北路88号A栋1201"
              :rows="2"
              maxlength="120"
              show-count
            />
            <div class="address-preview client-center-preview">
              {{ companyAddressPreview || '请先选择公司行政区并填写详细门牌地址' }}
            </div>
          </n-space>
        </n-form-item>
        <n-form-item
          label="主营材料"
          path="materialCategoryIds"
          v-if="[2, 3].includes(editForm.serviceType)"
        >
          <n-select
            v-model:value="editForm.materialCategoryIds"
            :options="categoryOptions"
            multiple
          />
        </n-form-item>
        <n-form-item label="公司介绍" path="companyIntroduction"
          ><n-input
            type="textarea"
            v-model:value="editForm.companyIntroduction"
        /></n-form-item>
        <n-form-item label="资质证书">
          <div class="edit-certificate-panel">
            <n-upload
              :custom-request="handleUploadRequest"
              :show-file-list="false"
              accept=".jpg,.png,.pdf,.doc,.docx"
            >
              <n-button type="primary" tertiary>上传新证书</n-button>
            </n-upload>
            <div class="edit-certificate-tip">
              支持 JPG、PNG、PDF、DOC、DOCX，上传后会作为资质材料一并提交。
            </div>
            <div
              v-if="uploadedFiles.length > 0"
              class="edit-certificate-grid"
            >
              <div
                v-for="(file, index) in uploadedFiles"
                :key="file.id || file.url || index"
                class="edit-certificate-card client-center-elevated-card"
              >
                <div class="edit-certificate-card__icon">
                  <n-icon size="26">
                    <DocumentTextOutline />
                  </n-icon>
                </div>
                <div class="edit-certificate-card__meta">
                  <div class="edit-certificate-card__type">
                    {{ getFileExt(file.url) }}
                  </div>
                  <a
                    :href="file.url"
                    target="_blank"
                    class="edit-certificate-card__name"
                    :title="getFileName(file.url)"
                  >
                    {{ getFileName(file.url) }}
                  </a>
                </div>
                <div class="edit-certificate-card__actions">
                  <a
                    :href="file.url"
                    target="_blank"
                    class="edit-certificate-card__action"
                  >
                    查看
                  </a>
                  <button
                    type="button"
                    class="edit-certificate-card__action edit-certificate-card__action--danger"
                    @click="removeFile(file, index)"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
            <n-empty v-else description="暂无资质证书" size="small" />
          </div>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space class="service-modal-footer" justify="end">
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitEdit"
            >提交修改</n-button
          >
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showNoteModal"
      preset="dialog"
      :title="noteModalTitle"
      :positive-text="noteModalActionText"
      negative-text="取消"
      @positive-click="submitOrderAction"
      @negative-click="showNoteModal = false"
    >
      <n-input
        v-model:value="actionNote"
        type="textarea"
        :placeholder="noteModalPlaceholder"
        :rows="3"
      />
    </n-modal>

    <n-modal
      v-model:show="showOrderModal"
      preset="card"
      title="订单详情与施工进度"
      :style="orderModalStyle"
      :bordered="false"
    >
      <n-spin :show="orderDetailLoading">
        <div v-if="currentOrderDetail">
          <n-descriptions
            bordered
            title="基础信息"
            :column="detailDescriptionsColumns"
            :label-placement="descriptionsLabelPlacement"
            size="small"
          >
            <n-descriptions-item label="订单类型">
              <n-tag :type="currentOrderDetail.type === 1 ? 'info' : 'warning'">
                {{ currentOrderDetail.type === 1 ? '施工单' : '材料单' }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="订单金额">
              ¥{{ currentOrderDetail.price }}
            </n-descriptions-item>
            <n-descriptions-item label="创建时间">
              {{ formatChineseDate(currentOrderDetail.createTime) }}
            </n-descriptions-item>
            <n-descriptions-item
              v-if="currentOrderDetail.type === 1"
              label="施工方式"
            >
              {{
                constructionStatus?.processName ||
                getProcessText(
                  constructionStatus?.processType,
                  constructionStatus?.processName,
                ) ||
                '暂无'
              }}
            </n-descriptions-item>
            <n-descriptions-item
              v-else-if="currentOrderDetail.type === 2"
              label="施工材料"
            >
              {{
                currentOrderDetail.materialCategory && currentOrderDetail.materialName
                  ? `${currentOrderDetail.materialName}（${currentOrderDetail.materialCategory}）`
                  : currentOrderDetail.materialName ||
                    currentOrderDetail.materialCategory ||
                    '暂无'
              }}
            </n-descriptions-item>
            <n-descriptions-item label="状态">
              {{ getOrderStatusText(currentOrderDetail.orderStatus) }}
            </n-descriptions-item>
            <n-descriptions-item label="备注">
              {{ currentOrderDetail.adminNotes || '无' }}
            </n-descriptions-item>
          </n-descriptions>

          <div
            v-if="currentOrderDetail.type === 1 && !constructionStatus"
            class="construction-waiting-state"
          >
            <n-card
              size="small"
              class="construction-waiting-card client-center-info-card"
            >
              <n-space vertical size="small" align="center">
                <n-tag type="info" size="large">等待平台处理</n-tag>
                <div class="construction-waiting-title">
                  当前订单已接单，平台暂未开启施工流程
                </div>
                <div class="construction-waiting-desc">
                  请等待平台完成派单确认、节点金额配置并开启施工后，再在此查看和上传施工照片。
                </div>
              </n-space>
            </n-card>
          </div>

          <div v-if="currentOrderDetail.type === 1" class="construction-flow-section">
            <n-divider title-placement="left">施工全流程进度</n-divider>

            <div v-if="constructionStatus">
              <div class="service-flow-header">
                当前阶段：<span class="service-flow-header__node">{{
                  constructionStatus.currentNodeName
                }}</span>
                <n-tag size="small" class="service-flow-header__tag">{{
                  getFlowCurrentNodeStatusText(constructionStatus)
                }}</n-tag>
                <span class="service-flow-header__meta">
                  施工方式：{{
                    getProcessText(
                      constructionStatus.processType,
                      constructionStatus.processName,
                    )
                  }}
                </span>
              </div>

              <n-grid :cols="constructionGridCols" :x-gap="16" :y-gap="16">
                <n-grid-item :span="1" class="service-flow-nav">
                  <n-steps
                    vertical
                    :current="getConstructionStepsCurrent(constructionStatus)"
                    size="small"
                  >
                    <n-step
                      v-for="(node, index) in constructionStatus.nodeDetails"
                      :key="node.nodeId"
                      :title="node.name"
                      :description="
                        getNodeStatusDesc(
                          index,
                          constructionStatus.currentNodeIndex,
                          constructionStatus,
                        )
                      "
                      :status="
                        getNodeStatus(
                          index,
                          constructionStatus.currentNodeIndex,
                          constructionStatus,
                        )
                      "
                      class="service-flow-step"
                      @click="handleNodeClick(node)"
                    />
                  </n-steps>
                </n-grid-item>

                <n-grid-item :span="isCompactViewport ? 1 : 2">
                  <div v-if="currentNodeDetail">
                    <n-card
                      :title="`节点详情：${currentNodeDetail.nodeName}`"
                      size="small"
                    >
                      <template #header-extra>
                        <n-tag type="info" size="small">{{
                          currentNodeStatusText
                        }}</n-tag>
                      </template>

                      <div
                        class="service-upload-panel"
                      >
                        <n-upload
                          action="#"
                          :custom-request="handleUploadNodePhoto"
                          :show-file-list="false"
                          accept=".jpg,.jpeg,.png"
                          :disabled="!canUploadCurrentNode"
                        >
                          <n-button
                            type="primary"
                            size="small"
                            :disabled="!canUploadCurrentNode"
                          >
                            <template #icon
                              ><n-icon><CloudUploadOutline /></n-icon
                            ></template>
                            上传节点照片
                          </n-button>
                        </n-upload>
                        <div class="service-upload-panel__tip">
                          {{ uploadNodeTipText }}
                        </div>
                      </div>

                      <n-scrollbar class="service-flow-timeline">
                        <n-timeline>
                          <n-timeline-item
                            v-for="record in currentNodeDetail.progressRecords"
                            :key="record.progressId"
                            type="success"
                            :title="record.operateTime?.replace('T', ' ')"
                            :content="record.description || '施工进度更新'"
                          >
                            <div class="service-flow-image-group">
                              <n-image-group>
                                <n-space>
                                  <div
                                    v-for="img in record.imageList"
                                    :key="img.imageId"
                                    class="service-flow-image-wrap"
                                  >
                                    <n-image
                                      width="100"
                                      :src="resolveAssetUrl(img.imageUrl)"
                                      class="service-flow-image"
                                    />
                                    <n-button
                                      circle
                                      type="error"
                                      size="tiny"
                                      :disabled="!canDeleteCurrentNodePhoto"
                                      class="service-flow-image-delete"
                                      @click="handleDeletePhoto(img.imageId)"
                                    >
                                      <template #icon
                                        ><n-icon><CloseCircle /></n-icon
                                      ></template>
                                    </n-button>
                                  </div>
                                </n-space>
                              </n-image-group>
                            </div>
                          </n-timeline-item>
                        </n-timeline>
                        <n-empty
                          v-if="!currentNodeDetail.progressRecords?.length"
                          description="暂无上传记录"
                          class="service-flow-empty"
                        />
                      </n-scrollbar>
                    </n-card>
                  </div>
                  <div
                    v-else
                    class="service-flow-empty-state"
                  >
                    <n-empty description="请点击左侧节点查看详情与上传照片" />
                  </div>
                </n-grid-item>
              </n-grid>
            </div>
            <div v-else class="construction-progress-placeholder" />
          </div>
        </div>
      </n-spin>
    </n-modal>
  </n-layout>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, h, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import {
  useMessage,
  useDialog,
  useNotification,
  NAvatar,
  NButton,
  NTag,
  NIcon,
} from 'naive-ui'
import VendorOrderAPI from '@/api/service/vendorOrder'
import ConstructionAPI from '@/api/house/construction'
import {
  AUTH_SCOPE_PROVIDER,
  getAuthStorage,
} from '@/utils/auth'
import { useAuthStore } from '@/stores/auth/useAuthStore'
import { useVendorOrderStore } from '@/stores/order/useVendorOrderStore'
import { useVendorProfileStore } from '@/stores/vendor/useVendorProfileStore'
import {
  HomeOutline,
  DocumentTextOutline,
  CheckmarkCircle,
  CloseCircle,
  Time,
  CloudUploadOutline,
  ArrowUndoCircleOutline,
} from '@/icons/ionicons'
import {
  CONSTRUCTION_NODE_STATUS,
  getProcessText,
} from '@/utils/construction'
import { resolveAssetUrl } from '@/utils/asset'
import { useMaxWidth } from '@/composables/useMaxWidth'

const router = useRouter()
const message = useMessage()
const notification = useNotification()
const authStore = useAuthStore()
const vendorOrderStore = useVendorOrderStore()
const vendorProfileStore = useVendorProfileStore()
const dialog = useDialog()
const emit = defineEmits(['updateName'])
const {
  orderList,
  ordersLoading,
  orderStatusTab,
  unrepliedOrderCount,
  acceptedNeedHandleCount,
  acceptedActiveOrderCount,
  sortedOrderList,
  orderDetailLoading,
  currentOrderDetail,
  constructionStatus,
  currentNodeDetail,
} = storeToRefs(vendorOrderStore)
const {
  loading,
  vendorInfo,
  categoryOptions,
  uploadedFiles,
  certificateChanged,
  submitting,
  selectedCompanyRegionCode,
  companyAddressPreview,
  canEditVendorInfo,
  editTipText,
} = storeToRefs(vendorProfileStore)
const pagination = vendorOrderStore.pagination
const editForm = vendorProfileStore.editForm
const serviceTypeOptions = vendorProfileStore.serviceTypeOptions
const companyAddressForm = vendorProfileStore.companyAddressForm
const companyRegionCascaderOptions =
  vendorProfileStore.companyRegionCascaderOptions

const getErrorMessage = (error, fallback) => {
  return (
    error?.msg ||
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === 'string' ? error.response.data : '') ||
    error?.message ||
    fallback
  )
}

const isDispatchStageLockedForVendor = (row) =>
  Number(row?.type) === 1 &&
  Boolean(String(row?.constructionStatusText || '').trim())

const canCancelVendorOrder = (row) =>
  Number(row?.orderStatus) === 1 && !isDispatchStageLockedForVendor(row)

const activeMenu = ref('company') // company | orders | logout
const isCompactViewport = useMaxWidth(768)
const formLabelPlacement = computed(() =>
  isCompactViewport.value ? 'top' : 'left',
)
const descriptionsLabelPlacement = computed(() =>
  isCompactViewport.value ? 'top' : 'left',
)
const detailDescriptionsColumns = computed(() =>
  isCompactViewport.value ? 1 : 2,
)
const editGridCols = computed(() => (isCompactViewport.value ? 1 : 2))
const constructionGridCols = computed(() => (isCompactViewport.value ? 1 : 3))
const requiresPasswordOnEdit = computed(
  () => Number(vendorInfo.value?.status) !== 1,
)
const canChangeServiceType = computed(
  () => Number(acceptedActiveOrderCount.value || 0) === 0,
)
const serviceTypeLockReason = computed(
  () => '当前存在已接单且正在处理的订单，暂不能修改服务类型。',
)
const editModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 800px)',
}))
const orderModalStyle = computed(() => ({
  width: isCompactViewport.value ? 'calc(100vw - 20px)' : 'min(92vw, 1000px)',
  minHeight: isCompactViewport.value ? 'auto' : '600px',
}))
const getProviderId = () => getAuthStorage(AUTH_SCOPE_PROVIDER, 'id')
const pendingOrderNotificationRef = ref(null)
const pendingOrderNotificationSignature = ref('')

const getPendingOrderNotificationSessionKey = (vendorId) =>
  `provider-pending-order-notification-read:${vendorId}`

const getPendingOrderNotificationSignature = () => {
  const accepted = Number(acceptedNeedHandleCount.value || 0)
  const unreplied = Number(unrepliedOrderCount.value || 0)
  return `${accepted}:${unreplied}`
}

const readPendingOrderNotification = (vendorId) => {
  if (typeof window === 'undefined' || !vendorId) return ''
  return window.sessionStorage.getItem(
    getPendingOrderNotificationSessionKey(vendorId),
  ) || ''
}

const markPendingOrderNotificationRead = (vendorId, signature) => {
  if (typeof window === 'undefined' || !vendorId) return
  window.sessionStorage.setItem(
    getPendingOrderNotificationSessionKey(vendorId),
    signature,
  )
}

const clearPendingOrderNotificationRead = (vendorId) => {
  if (typeof window === 'undefined' || !vendorId) return
  window.sessionStorage.removeItem(
    getPendingOrderNotificationSessionKey(vendorId),
  )
}

const closePendingOrderNotification = () => {
  pendingOrderNotificationRef.value?.destroy()
  pendingOrderNotificationRef.value = null
  pendingOrderNotificationSignature.value = ''
}

const maybeShowPendingOrderNotification = () => {
  const vendorId = vendorInfo.value?.id || getProviderId()
  if (!vendorId) return

  const accepted = Number(acceptedNeedHandleCount.value || 0)
  const unreplied = Number(unrepliedOrderCount.value || 0)
  const total = accepted + unreplied

  if (total <= 0) {
    clearPendingOrderNotificationRead(vendorId)
    closePendingOrderNotification()
    return
  }

  const signature = getPendingOrderNotificationSignature()
  if (
    pendingOrderNotificationRef.value &&
    pendingOrderNotificationSignature.value === signature
  ) {
    return
  }

  if (readPendingOrderNotification(vendorId) === signature) {
    return
  }

  closePendingOrderNotification()

  let markAsRead = false
  const metaText = [
    accepted > 0 ? `已接受待处理 ${accepted}` : '',
    unreplied > 0 ? `未回复 ${unreplied}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const notificationReactive = notification.create({
    title: '订单待处理提醒',
    description: '订单管理中存在需要尽快处理的内容',
    content: `当前共有 ${total} 条待处理提醒，请及时进入订单管理查看并处理。`,
    meta: metaText || '请及时处理',
    duration: 0,
    avatar: () =>
      h(
        NAvatar,
        {
          size: 'small',
          round: true,
          style: {
            backgroundColor: '#d03050',
            color: '#fff',
          },
        },
        {
          default: () =>
            h(NIcon, { size: 16 }, { default: () => h(DocumentTextOutline) }),
        },
      ),
    action: () =>
      h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => {
            markAsRead = true
            markPendingOrderNotificationRead(vendorId, signature)
            notificationReactive.destroy()
          },
        },
        {
          default: () => '已读',
        },
      ),
    onClose: () => {
      if (!markAsRead) {
        message.warning('点击“已读”可暂时关闭该提醒')
        return false
      }
      return true
    },
    onAfterLeave: () => {
      if (pendingOrderNotificationRef.value === notificationReactive) {
        pendingOrderNotificationRef.value = null
        pendingOrderNotificationSignature.value = ''
      }
    },
  })

  pendingOrderNotificationRef.value = notificationReactive
  pendingOrderNotificationSignature.value = signature
}

const renderMenuIcon = (icon) => () =>
  h(NIcon, null, {
    default: () => h(icon),
  })

const mobileMenuItems = [
  {
    label: '企业信息',
    description: '资料与资质',
    key: 'company',
    icon: HomeOutline,
  },
  {
    label: '订单管理',
    description: '订单与进度',
    key: 'orders',
    icon: DocumentTextOutline,
  },
  {
    label: '退出登录',
    description: '安全退出',
    key: 'logout',
    icon: ArrowUndoCircleOutline,
  },
]

const menuOptions = mobileMenuItems.map((item) => ({
  label: item.label,
  key: item.key,
  icon: renderMenuIcon(item.icon),
}))

// ================= 企业信息逻辑 =================
const showEditModal = ref(false)
const editFormRef = ref(null)
const syncVendorDisplayName = (info) => {
  const companyName = info?.companyName || info?.username || ''
  if (!companyName) return
  authStore.patchScopeProfile(AUTH_SCOPE_PROVIDER, {
    name: companyName,
    vendorInfo: {
      ...(authStore.currentClientState?.info || {}),
      ...info,
      vendorId: info?.vendorId ?? info?.id ?? getProviderId(),
    },
  })
  emit('updateName', companyName)
}

const handleCompanyRegionUpdate = (value, option, path) =>
  vendorProfileStore.handleCompanyRegionUpdate(value, option, path)

const passwordRules = [
  { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
  {
    min: 8,
    max: 20,
    message: '密码长度必须在 8-20 位之间',
    trigger: ['blur', 'input'],
  },
  {
    pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/,
    message: '密码必须包含字母、数字和特殊字符',
    trigger: ['blur', 'input'],
  },
]

const formRules = computed(() => ({
  companyName: { required: true, message: '请输入公司名称', trigger: 'blur' },
  ...(requiresPasswordOnEdit.value ? { password: passwordRules } : {}),
}))

const fetchVendorInfo = async () => {
  const userId = getProviderId()
  if (!userId) {
    message.error('未检测到登录信息')
    router.push('/login')
    return
  }
  try {
    const res = await vendorProfileStore.fetchVendorInfo(userId)
    if (res.code === 200 && res.data) {
      syncVendorDisplayName(res.data)
      if (activeMenu.value === 'orders') {
        await refreshVendorOrders()
      } else {
        await vendorOrderStore.refreshOrderSummary(res.data.id)
      }
    }
  } catch (error) {
    message.error('网络异常，无法获取企业信息')
  }
}

const handleEdit = async () => {
  try {
    await vendorProfileStore.prepareEditForm()
    showEditModal.value = true
  } catch (e) {
    void e
    message.error('加载编辑信息失败')
  }
}

const handleUploadRequest = async ({ file, onFinish, onError }) => {
  try {
    message.loading('文件上传中...')
    const res = await vendorProfileStore.uploadCertificate(file.file)
    message.destroyAll()
    if (res.code === 200 && res.data) {
      message.success('上传成功')
      onFinish()
    } else {
      message.error(res.msg || '上传失败')
      onError()
    }
  } catch (e) {
    message.destroyAll()
    message.error('上传出错')
    onError()
  }
}

const removeFile = async (file, index) => {
  if (file.id) {
    dialog.warning({
      title: '确认删除',
      content: '该文件已归档，确认要从服务器删除吗？',
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const res = await vendorProfileStore.deleteCertificate(file, index)
          if (res.code === 200) {
            message.success('删除成功')
          } else {
            message.error(res.msg || '删除失败')
          }
        } catch (e) {
          message.error('删除请求异常')
        }
      },
    })
  } else {
    await vendorProfileStore.deleteCertificate(file, index)
  }
}

const getFileName = (url) => {
  if (!url) return '未知文件'
  return url.split('/').pop()
}

const getFileExt = (url) => {
  const fileName = getFileName(url)
  const ext = fileName.includes('.') ? fileName.split('.').pop() : ''
  return ext ? ext.toUpperCase() : 'FILE'
}

const submitEdit = async () => {
  try {
    await editFormRef.value?.validate()
  } catch {
    return
  }

  const validationError = vendorProfileStore.getEditValidationError()
  if (validationError) {
    message.warning(validationError)
    return
  }

  try {
    const currentStatus = Number(vendorInfo.value.status)
    const hadCertificateChanged = certificateChanged.value
    const hadServiceTypeChanged =
      Number(editForm.serviceType) !== Number(vendorInfo.value.serviceType)
    if (hadServiceTypeChanged) {
      const vendorId = vendorInfo.value?.id || getProviderId()
      if (vendorId) {
        await vendorOrderStore.refreshOrderSummary(vendorId)
      }
      if (!canChangeServiceType.value) {
        message.warning(serviceTypeLockReason.value)
        return
      }
    }
    const res = await vendorProfileStore.submitEdit()
    if (res.code === 200) {
      message.success(
        currentStatus === 1 &&
          !hadCertificateChanged &&
          !hadServiceTypeChanged
          ? '企业信息修改成功'
          : '修改提交成功，请等待重新审核',
      )
      showEditModal.value = false
      await fetchVendorInfo()
    } else {
      message.error(res.msg || '提交失败')
    }
  } catch (error) {
    message.error(getErrorMessage(error, '提交请求异常'))
  }
}

// ================= 订单管理逻辑 =================
const currentOrderId = ref(null)
const showNoteModal = ref(false)
const noteModalTitle = ref('')
const noteModalActionText = ref('')
const noteModalPlaceholder = ref('')
const actionNote = ref('')
const resolveNodeStatusCode = (statusCode, node) =>
  vendorOrderStore.resolveNodeStatusCode(statusCode, node)
const resolveNodeStatusText = (statusCode, statusText, node) =>
  vendorOrderStore.resolveNodeStatusText(statusCode, statusText, node)
const getFlowCurrentNode = (flow) => vendorOrderStore.getFlowCurrentNode(flow)
const getFlowCurrentNodeStatusText = (flow) =>
  vendorOrderStore.getFlowCurrentNodeStatusText(flow)
const isNeedHandleConstructionStatus = (statusText) =>
  vendorOrderStore.isNeedHandleConstructionStatus(statusText)

const fetchOrders = async () => {
  const vendorId = vendorInfo.value.id
  if (!vendorId) return
  try {
    await vendorOrderStore.fetchOrders(vendorId)
  } catch (e) {
    const errorMsg = getErrorMessage(e, '获取订单列表失败')
    message.error(errorMsg)
  }
}

const refreshVendorOrders = async () => {
  const vendorId = vendorInfo.value.id
  if (!vendorId) return
  await fetchOrders()
  await vendorOrderStore.refreshOrderSummary(vendorId, {
    currentStatus: Number(orderStatusTab.value),
  })
}

const handleOrderTabChange = (value) => {
  orderStatusTab.value = String(value)
  pagination.page = 1
  refreshVendorOrders()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchOrders()
}

watch(activeMenu, (menu) => {
  if (menu === 'orders') {
    pagination.page = 1
    refreshVendorOrders()
  }
})

const handleAcceptConfirm = (row) => {
  dialog.success({
    title: '确认接单',
    content: '确定接下该订单吗？系统不会再提示备注。',
    positiveText: '确认接单',
    negativeText: '再想想',
    onPositiveClick: async () => {
      try {
        const res = await VendorOrderAPI.getManageOrderAccept(row.id, {
          vendorNotes: '',
        })
        if (res.code === 200) {
          message.success('接单成功')
          row.orderStatus = 1
          await refreshVendorOrders()
        } else {
          message.error(res.msg || '接单失败')
        }
      } catch (error) {
        message.error('接单请求异常')
      }
    },
  })
}

const handleRejectConfirm = (row) => {
  currentOrderId.value = row.id
  noteModalTitle.value = '确认拒单'
  noteModalActionText.value = '确认拒单'
  noteModalPlaceholder.value = '请输入拒单理由（建议填写）'
  actionNote.value = ''
  showNoteModal.value = true
}

const submitOrderAction = async () => {
  try {
    const res = await VendorOrderAPI.getManageOrderReject(currentOrderId.value, {
      vendorNotes: actionNote.value,
    })
    if (res.code === 200) {
      message.success('操作成功')
      showNoteModal.value = false
      refreshVendorOrders()
    } else {
      message.error(res.msg || '操作失败')
    }
  } catch (e) {
    message.error('网络请求异常')
  }
}

const handleCancelOrder = (row) => {
  if (isDispatchStageLockedForVendor(row)) {
    message.warning('订单已进入施工阶段，当前派单已锁定，不能取消')
    return
  }

  dialog.warning({
    title: '取消订单',
    content: '确定要取消这个正在进行中的订单吗？此操作不可逆。',
    positiveText: '确定取消',
    negativeText: '暂不取消',
    onPositiveClick: async () => {
      try {
        const res = await VendorOrderAPI.getManageOrderCancel(row.id, {
          vendorNotes: '',
        })
        if (res.code === 200) {
          message.success('订单已取消')
          row.orderStatus = 4
          await refreshVendorOrders()
        } else {
          message.error(res.msg || '取消失败')
        }
      } catch (e) {
        message.error('请求异常')
      }
    },
  })
}

// ================= 订单详情与施工流程 =================
const showOrderModal = ref(false)

const activeConstructionNodeId = computed(() => {
  if (!constructionStatus.value?.nodeDetails?.length) return null
  return (
    constructionStatus.value.nodeDetails[constructionStatus.value.currentNodeIndex]
      ?.nodeId || null
  )
})

const currentNodeStatusCode = computed(() => {
  if (isViewingActiveNode.value) {
    return resolveNodeStatusCode(
      constructionStatus.value?.currentNodeStatus,
      currentNodeDetail.value || getFlowCurrentNode(constructionStatus.value),
    )
  }
  return resolveNodeStatusCode(currentNodeDetail.value?.status, currentNodeDetail.value)
})

const isViewingActiveNode = computed(() => {
  if (!currentNodeDetail.value?.nodeId || !activeConstructionNodeId.value) return false
  return Number(currentNodeDetail.value.nodeId) === Number(activeConstructionNodeId.value)
})

const currentNodeStatusText = computed(() => {
  if (isViewingActiveNode.value) {
    return resolveNodeStatusText(
      constructionStatus.value?.currentNodeStatus,
      constructionStatus.value?.currentNodeStatusText ||
        currentNodeDetail.value?.statusText,
      currentNodeDetail.value || getFlowCurrentNode(constructionStatus.value),
    )
  }

  return resolveNodeStatusText(
    currentNodeDetail.value?.status,
    currentNodeDetail.value?.statusText,
    currentNodeDetail.value,
  )
})

const canUploadCurrentNode = computed(() => {
  if (!isViewingActiveNode.value) return false
  return [
    CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD,
    CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT,
    CONSTRUCTION_NODE_STATUS.AUDIT_REJECTED,
  ].includes(currentNodeStatusCode.value)
})

const canDeleteCurrentNodePhoto = computed(() => {
  if (!isViewingActiveNode.value) return false
  return [
    CONSTRUCTION_NODE_STATUS.WAIT_UPLOAD,
    CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT,
    CONSTRUCTION_NODE_STATUS.AUDIT_REJECTED,
  ].includes(currentNodeStatusCode.value)
})

const uploadNodeTipText = computed(() => {
  if (!currentNodeDetail.value) {
    return '请先选择当前施工节点，再上传现场施工照片（支持 JPG/PNG）'
  }

  if (!isViewingActiveNode.value) {
    return '仅当前施工阶段可上传照片，请选择正在进行中的节点'
  }

  if (canUploadCurrentNode.value) {
    if (currentNodeStatusCode.value === CONSTRUCTION_NODE_STATUS.WAIT_PLATFORM_AUDIT) {
      return '当前节点已上传待审核，如需替换图片，可删除后直接重新上传'
    }
    return '请上传现场施工照片以推进进度（支持 JPG/PNG）'
  }

  return `当前节点状态为“${
    currentNodeStatusText.value
  }”，暂不可继续上传`
})

const openOrderDetail = async (row) => {
  showOrderModal.value = true

  try {
    const res = await vendorOrderStore.openOrderDetail(row.id)
    if (res?.code !== 200) {
      message.error(res?.msg || '获取详情失败')
    }
  } catch (e) {
    message.error('获取详情失败')
  }
}

const loadConstructionFlow = async (userOrderId, options = {}) => {
  try {
    await vendorOrderStore.loadConstructionFlow(userOrderId, options)
  } catch (e) {
    void e
  }
}

const handleNodeClick = async (node) => {
  if (!currentOrderDetail.value) {
    message.error('订单详情未加载')
    return
  }
  const userOrderId = currentOrderDetail.value.orderId
  try {
    const res = await vendorOrderStore.loadNodeDetail(userOrderId, node)
    if (res?.code !== 200) {
      message.error(res?.msg || '加载节点详情失败')
    }
  } catch (e) {
    message.error('加载节点详情失败')
  }
}

const isConstructionFlowCompleted = (flow) => {
  if (!flow?.nodeDetails?.length) return false

  const lastIndex = flow.nodeDetails.length - 1
  const currentIndex = Number(flow.currentNodeIndex)
  if (currentIndex !== lastIndex) return false

  const currentStatus = Number(flow.currentNodeStatus)
  const detailStatus = Number(currentNodeDetail.value?.status)
  return (
    currentStatus === CONSTRUCTION_NODE_STATUS.FINISHED ||
    detailStatus === CONSTRUCTION_NODE_STATUS.FINISHED
  )
}

const getConstructionStepsCurrent = (flow) => {
  if (!flow?.nodeDetails?.length) return 0
  return isConstructionFlowCompleted(flow)
    ? flow.nodeDetails.length
    : flow.currentNodeIndex
}

const getNodeStatus = (index, currentIndex, flow = constructionStatus.value) => {
  if (isConstructionFlowCompleted(flow)) return 'finish'
  if (index === currentIndex) return 'process'
  if (index < currentIndex) return 'finish'
  return 'wait'
}
const getNodeStatusDesc = (
  index,
  currentIndex,
  flow = constructionStatus.value,
) => {
  if (isConstructionFlowCompleted(flow)) return '已完成'
  if (index === currentIndex) return '进行中'
  if (index < currentIndex) return '已完成'
  return '待开始'
}

const formatChineseDate = (value) => {
  if (!value) return '暂无'
  const datePart = String(value).split('T')[0]
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${year}年${month}月${day}日`
}

const getOrderStatusText = (status) => {
  const map = {
    0: '已拒接',
    1: '已接受',
    2: '已完成',
    3: '未回复',
    4: '已取消',
  }
  return map[status] || '未知'
}

// 上传节点照片
const handleUploadNodePhoto = async ({ file, onFinish, onError }) => {
  if (!currentNodeDetail.value || !vendorInfo.value.id) return
  if (!canUploadCurrentNode.value) {
    message.warning(uploadNodeTipText.value)
    onError()
    return
  }

  // 构造参数：必须与修复后的API匹配（params传id, data传file）
  const params = {
    orderId: currentOrderDetail.value.orderId,
    nodeId: currentNodeDetail.value.nodeId,
    vendorId: vendorInfo.value.id,
    description: '服务商上传施工图',
    file: file.file,
  }

  try {
    const res = await ConstructionAPI.uploadNodePhoto(params)
    if (res.code === 200) {
      message.success('上传成功')
      onFinish()
      vendorOrderStore.invalidateConstructionFlowCache(currentOrderDetail.value.orderId)
      await loadConstructionFlow(currentOrderDetail.value.orderId)
      await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
      await refreshVendorOrders()
    } else {
      message.error(res.msg || '上传失败')
      onError()
    }
  } catch (e) {
    message.error('上传异常')
    onError()
  }
}

// 删除节点照片
const handleDeletePhoto = (imageId) => {
  if (!canDeleteCurrentNodePhoto.value) {
    message.warning('当前节点状态下不允许删除施工照片')
    return
  }

  dialog.warning({
    title: '删除照片',
    content: '确定要删除这张施工照片吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 构造数据：必须与修复后的API匹配（params传id）
        const data = {
          orderId: currentOrderDetail.value.orderId,
          vendorId: vendorInfo.value.id,
          nodeId: currentNodeDetail.value.nodeId,
        }

        // API调用：deleteNodePhoto(data, imageId)
        const res = await ConstructionAPI.deleteNodePhoto(
          data.orderId,
          data.vendorId,
          data.nodeId,
          imageId,
        )
        if (res.code === 200) {
          message.success('删除成功')
          vendorOrderStore.invalidateConstructionFlowCache(currentOrderDetail.value.orderId)
          await loadConstructionFlow(currentOrderDetail.value.orderId)
          await handleNodeClick({ nodeId: currentNodeDetail.value.nodeId })
          await refreshVendorOrders()
        } else {
          message.error(res.msg || '删除失败')
        }
      } catch (e) {
        message.error('删除请求异常')
      }
    },
  })
}

const getServiceTypeText = (type) => {
  const map = { 1: '建造商', 2: '材料商', 3: '综合服务商' }
  return map[type] || '未知'
}
const getServiceTypeTag = (type) => {
  return type === 3 ? 'success' : 'info'
}
const materialTagPalette = [
  { color: '#fff7ed', text: '#c2410c' },
  { color: '#eff6ff', text: '#1d4ed8' },
  { color: '#ecfdf5', text: '#047857' },
  { color: '#fdf2f8', text: '#be185d' },
  { color: '#f5f3ff', text: '#6d28d9' },
  { color: '#effcf6', text: '#0f766e' },
]
const getMaterialTagStyle = (index) => {
  const palette = materialTagPalette[index % materialTagPalette.length]
  return {
    '--n-color': palette.color,
    '--n-color-hover': palette.color,
    '--n-color-pressed': palette.color,
    '--n-text-color': palette.text,
    '--n-border': `1px solid ${palette.text}22`,
    '--n-border-hover': `1px solid ${palette.text}22`,
    '--n-border-pressed': `1px solid ${palette.text}22`,
  }
}

const logout = () => {
  clearPendingOrderNotificationRead(getProviderId())
  closePendingOrderNotification()
  vendorOrderStore.clearOrderState()
  authStore.logout(AUTH_SCOPE_PROVIDER)
  router.replace('/login')
  message.success('已退出登录')
}

watch(
  () => editForm.serviceType,
  (value) => {
    if (![2, 3].includes(value)) {
      editForm.materialCategoryIds = []
    }
  },
)

onMounted(() => {
  authStore.setActiveScope(AUTH_SCOPE_PROVIDER)
  fetchVendorInfo()
})

onBeforeUnmount(() => {
  closePendingOrderNotification()
})

watch(
  () => [
    vendorInfo.value?.id,
    acceptedNeedHandleCount.value,
    unrepliedOrderCount.value,
  ],
  () => {
    maybeShowPendingOrderNotification()
  },
  { flush: 'post' },
)
</script>

<style lang="scss" scoped>
.client-center-content {
  min-width: 0;
}

.client-center-mobile-menu {
  margin-bottom: 16px;
}

.client-center-mobile-nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.client-center-mobile-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px 12px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%);
  color: var(--color-text-secondary);
  text-align: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.client-center-mobile-nav__item.is-active {
  color: var(--color-brand-700);
  border-color: rgba(39, 110, 61, 0.22);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.client-center-mobile-nav__icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  background: rgba(39, 110, 61, 0.1);
}

.client-center-mobile-nav__label {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.client-center-mobile-nav__desc {
  font-size: 11px;
  line-height: 1.2;
  color: var(--color-text-muted);
}

.h-full {
  height: 100vh;
}
.p-6 {
  padding: 24px;
}
.address-preview {
  color: #4b5563;
  word-break: break-all;
}

.vendor-company-name {
  font-size: 1.1em;
  color: #333;
}

.service-type-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 14px 16px;
}

.service-type-card__label {
  font-size: 14px;
  font-weight: 600;
  color: #1f5131;
}

.service-type-card__content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-type-card__content--form {
  flex: 1;
  align-items: stretch;
  flex-direction: column;
}

.service-type-card__helper {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: #4b5563;
  font-size: 13px;
}

.service-type-card__hint {
  color: #7a8b80;
  cursor: pointer;
}

.vendor-material-tags {
  gap: 8px 10px !important;
}

.vendor-material-tag {
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.vendor-order-tabs {
  margin-bottom: 4px;
}

.vendor-order-tab-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 40px;
}

.vendor-order-tab-badge {
  display: inline-flex;
  align-items: center;
}

.vendor-order-tab-badge :deep(.n-badge-sup) {
  position: static;
  transform: none;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  border-radius: 999px;
}

.vendor-order-table {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.vendor-order-table__inner {
  min-width: 1180px;
  overflow: hidden;
}

.vendor-order-table__head,
.vendor-order-table__row {
  display: grid;
  grid-template-columns: 120px 120px minmax(240px, 1.2fr) 120px minmax(260px, 1fr);
  align-items: center;
}

.vendor-order-table__head {
  padding: 14px 18px;
  background: linear-gradient(180deg, #f7faf8 0%, #eef4ef 100%);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.vendor-order-table__row {
  padding: 16px 18px;
  border-top: 1px solid var(--color-border-soft);
}

.vendor-order-table__cell {
  min-width: 0;
  text-align: center;
  color: var(--color-text-primary);
}

.vendor-order-table__cell--price {
  color: #d03050;
  font-weight: 700;
}

.vendor-order-table__cell--actions {
  justify-self: stretch;
}

.vendor-order-table__label {
  display: none;
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;
}

.vendor-order-table__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.vendor-order-table__actions :deep(.n-button) {
  white-space: nowrap;
}

.construction-waiting-state {
  padding: 8px 0 4px;
}

.construction-progress-placeholder {
  height: 4px;
}

.construction-flow-section {
  margin-top: 24px;
}

.service-flow-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.service-flow-header__node {
  color: var(--color-brand-700);
}

.service-flow-header__tag {
  margin-left: 8px;
}

.service-flow-header__meta {
  margin-left: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.service-flow-nav {
  border-right: 1px solid var(--color-border-soft);
  padding-right: 8px;
}

.service-flow-step {
  cursor: pointer;
  border-radius: 12px;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateX(4px);
  }

  &:hover :deep(.n-step-content) {
    background: var(--color-surface-soft);
    border-radius: 12px;
  }

  &:hover :deep(.n-step-content__title) {
    color: var(--color-brand-700);
  }
}

.service-upload-panel {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-soft);
  border-radius: 4px;

  :deep(.n-button) {
    min-height: 42px;
  }
}

.service-upload-panel__tip {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 6px;
}

.service-flow-timeline {
  max-height: 400px;
}

.service-flow-image-group {
  margin-top: 8px;
}

.service-flow-image-wrap {
  position: relative;
  display: inline-block;
}

.service-flow-image {
  border-radius: 4px;
  border: 1px solid var(--color-border-soft);
}

.service-flow-image-delete {
  position: absolute;
  top: -5px;
  right: -5px;
  z-index: 10;
}

.service-flow-empty {
  margin-top: 20px;
}

.service-flow-empty-state {
  text-align: center;
  margin-top: 50px;
  color: var(--color-text-muted);
}

.construction-waiting-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f3b63;
  text-align: center;
}

.construction-waiting-desc {
  max-width: 560px;
  line-height: 1.8;
  color: #5b6b84;
  text-align: center;
}

.cert-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 20px;
  .cert-item {
    width: 150px;
    height: 150px;
    border: 1px solid var(--color-border-soft);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-soft);
    .cert-card {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      .cert-name {
        font-size: 12px;
        color: #666;
      }
      .cert-link {
        font-size: 12px;
        color: var(--color-brand-900);
        text-decoration: none;
      }
    }
  }
}

.edit-certificate-panel {
  width: 100%;
}

.edit-certificate-tip {
  margin-top: 10px;
  color: #6b7280;
  font-size: 12px;
}

.edit-certificate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.edit-certificate-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
}

.edit-certificate-card__icon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-brand-700);
  background: rgba(39, 110, 61, 0.12);
  flex: 0 0 auto;
}

.edit-certificate-card__meta {
  flex: 1;
  min-width: 0;
}

.edit-certificate-card__type {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-brand-700);
}

.edit-certificate-card__name {
  display: block;
  margin-top: 4px;
  color: #374151;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-certificate-card__name:hover {
  color: var(--color-brand-700);
}

.edit-certificate-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex: 0 0 auto;
}

.edit-certificate-card__action {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-brand-700);
  font-size: 12px;
  text-decoration: none;
}

.edit-certificate-card__action--danger {
  color: #d03050;
}

@media (max-width: 768px) {
  .h-full {
    height: auto;
  }

  .p-6 {
    padding: 0;
  }

  .client-center-layout {
    display: block;
  }

  .client-center-mobile-menu {
    :deep(.n-card-header) {
      padding-bottom: 12px;
    }
  }

  .service-type-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .vendor-order-table__inner {
    min-width: 0;
  }

  .vendor-order-table__head {
    display: none;
  }

  .vendor-order-table__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .vendor-order-table__cell {
    text-align: left;
  }

  .vendor-order-table__label {
    display: block;
  }

  .vendor-order-table__actions {
    justify-content: flex-start;
    flex-direction: column;
    align-items: stretch;
  }

  .vendor-order-table__actions :deep(.n-button) {
    width: 100%;
  }

  .vendor-order-tabs {
    width: 100%;
  }

  .vendor-order-tabs :deep(.n-tabs-nav),
  .vendor-order-tabs :deep(.n-tabs-nav-scroll-wrapper),
  .vendor-order-tabs :deep(.n-tabs-nav-scroll-content) {
    width: 100%;
  }

  .vendor-order-tabs :deep(.n-tabs-tab) {
    flex: 1 1 0;
    min-width: 0;
    justify-content: center;
  }

  .service-modal-footer {
    width: 100%;
    justify-content: stretch !important;
  }

  .service-modal-footer > * {
    flex: 1 1 100%;
  }

  .service-flow-header__tag,
  .service-flow-header__meta {
    margin-left: 0;
    display: inline-flex;
  }

  .service-flow-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .service-flow-nav {
    border-right: none;
    border-bottom: 1px solid var(--color-border-soft);
    padding-right: 0;
    padding-bottom: 12px;
  }

  .service-upload-panel :deep(.n-button) {
    width: 100%;
  }

  .service-flow-image-group :deep(.n-space) {
    width: 100%;
    flex-wrap: wrap;
  }

  .cert-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .cert-grid .cert-item {
    width: auto;
    height: auto;
    min-height: 132px;
    padding: 12px;
  }

  .edit-certificate-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .edit-certificate-card__actions {
    align-items: flex-start;
    flex-direction: row;
  }
}

@media (max-width: 576px) {
  .client-center-mobile-nav {
    grid-template-columns: 1fr;
  }

  .client-center-mobile-nav__item {
    padding: 12px 8px 10px;
  }

  .client-center-mobile-nav__icon {
    width: 42px;
    height: 42px;
  }

  .cert-grid {
    grid-template-columns: 1fr;
  }

  .construction-waiting-title {
    font-size: 15px;
  }

  .construction-waiting-desc {
    font-size: 13px;
  }
}
</style>
