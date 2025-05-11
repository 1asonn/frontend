<template>
  <div class="app-container">
    <!-- 页面标题和摘要信息 -->
    <el-card class="summary-card" shadow="hover">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title"><i class="el-icon-goods title-icon"></i> 药品入库管理</h2>
          <div class="page-subtitle">管理药品的入库记录、审核和查询</div>
        </div>
        <div class="header-actions">
          <el-button type="primary" icon="el-icon-plus" @click="handleCreateStockIn">
            新建入库单
          </el-button>
          <el-button plain icon="el-icon-refresh" @click="getList">
            刷新
          </el-button>
          <el-dropdown @command="handleCommand" trigger="click">
            <el-button plain>
              更多操作 <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="export"><i class="el-icon-download"></i> 导出数据</el-dropdown-item>
              <el-dropdown-item command="print"><i class="el-icon-printer"></i> 打印列表</el-dropdown-item>
              <el-dropdown-item command="batchImport"><i class="el-icon-upload2"></i> 批量导入</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 统计摘要 -->
      <el-row :gutter="20" class="data-summary">
        <el-col :span="6">
          <div class="data-card" @click="filterByStatus('')">
            <div class="data-icon"><i class="el-icon-s-data"></i></div>
            <div class="data-info">
              <div class="data-title">全部入库单</div>
              <div class="data-value">{{ statsSummary.total || 0 }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="data-card pending" @click="filterByStatus('pending')">
            <div class="data-icon"><i class="el-icon-time"></i></div>
            <div class="data-info">
              <div class="data-title">待审核</div>
              <div class="data-value">{{ statsSummary.pending || 0 }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="data-card approved" @click="filterByStatus('approved')">
            <div class="data-icon"><i class="el-icon-check"></i></div>
            <div class="data-info">
              <div class="data-title">已审核</div>
              <div class="data-value">{{ statsSummary.approved || 0 }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="data-card cancelled" @click="filterByStatus('cancelled')">
            <div class="data-icon"><i class="el-icon-close"></i></div>
            <div class="data-info">
              <div class="data-title">已取消</div>
              <div class="data-value">{{ statsSummary.cancelled || 0 }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 高级搜索区域 -->
    <el-card class="filter-card" shadow="hover">
      <div slot="header" class="filter-card-header">
        <span><i class="el-icon-search"></i> 高级搜索</span>
        <el-button type="text" icon="el-icon-refresh-left" @click="resetFilter">重置搜索</el-button>
      </div>
      
      <el-form :inline="true" :model="listQuery" class="filter-form" size="small">
        <el-form-item label="关键词">
          <el-input
            v-model="listQuery.keyword"
            placeholder="入库单号/药品名称"
            clearable
            prefix-icon="el-icon-search"
            style="width: 220px"
            @keyup.enter.native="handleFilter"
            @clear="handleFilter"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select
            v-model="listQuery.status"
            placeholder="入库状态"
            clearable
            style="width: 130px"
            @change="handleFilter"
          >
            <el-option label="待审核" value="pending">
              <el-tag size="mini" type="warning">待审核</el-tag>
            </el-option>
            <el-option label="已审核" value="approved">
              <el-tag size="mini" type="success">已审核</el-tag>
            </el-option>
            <el-option label="已取消" value="cancelled">
              <el-tag size="mini" type="danger">已取消</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="入库日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            align="right"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            style="width: 350px"
            @change="handleDateRangeChange"
            :picker-options="pickerOptions"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item label="供应商">
          <el-select
            v-model="listQuery.supplier_id"
            placeholder="选择供应商"
            clearable
            filterable
            style="width: 200px"
            @change="handleFilter"
          >
            <el-option 
              v-for="item in supplierOptions" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id" 
            ></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>
          <el-button plain icon="el-icon-delete" @click="resetFilter">清除</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 入库单列表 -->
    <el-card class="table-card" shadow="hover" style="margin-top: 20px; overflow: auto;">
      <div slot="header" class="table-header">
        <div class="table-title">
          <i class="el-icon-tickets"></i> 入库单列表
        </div>
        <div class="table-options">
          <el-radio-group v-model="tableView" size="small" @change="handleViewChange">
            <el-radio-button label="table"><i class="el-icon-tickets"></i> 表格</el-radio-button>
            <el-radio-button label="card"><i class="el-icon-menu"></i> 卡片</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 表格视图 -->
      <div v-if="tableView === 'table'" class="table-container">
        <el-table
          v-loading="listLoading"
          :data="list"
          border
          stripe
          highlight-current-row
          style="min-width: 1200px; width: 100%"
          :row-class-name="getRowClassName"
          @row-click="onRowClick"
          size="small"
          :header-cell-style="{background:'#f5f7fa', color:'#606266'}"
        >
          <!-- 展开详情列 -->
          <el-table-column type="expand" width="50">
            <template slot-scope="{row}">
              <el-form label-position="left" inline class="table-expand">
                <el-form-item label="入库单号">
                  <span>{{ row.code }}</span>
                </el-form-item>
                <el-form-item label="入库日期">
                  <span>{{ formatDate(row.entry_date) }}</span>
                </el-form-item>
                <el-form-item label="总金额">
                  <span class="amount-text">¥{{ formatPrice(row.total_amount) }}</span>
                </el-form-item>
                <el-form-item label="备注" class="full-width-item">
                  <span>{{ row.remark || '无' }}</span>
                </el-form-item>
                
                <!-- 药品明细 -->
                <div class="detail-medicine-list">
                  <div class="detail-title">药品明细</div>
                  <el-table :data="row.items || []" size="mini" border stripe>
                    <el-table-column type="index" width="50" label="#" align="center"></el-table-column>
                    <el-table-column prop="medicine_name" label="药品名称" min-width="150"></el-table-column>
                    <el-table-column prop="specification" label="规格" width="120"></el-table-column>
                    <el-table-column prop="quantity" label="数量" width="80" align="center">
                      <template slot-scope="scope">
                        <span>{{ scope.row.quantity }}{{ scope.row.unit }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="price" label="单价" width="100" align="right">
                      <template slot-scope="scope">
                        <span>¥{{ formatPrice(scope.row.price) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column prop="amount" label="金额" width="100" align="right">
                      <template slot-scope="scope">
                        <span class="amount-text">¥{{ formatPrice(scope.row.amount) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-form>
            </template>
          </el-table-column>
          
          <!-- 固定左侧列 -->
          <el-table-column label="入库单号" prop="code" align="center" width="150" fixed="left">
            <template slot-scope="{row}">
              <el-link type="primary" @click.stop="handleViewDetail(row)">{{ row.code }}</el-link>
            </template>
          </el-table-column>
          
          <el-table-column label="入库日期" width="100" align="center">
            <template slot-scope="{row}">
              <el-tooltip :content="formatDateTime(row.created_at)" placement="top" effect="light">
                <span>{{ formatDate(row.entry_date) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          
          <el-table-column label="供应商" prop="supplier_name" min-width="140" show-overflow-tooltip />
          
          <el-table-column label="药品数量" align="center" width="90">
            <template slot-scope="{row}">
              <el-popover
                placement="right"
                width="300"
                trigger="hover"
              >
                <div class="popover-title">药品清单 ({{ row.items ? row.items.length : 0 }}种)</div>
                <el-table :data="row.items || []" size="mini">
                  <el-table-column prop="medicine_name" label="名称" width="150"></el-table-column>
                  <el-table-column prop="quantity" label="数量" width="70" align="center">
                    <template slot-scope="scope">
                      <span>{{ scope.row.quantity }}{{ scope.row.unit }}</span>
                    </template>
                  </el-table-column>
                </el-table>
                <el-badge :value="row.items ? row.items.length : 0" slot="reference" type="primary">
                  <span class="medicine-count-text">{{ row.items ? row.items.length : 0 }}种</span>
                </el-badge>
              </el-popover>
            </template>
          </el-table-column>
          
          <el-table-column label="总金额" align="right" width="100">
            <template slot-scope="{row}">
              <span class="amount-text">¥{{ formatPrice(row.total_amount) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="{row}">
              <el-tag :type="getStatusType(row.status)" effect="dark" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="经办人" prop="operator_name" width="90" align="center" />
          
          <!-- 固定右侧列 -->
          <el-table-column label="操作" align="center" width="90" fixed="right">
            <template slot-scope="{row}">
              <el-dropdown @command="(command) => handleCommand(command, row)" trigger="click" size="mini">
                <el-button size="mini" type="primary">
                  操作<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="view"><i class="el-icon-view"></i> 查看详情</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'pending'" command="approve"><i class="el-icon-check"></i> 审核入库</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'pending'" command="cancel"><i class="el-icon-close"></i> 取消入库</el-dropdown-item>
                  <el-dropdown-item command="print"><i class="el-icon-printer"></i> 打印入库单</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 卡片视图 -->
      <div v-else class="card-view">
        <el-empty v-if="list.length === 0" description="没有入库单记录"></el-empty>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(item, index) in list" :key="index" style="margin-bottom: 20px">
            <el-card shadow="hover" :body-style="{ padding: '0px' }" :class="getCardClass(item)">
              <div class="stock-card-header">
                <el-tag :type="getStatusType(item.status)" effect="dark" size="small">
                  {{ getStatusText(item.status) }}
                </el-tag>
                <span class="stock-card-code">{{ item.code }}</span>
              </div>
              <div class="stock-card-body">
                <div class="stock-card-item">
                  <span class="label">入库日期:</span>
                  <span class="value">{{ formatDate(item.entry_date) }}</span>
                </div>
                <div class="stock-card-item">
                  <span class="label">供应商:</span>
                  <span class="value" :title="item.supplier_name">{{ item.supplier_name }}</span>
                </div>
                <div class="stock-card-item">
                  <span class="label">药品数量:</span>
                  <span class="value">{{ item.items ? item.items.length : 0 }}种</span>
                </div>
                <div class="stock-card-item">
                  <span class="label">总金额:</span>
                  <span class="value amount-text">¥{{ formatPrice(item.total_amount) }}</span>
                </div>
                <div class="stock-card-item">
                  <span class="label">经办人:</span>
                  <span class="value">{{ item.operator_name }}</span>
                </div>
              </div>
              <div class="stock-card-footer">
                <el-button type="text" icon="el-icon-view" @click="handleViewDetail(item)">详情</el-button>
                <el-button v-if="item.status === 'pending'" type="text" icon="el-icon-check" @click="handleApprove(item)">审核</el-button>
                <el-button v-if="item.status === 'pending'" type="text" icon="el-icon-close" @click="handleCancel(item)">取消</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <!-- 入库单详情对话框 -->
    <el-dialog
      :title="detailTitle"
      :visible.sync="detailDialogVisible"
      width="900px"
      class="stock-detail-dialog"
      :fullscreen="detailFullscreen"
      :close-on-click-modal="false"
    >
      <div slot="title" class="dialog-title-container">
        <div>
          <i class="el-icon-document"></i> {{ detailTitle }}
          <el-tag v-if="currentDetail.status" :type="getStatusType(currentDetail.status)" effect="dark" size="mini" style="margin-left: 10px">
            {{ getStatusText(currentDetail.status) }}
          </el-tag>
        </div>
        
        <div class="dialog-title-actions">
          <el-tooltip content="全屏模式" placement="top">
            <el-button type="text" @click="toggleDetailFullscreen">
              <i :class="detailFullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      
      <div v-loading="detailLoading" class="detail-container">
        <!-- 详情标签页 -->
        <el-tabs v-model="detailActiveTab" tab-position="left" style="height: 100%">
          <!-- 基本信息标签 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-card shadow="never" class="detail-card">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="入库单号">
                  <el-tag type="info">{{ currentDetail.code }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="入库日期">{{ formatDate(currentDetail.entry_date) }}</el-descriptions-item>
                <el-descriptions-item label="供应商">{{ currentDetail.supplier_name }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="getStatusType(currentDetail.status)">
                    {{ getStatusText(currentDetail.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="经办人">{{ currentDetail.operator_name }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatDateTime(currentDetail.created_at) }}</el-descriptions-item>
                <el-descriptions-item :span="2" label="备注">
                  {{ currentDetail.remark || '无' }}
                </el-descriptions-item>
              </el-descriptions>

              <div v-if="currentDetail.status === 'approved'" class="approval-info">
                <el-divider content-position="left">审核信息</el-divider>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="审核人">{{ currentDetail.approver_name }}</el-descriptions-item>
                  <el-descriptions-item label="审核时间">{{ formatDateTime(currentDetail.approved_at) }}</el-descriptions-item>
                  <el-descriptions-item :span="2" label="审核备注">
                    {{ currentDetail.approve_remark || '无' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <div v-if="currentDetail.status === 'cancelled'" class="cancel-info">
                <el-divider content-position="left">取消信息</el-divider>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="取消人">{{ currentDetail.canceller_name }}</el-descriptions-item>
                  <el-descriptions-item label="取消时间">{{ formatDateTime(currentDetail.cancelled_at) }}</el-descriptions-item>
                  <el-descriptions-item :span="2" label="取消原因">
                    {{ currentDetail.cancel_reason || '无' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
          </el-tab-pane>
          
          <!-- 药品明细标签 -->
          <el-tab-pane label="药品明细" name="items">
            <el-card shadow="never" class="detail-card">
              <template slot="header">
                <div class="medicine-header">
                  <span><i class="el-icon-goods"></i> 药品明细</span>
                  <div>
                    <el-tag type="info">总药品数: {{ currentDetail.items ? currentDetail.items.length : 0 }}种</el-tag>
                    <el-tag type="danger" style="margin-left: 10px">总金额: ¥{{ formatPrice(currentDetail.total_amount) }}</el-tag>
                  </div>
                </div>
              </template>
              
              <el-table :data="currentDetail.items || []" border stripe style="width: 100%" height="400">
                <el-table-column label="药品名称" prop="medicine_name" min-width="150" show-overflow-tooltip />
                <el-table-column label="规格" prop="specification" width="120" show-overflow-tooltip />
                <el-table-column label="批号" prop="batch_number" width="120" show-overflow-tooltip />
                <el-table-column label="数量" align="center" width="80">
                  <template slot-scope="{row}">
                    <span class="quantity-text">{{ row.quantity }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" prop="unit" width="80" align="center" />
                <el-table-column label="单价" width="100" align="center">
                  <template slot-scope="{row}">
                    <span class="price-text">¥{{ formatPrice(row.price) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" width="100" align="center">
                  <template slot-scope="{row}">
                    <span class="amount-text">¥{{ formatPrice(row.amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产日期" width="120" align="center">
                  <template slot-scope="{row}">
                    <span>{{ formatDate(row.production_date) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="有效期至" width="120" align="center">
                  <template slot-scope="{row}">
                    <span :class="{ 'expiring-soon': isExpiringWithin30Days(row.expiry_date), 'expired': isExpired(row.expiry_date) }">
                      {{ formatDate(row.expiry_date) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="存放位置" prop="location" width="120" show-overflow-tooltip />
              </el-table>
              
              <div class="summary-section">
                <div class="summary-item">
                  <span class="summary-label">总药品数量:</span>
                  <span class="summary-value quantity-text">{{ getTotalQuantity(currentDetail.items) }}件</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">总品种数:</span>
                  <span class="summary-value">{{ currentDetail.items ? currentDetail.items.length : 0 }}种</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">总金额:</span>
                  <span class="summary-value amount-text">¥{{ formatPrice(currentDetail.total_amount) }}</span>
                </div>
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
        
        <!-- 底部操作按钮 -->
        <div class="detail-footer">
          <el-button-group class="detail-actions">
            <el-button v-if="currentDetail.status === 'pending'" type="success" icon="el-icon-check" @click="handleApprove(currentDetail)">审核入库</el-button>
            <el-button v-if="currentDetail.status === 'pending'" type="danger" icon="el-icon-close" @click="handleCancel(currentDetail)">取消入库</el-button>
            <el-button type="primary" icon="el-icon-printer" @click="handlePrint">打印</el-button>
            <el-button type="info" icon="el-icon-download" @click="handleExportDetail">导出详情</el-button>
            <el-button @click="detailDialogVisible = false">关闭</el-button>
          </el-button-group>
        </div>
      </div>
    </el-dialog>

    <!-- 新建入库单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="1000px"
      :close-on-click-modal="false"
      @close="resetStockInForm"
      custom-class="stock-in-dialog"
      :fullscreen="isFullscreen"
    >
      <div class="dialog-toolbar">
        <el-button type="text" @click="toggleFullscreen">
          <i :class="isFullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
          {{ isFullscreen ? '退出全屏' : '全屏编辑' }}
        </el-button>
        <el-button type="text" @click="resetStockInForm" v-if="formChanged">
          <i class="el-icon-refresh-left"></i> 重置表单
        </el-button>
      </div>
      <el-form ref="stockInForm" :model="stockInForm" :rules="stockInRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier_id">
              <el-select
                v-model="stockInForm.supplier_id"
                filterable
                placeholder="请选择供应商"
                style="width: 100%"
                :clearable="true"
              >
                <el-option
                  v-for="item in supplierOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库日期" prop="entry_date">
              <el-date-picker
                v-model="stockInForm.entry_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="yyyy-MM-dd"
                :picker-options="{
                  disabledDate(time) {
                    return time.getTime() > Date.now()
                  }
                }"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="stockInForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>

        <div class="form-divider">
          <span>药品明细</span>
          <div class="divider-actions">
            <el-button type="primary" icon="el-icon-plus" @click="handleAddItem" size="small">添加药品</el-button>
            <el-button type="info" icon="el-icon-upload2" @click="handleBatchImport" size="small">批量导入</el-button>
            <el-button type="danger" icon="el-icon-delete" @click="handleClearItems" size="small" :disabled="!stockInForm.items.length">清空列表</el-button>
          </div>
        </div>

        <div class="table-summary" v-if="stockInForm.items.length > 0">
          <div class="summary-item">
            <span class="label">药品种类:</span>
            <span class="value">{{ stockInForm.items.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总数量:</span>
            <span class="value">{{ getTotalQuantity(stockInForm.items) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总金额:</span>
            <span class="value highlight">¥{{ formatPrice(getTotalAmount(stockInForm.items)) }}</span>
          </div>
        </div>

        <el-table
          :data="stockInForm.items"
          border
          style="width: 100%; margin-bottom: 20px"
          :max-height="400"
          highlight-current-row
          :row-class-name="getRowClassName"
          empty-text="请添加药品明细"
        >
          <el-table-column label="药品名称" min-width="200">
            <template slot-scope="{row, $index}">
              <el-select
                v-model="row.medicine_id"
                filterable
                placeholder="选择药品"
                style="width: 100%"
                @change="(val) => handleMedicineChange(val, $index)"
                @clear="() => handleMedicineClear($index)"
                :clearable="true"
              >
                <el-option
                  v-for="item in medicineOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                >
                  <span style="float: left">{{ item.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ item.specification }}
                  </span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="规格" min-width="120">
            <template slot-scope="{row}">
              <span>{{ row.specification || '' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="批号" min-width="150">
            <template slot-scope="{row}">
              <el-input 
                v-model="row.batch_number" 
                placeholder="请输入批号"
                :disabled="!row.medicine_id"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="数量" min-width="100">
            <template slot-scope="{row}">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :precision="0"
                size="small"
                style="width: 100%"
                @change="calculateItemAmount(row)"
                :disabled="!row.medicine_id"
                controls-position="right"
                class="quantity-input"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="单位" min-width="80">
            <template slot-scope="{row}">
              <span>{{ row.unit || '' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="单价" min-width="150">
            <template slot-scope="{row}">
              <el-input-number
                v-model="row.price"
                :min="0"
                :precision="2"
                :step="0.01"
                size="small"
                style="width: 100%"
                @change="calculateItemAmount(row)"
                :disabled="!row.medicine_id"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="金额" min-width="120">
            <template slot-scope="{row}">
              <span class="amount">¥{{ formatPrice(row.amount) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="生产日期" min-width="180">
            <template slot-scope="{row}">
              <el-date-picker
                v-model="row.production_date"
                type="date"
                placeholder="生产日期"
                style="width: 100%"
                value-format="yyyy-MM-dd"
                :picker-options="{
                  disabledDate(time) {
                    return time.getTime() > Date.now()
                  }
                }"
                :disabled="!row.medicine_id"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="有效期至" min-width="180">
            <template slot-scope="{row}">
              <el-date-picker
                v-model="row.expiry_date"
                type="date"
                placeholder="有效期"
                style="width: 100%"
                value-format="yyyy-MM-dd"
                :picker-options="{
                  disabledDate(time) {
                    return time.getTime() <= new Date(row.production_date).getTime()
                  }
                }"
                :disabled="!row.medicine_id"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="存放位置" min-width="180">
            <template slot-scope="{row}">
              <el-input 
                v-model="row.location" 
                placeholder="请输入位置"
                :disabled="!row.medicine_id"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template slot-scope="{$index}">
              <el-button
                type="danger"
                icon="el-icon-delete"
                circle
                size="mini"
                @click.prevent="removeItem($index)"
              />
            </template>
          </el-table-column>
        </el-table>

        <div class="form-footer">
          <div class="total-amount">
            <span>总金额: </span>
            <span class="amount">¥{{ formatPrice(calculateTotalAmount()) }}</span>
          </div>
        </div>
      </el-form>
            <div slot="footer" class="dialog-footer">
          <div class="form-summary" v-if="stockInForm.items.length > 0">
            <div class="summary-text">
              <span>共 <b>{{ stockInForm.items.length }}</b> 种药品，总数量 <b>{{ getTotalQuantity(stockInForm.items) }}</b> 件，总金额 <b class="total-amount">¥{{ formatPrice(getTotalAmount(stockInForm.items)) }}</b></span>
            </div>
          </div>
          <div>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitStockIn" :loading="submitLoading" :disabled="!stockInForm.items.length">提交入库单</el-button>
          </div>
        </div>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      title="审核入库单"
      :visible.sync="approveDialogVisible"
      width="500px"
    >
      <el-form ref="approveForm" :model="approveForm" label-width="80px">
        <el-form-item label="审核备注">
          <el-input
            v-model="approveForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入审核备注（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="approveDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitApprove" :loading="approveLoading">确认审核</el-button>
      </div>
    </el-dialog>

    <!-- 取消对话框 -->
    <el-dialog
      title="取消入库单"
      :visible.sync="cancelDialogVisible"
      width="500px"
    >
      <el-form ref="cancelForm" :model="cancelForm" :rules="cancelRules" label-width="80px">
        <el-form-item label="取消原因" prop="reason">
          <el-input
            v-model="cancelForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelDialogVisible = false">关 闭</el-button>
        <el-button type="danger" @click="submitCancel" :loading="cancelLoading">确认取消</el-button>
      </div>
    </el-dialog>
    
    <!-- 审核交易单对话框 -->
    <el-dialog
      title="审核入库单"
      :visible.sync="approveDialogVisible"
      width="500px"
      @close="resetApproveForm"
    >
      <el-form :model="approveForm" ref="approveForm" label-width="80px">
        <el-form-item label="备注" prop="remark">
          <el-input
            type="textarea"
            v-model="approveForm.remark"
            placeholder="请输入审核备注"
            :rows="3"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="approveDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitApprove">确 认 审 核</el-button>
      </div>
    </el-dialog>
    
    <!-- 取消交易单对话框 -->
    <el-dialog
      title="取消入库单"
      :visible.sync="cancelDialogVisible"
      width="500px"
      @close="resetCancelForm"
    >
      <el-form :model="cancelForm" ref="cancelForm" label-width="80px">
        <el-form-item label="取消原因" prop="reason" :rules="[{ required: true, message: '请输入取消原因', trigger: 'blur' }]">
          <el-input
            type="textarea"
            v-model="cancelForm.reason"
            placeholder="请输入取消入库单的原因"
            :rows="3"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelDialogVisible = false">取 消</el-button>
        <el-button type="danger" :loading="submitLoading" @click="submitCancel">确认取消入库单</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getMedicineList, createStockIn, getStockInList, getStockInDetail, getTransactionDetail, approveTransaction, cancelTransaction } from '@/api/medicineStock'
import { getAllSuppliers } from '@/api/supplier' // 从供应商API导入获取所有供应商的函数
import { getCurrentUser, getCurrentUserId } from '@/utils/auth' // 导入JWT Token解析工具
import Pagination from '@/components/Pagination' // 导入分页组件

export default {
  name: 'MedicineStockIn',
  components: {
    Pagination // 注册分页组件
  },
  data() {
    return {
      // 新增全屏和表单变化监控
      isFullscreen: false,
      formChanged: false,
      cancelLoading: false,

      // 新UI相关属性
      tableView: 'table', // 表格视图类型：'table'或'card'
      detailFullscreen: false, // 详情对话框全屏状态
      detailActiveTab: 'basic', // 详情对话框当前标签
      
      // 统计数据
      statsSummary: {
        total: 0,
        pending: 0,
        approved: 0,
        cancelled: 0
      },
      
      // 日期选择器配置
      pickerOptions: {
        shortcuts: [
          {
            text: '最近7天',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近30天',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setDate(1)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      },

      // 审核和取消交易单相关
      approveDialogVisible: false,
      cancelDialogVisible: false,
      currentTransaction: null,
      
      // 审核表单
      approveForm: {
        remark: ''
      },
      
      // 取消表单
      cancelForm: {
        reason: ''
      },

      // 日期范围
      dateRange: [],
      
      // 列表相关
      list: [],
      total: 0,
      listLoading: false,
      listQuery: {
        page: 1,
        limit: 10,
        keyword: '',
        status: '',
        supplier_id: '',  // 新增供应商过滤
        start_date: '',
        end_date: ''
      },

      // 详情对话框
      detailDialogVisible: false,
      detailLoading: false,
      currentDetail: {},
      detailTitle: '入库单详情',

      // 新建/编辑对话框
      dialogVisible: false,
      dialogTitle: '新建入库单',
      submitLoading: false,
      stockInForm: {
        supplier_id: '',
        entry_date: new Date().toISOString().split('T')[0], // 默认今天
        remark: '',
        items: []
      },
      stockInRules: {
        supplier_id: [{ required: true, message: '请选择供应商', trigger: 'change' }],
        entry_date: [{ required: true, message: '请选择入库日期', trigger: 'change' }]
      },

      // 审核对话框
      approveDialogVisible: false,
      approveLoading: false,
      approveForm: {
        id: '',
        remark: ''
      },

      // 取消对话框
      cancelDialogVisible: false,
      cancelLoading: false,
      cancelForm: {
        id: '',
        reason: ''
      },
      cancelRules: {
        reason: [{ required: true, message: '请输入取消原因', trigger: 'blur' }]
      },

      // 选项数据
      supplierOptions: [],
      medicineOptions: []
    }
  },
  created() {
    this.getList()
    this.fetchSuppliers()
    this.fetchMedicines()
  },
  methods: {
    // 处理更多操作下拉菜单
    handleCommand(command, row) {
      switch(command) {
        case 'export':
          this.handleExport()
          break
        case 'print':
          this.handlePrint()
          break
        case 'batchImport':
          this.handleBatchImport()
          break
        case 'view':
          this.handleViewDetail(row)
          break
        case 'approve':
          this.handleApprove(row)
          break
        case 'cancel':
          this.handleCancel(row)
          break
      }
    },
    
    // 通过状态卡片过滤
    filterByStatus(status) {
      this.listQuery.status = status
      this.handleFilter()
    },
    
    // 获取行类名
    getRowClassName({ row }) {
      if (row.status === 'pending') return 'pending-row'
      if (row.status === 'approved') return 'approved-row'
      if (row.status === 'cancelled') return 'cancelled-row'
      return ''
    },
    
    // 获取卡片类名
    getCardClass(item) {
      const classes = ['stock-card']
      if (item.status === 'pending') classes.push('pending-card')
      if (item.status === 'approved') classes.push('approved-card')
      if (item.status === 'cancelled') classes.push('cancelled-card')
      return classes.join(' ')
    },
    
    // 处理行点击
    onRowClick(row) {
      // 点击行时打开详情，除非点击了按钮或链接
      if (!event.target.closest('button') && !event.target.closest('a')) {
        this.handleViewDetail(row)
      }
    },
    
    // 切换视图模式
    handleViewChange(view) {
      this.tableView = view
      // 当切换到卡片视图时，可以增加一些限制或加载更多数据
      if (view === 'card' && this.list.length < 8) {
        // 卡片模式下，生成美观的卡片，需要足够的数据
        this.getList()
      }
    },
    
    // 切换详情对话框全屏状态
    toggleDetailFullscreen() {
      this.detailFullscreen = !this.detailFullscreen
    },
    
    // 重置过滤条件
    resetFilter() {
      this.listQuery = {
        page: 1,
        limit: 10,
        keyword: '',
        status: '',
        supplier_id: '',
        start_date: '',
        end_date: ''
      }
      this.dateRange = []
      this.handleFilter()
    },
    
    // 导出当前详情
    handleExportDetail() {
      if (!this.currentDetail || !this.currentDetail.id) {
        this.$message.warning('无可导出的详情')
        return
      }
      
      this.$message({
        message: '导出功能开发中...',
        type: 'info'
      })
    },
    
    // 格式化日期时间
    formatDateTime(datetime) {
      if (!datetime) return '-'
      const date = new Date(datetime)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    },
    
    // 更新统计信息
    updateStatsSummary(data) {
      // 默认的统计数据
      const stats = {
        total: data.length,
        pending: 0,
        approved: 0,
        cancelled: 0
      }
      
      // 计算各个状态的数量
      data.forEach(item => {
        if (item.status === 'pending') stats.pending++
        else if (item.status === 'approved') stats.approved++
        else if (item.status === 'cancelled') stats.cancelled++
      })
      
      this.statsSummary = stats
    },
    
    // 获取入库单列表
    async getList() {
      this.listLoading = true
      try {
        const response = await getStockInList(this.listQuery)
        console.log('原始API响应数据:', response)
        
        // 对数据结构进行适配处理
        const responseData = response.data || {}
        
        // 检查数据结构并适配不同的格式
        let listData = []
        let totalCount = 0
        
        if (responseData.data && Array.isArray(responseData.data)) {
          // 结构是 {data: [...], total: n}
          console.log('使用data字段中的数组')
          listData = responseData.data
          totalCount = responseData.total || 0
        } else if (responseData.items && Array.isArray(responseData.items)) {
          // 结构是 {items: [...], total: n}
          console.log('使用items字段中的数组')
          listData = responseData.items
          totalCount = responseData.total || 0
        } else if (responseData.list && Array.isArray(responseData.list)) {
          // 结构是 {list: [...], total: n}
          console.log('使用list字段中的数组')
          listData = responseData.list
          totalCount = responseData.total || 0
        } else if (Array.isArray(responseData)) {
          // 结构是直接的数组
          console.log('使用直接的响应数组')
          listData = responseData
          totalCount = responseData.length
        } else {
          console.error('无法识别的数据结构:', responseData)
        }
        
        console.log('处理后的列表数据:', listData)
        this.list = listData
        this.total = totalCount
        
        // 更新统计数据
        this.updateStatsSummary(listData || [])
      } catch (error) {
        console.error('获取入库单列表失败:', error)
        
        // 使用受保护的错误处理
        let errorMsg = '获取数据失败'
        if (error) {
          if (error.response && error.response.data && error.response.data.message) {
            errorMsg = error.response.data.message
          } else if (error.message) {
            errorMsg = error.message
          }
        }
        this.$message.error(errorMsg)
      } finally {
        this.listLoading = false
      }
    },
    
    // 获取供应商列表
    async fetchSuppliers() {
      try {
        const { data } = await getAllSuppliers()
        console.log('data',data)
        this.supplierOptions = data.data // 使用getAllSuppliers函数返回的数据格式
      } catch (error) {
        console.error('获取供应商列表失败:', error)
        this.$message.error('获取供应商列表失败')
      }
    },

    // 获取药品列表
    async fetchMedicines() {
      try {
        const { data } = await getMedicineList({ limit: 100 })
        this.medicineOptions = data.data.list
        // 调试药品数据结构
        console.log('药品列表数据:', data.data.list)
        if (data.data.list && data.data.list.length > 0) {
          console.log('第一个药品数据结构:', data.data.list[0])
        }
      } catch (error) {
        console.error('获取药品列表失败:', error)
        this.$message.error('获取药品列表失败')
      }
    },

    // 过滤器相关方法
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    handleDateRangeChange(val) {
      if (val) {
        this.listQuery.start_date = val[0]
        this.listQuery.end_date = val[1]
      } else {
        this.listQuery.start_date = ''
        this.listQuery.end_date = ''
      }
      this.handleFilter()
    },

    // 导出数据
    handleExport() {
      this.$message.info('正在导出入库单数据...')
      // 这里应该调用导出API
      setTimeout(() => {
        this.$message.success('导出成功')
      }, 1500)
    },

    // 查看详情
    async handleViewDetail(row) {
      this.detailLoading = true
      this.detailDialogVisible = true
      this.currentDetail = { ...row } // 先显示基本信息
      this.detailTitle = `入库单详情：${row.code || ''}`

      try {
        const { data } = await getTransactionDetail(row.id)
        this.currentDetail = data
      } catch (error) {
        console.error('获取入库单详情失败:', error)
        this.$message.error('获取入库单详情失败: ' + (error.response?.data?.message || error.message || '服务器错误'))
      } finally {
        this.detailLoading = false
      }
    },

    // 审核入库单
    handleApprove(row) {
      this.approveForm = {
        id: row.id,
        remark: ''
      }
      this.approveDialogVisible = true
    },

    async submitApprove() {
      this.approveLoading = true
      try {
        await approveStockIn(this.approveForm.id, { remark: this.approveForm.remark })
        this.$message.success('审核通过成功')
        this.approveDialogVisible = false
        this.getList()
        if (this.detailDialogVisible) {
          this.handleViewDetail({ id: this.currentDetail.id })
        }
      } catch (error) {
        console.error('审核入库单失败:', error)
        this.$message.error('审核入库单失败')
      }
      this.approveLoading = false
    },

    // 取消入库单
    handleCancel(row) {
      this.cancelForm = {
        id: row.id,
        reason: ''
      }
      this.cancelDialogVisible = true
    },

    async submitCancel() {
      this.$refs.cancelForm.validate(async valid => {
        if (valid) {
          this.cancelLoading = true
          try {
            await cancelStockIn(this.cancelForm.id, { reason: this.cancelForm.reason })
            this.$message.success('取消入库单成功')
            this.cancelDialogVisible = false
            this.getList()
            if (this.detailDialogVisible) {
              this.handleViewDetail({ id: this.currentDetail.id })
            }
          } catch (error) {
            console.error('取消入库单失败:', error)
            this.$message.error('取消入库单失败')
          }
          this.cancelLoading = false
        }
      })
    },

    // 新建入库单
    handleCreateStockIn() {
      this.dialogTitle = '新建入库单'
      this.resetStockInForm()
      this.dialogVisible = true
      // 默认添加一行
      this.handleAddItem()
    },

    resetStockInForm() {
      this.stockInForm = {
        supplier_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        remark: '',
        items: []
      }
    },

    // 添加药品明细项
    handleAddItem() {
      const newItem = {
        medicine_id: '',
        medicine_name: '',
        specification: '',
        unit: '',
        batch_number: '',
        quantity: 1,
        price: 0,
        amount: 0,
        production_date: new Date().toISOString().split('T')[0],
        expiry_date: this.getDefaultExpiryDate(),
        location: ''
      }
      this.stockInForm.items.push(newItem)
    },

    // 移除药品明细项
    removeItem(index) {
      this.stockInForm.items.splice(index, 1)
    },

    // 处理药品选择清除事件
    handleMedicineClear(index) {
      console.log('清除药品选择，行索引:', index)
      
      // 使用Vue的响应式API重置该行的数据
      const clearedItem = {
        medicine_id: '',
        medicine_name: '',
        specification: '',
        unit: '',
        batch_number: '',
        quantity: 1,
        price: 0,
        amount: 0,
        production_date: new Date().toISOString().split('T')[0],
        expiry_date: this.getDefaultExpiryDate(),
        location: ''
      }
      
      console.log('即将更新为空白行:', clearedItem)
      // 使用Vue的$set方法确保响应式更新
      this.$set(this.stockInForm.items, index, clearedItem)
      this.formChanged = true
      console.log('清除后的药品行数据:', this.stockInForm.items[index])
    },
    
    // 选择药品后自动填充信息
    handleMedicineChange(medicineId, index) {
      // 如果是空值，可能是用户手动删除了选择内容，也要处理
      if (!medicineId) {
        this.handleMedicineClear(index)
        return
      }
      
      // 调试打印当前选择的药品ID和索引
      console.log('选择药品ID:', medicineId, '行索引:', index)
      
      // 如果选择了药品，填充药品信息
      const medicine = this.medicineOptions.find(item => item.id === medicineId)
      console.log('找到的药品信息:', medicine)
      
      if (medicine) {
        // 深拷贝当前行数据，保留原有数据
        const currentItem = JSON.parse(JSON.stringify(this.stockInForm.items[index] || {}))
        
        // 创建新的明细行对象
        const updatedItem = {
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          specification: medicine.specification || '',
          unit: medicine.unit || '',
          batch_number: currentItem.batch_number || '',
          quantity: currentItem.quantity || 1,
          price: currentItem.price || 0,
          amount: 0, // 初始化金额，稍后会计算
          production_date: currentItem.production_date || new Date().toISOString().split('T')[0],
          expiry_date: currentItem.expiry_date || this.getDefaultExpiryDate(),
          location: currentItem.location || ''
        }
        
        // 打印更新前和更新后的数据
        console.log('更新前的药品行数据:', this.stockInForm.items[index])
        console.log('即将更新的药品行数据:', updatedItem)
        
        // 将更新后的数据赋给当前行
        this.$set(this.stockInForm.items, index, updatedItem)
        
        // 计算金额
        this.calculateItemAmount(this.stockInForm.items[index])
        this.formChanged = true
        
        // 打印更新后的完整行数据
        console.log('更新后的药品行数据:', this.stockInForm.items[index])
      }
    },

    // 计算单项金额
    calculateItemAmount(item) {
      item.amount = item.price * item.quantity
    },

    // 计算总金额
    calculateTotalAmount() {
      return this.stockInForm.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    },

    // 提交入库单
    submitStockIn() {
      this.$refs.stockInForm.validate(async valid => {
        if (valid) {
          // 检查是否有药品明细
          if (this.stockInForm.items.length === 0) {
            this.$message.warning('请至少添加一种药品')
            return
          }

          // 检查药品明细是否填写完整
          const invalidItem = this.stockInForm.items.find(item => {
            return !item.medicine_id || !item.batch_number || !item.quantity || 
                   !item.price || !item.production_date || !item.expiry_date
          })
          if (invalidItem) {
            this.$message.warning('请完善药品明细信息')
            return
          }
          this.submitLoading = true
          try {
            // 准备提交数据 - 确保数据结构与后端API匹配
            const submitData = {
              supplier_id: this.stockInForm.supplier_id,
              entry_date: this.stockInForm.entry_date,
              remark: this.stockInForm.remark || '',
              items: this.stockInForm.items.map(item => ({
                medicine_id: item.medicine_id,
                medicine_name: item.medicine_name,
                specification: item.specification,
                unit: item.unit,
                batch_number: item.batch_number,
                quantity: item.quantity,
                price: item.price,
                amount: item.amount,
                production_date: item.production_date,
                expiry_date: item.expiry_date,
                location: item.location || ''
              }))
            }

            const response = await createStockIn(submitData)
            console.log("resss",response)
            this.$message.success('入库单创建成功，单号：' + response.data.data.code)
            this.dialogVisible = false
            this.getList()
          } catch (error) {
            console.error('创建入库单失败:', error)
            let errorMsg = '未知错误'
            this.$message.error('创建入库单失败: ' + errorMsg)
          }
          this.submitLoading = false
        }
      })
    },

    // 打印入库单
    handlePrint() {
      this.$message.info('正在准备打印...')
      // 这里应该调用打印功能
      setTimeout(() => {
        this.$message.success('已发送到打印队列')
      }, 1000)
    },

    // 新增功能方法
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
    },
    
    handleBatchImport() {
      this.$confirm('是否从Excel导入药品数据？', '批量导入', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        // 这里可以实现Excel导入功能
        this.$message({
          type: 'info',
          message: '批量导入功能开发中'
        });
      }).catch(() => {});
    },
    
    handleClearItems() {
      if (this.stockInForm.items.length === 0) return;
      
      this.$confirm('确定要清空所有药品明细吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.stockInForm.items = [];
        this.formChanged = true;
        this.$message({
          type: 'success',
          message: '已清空药品明细'
        });
      }).catch(() => {});
    },
    
    getRowClassName({row, rowIndex}) {
      if (!row.medicine_id) return 'warning-row';
      if (!row.batch_number) return 'incomplete-row';
      if (!row.expiry_date) return 'incomplete-row';
      
      // 检查是否有效期临近
      if (row.expiry_date && this.isExpiringWithin30Days(row.expiry_date)) {
        return 'expiring-row';
      }
      
      return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
    },
    
    getTotalQuantity(items) {
      if (!items || items.length === 0) return 0;
      return items.reduce((sum, item) => {
        return sum + (parseInt(item.quantity) || 0);
      }, 0);
    },
    
    getTotalAmount(items) {
      if (!items || items.length === 0) return 0;
      return items.reduce((sum, item) => {
        return sum + (item.amount || 0);
      }, 0);
    },
    
    isExpiringWithin30Days(date) {
      if (!date) return false;
      const expiryDate = new Date(date);
      const today = new Date();
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    },
    
    // 获取默认的药品有效期（当前日期后一年）
    getDefaultExpiryDate() {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      return date.toISOString().split('T')[0];
    },
    
    // 辅助方法
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString()
    },

    formatPrice(price) {
      return parseFloat(price || 0).toFixed(2)
    },

    getStatusType(status) {
      const typeMap = {
        'pending': 'warning',
        'approved': 'success',
        'cancelled': 'danger'
      }
      return typeMap[status] || 'info'
    },

    getStatusText(status) {
      const textMap = {
        'pending': '待审核',
        'approved': '已审核',
        'cancelled': '已取消'
      }
      return textMap[status] || '未知'
    },

    getItemsTooltip(row) {
      if (!row.items || row.items.length === 0) return '无药品明细'
      return row.items.map(item => `${item.medicine_name} x ${item.quantity}`).join('\n')
    },

    getTotalQuantity(items) {
      if (!items || items.length === 0) return 0
      return items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    },

    getDefaultExpiryDate() {
      const date = new Date()
      date.setFullYear(date.getFullYear() + 2) // 默认2年有效期
      return date.toISOString().split('T')[0]
    },

    isExpired(date) {
      if (!date) return false
      return new Date(date) < new Date()
    },

    isExpiringWithin30Days(date) {
      if (!date) return false
      const expiryDate = new Date(date)
      const today = new Date()
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(today.getDate() + 30)
      
      return expiryDate > today && expiryDate <= thirtyDaysLater
    },

    // ================ 审核交易单相关方法 ================
    
    // 打开审核对话框
    handleApprove(row) {
      if (!row || !row.id) {
        this.$message.error('交易单信息不完整')
        return
      }
      
      if (row.status !== 'pending') {
        this.$message.warning('只能审核处于待审核状态的交易单')
        return
      }
      
      this.currentTransaction = row
      this.approveDialogVisible = true
      this.approveForm.remark = ''
    },
    
    // 重置审核表单
    resetApproveForm() {
      this.approveForm = {
        remark: ''
      }
      this.currentTransaction = null
    },
    
    // 提交审核
    async submitApprove() {
      if (!this.currentTransaction || !this.currentTransaction.id) {
        this.$message.error('交易单信息不完整')
        return
      }
      
      this.submitLoading = true
      
      try {
        // 从本地token中解析用户信息
        const userId = getCurrentUserId();
        const currentUser = getCurrentUser();
        
        if (!userId) {
          this.$message.error('获取用户信息失败，请重新登录');
          return;
        }
        
        const data = {
          remark: this.approveForm.remark,
          user_id: userId,  // 从解析的token中获取用户ID
          username: currentUser?.username,  // 可选字段，如果有的话
          realname: currentUser?.realname || currentUser?.name  // 可选字段，如果有的话
        }
        
        console.log('提交审核信息:', data)
        const response = await approveTransaction(this.currentTransaction.id, data)
        
        this.$message.success('交易单审核成功')
        this.approveDialogVisible = false
        this.getList() // 刷新列表
        
        // 如果当前正在查看此交易单的详情，更新详情信息
        if (this.detailDialogVisible && this.currentDetail.id === this.currentTransaction.id) {
          this.handleViewDetail(this.currentTransaction)
        }
      } catch (error) {
    console.error('审核交易单失败:', error)
    let errorMsg = '服务器错误'
    if (error) {
      if (error.response && error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message
      } else if (error.message) {
        errorMsg = error.message
      }
    }
    this.$message.error('审核交易单失败: ' + errorMsg)
  } finally {
        this.submitLoading = false
      }
    },
    
    // ================ 取消交易单相关方法 ================
    
    // 打开取消对话框
    handleCancel(row) {
      if (!row || !row.id) {
        this.$message.error('交易单信息不完整')
        return
      }
      
      if (row.status !== 'pending') {
        this.$message.warning('只能取消处于待审核状态的交易单')
        return
      }
      
      this.currentTransaction = row
      this.cancelDialogVisible = true
      this.cancelForm.reason = ''
    },
    
    // 重置取消表单
    resetCancelForm() {
      this.cancelForm = {
        reason: ''
      }
      this.currentTransaction = null
    },
    
    // 提交取消
    async submitCancel() {
      // 验证取消原因不能为空
      if (!this.cancelForm.reason.trim()) {
        this.$message.warning('请输入取消原因')
        return
      }
      
      if (!this.currentTransaction || !this.currentTransaction.id) {
        this.$message.error('交易单信息不完整')
        return
      }
      
      this.submitLoading = true
      
      try {
        // 从本地token中解析用户信息
        const userId = getCurrentUserId();
        const currentUser = getCurrentUser();
        
        if (!userId) {
          this.$message.error('获取用户信息失败，请重新登录');
          return;
        }
        
        const data = {
          reason: this.cancelForm.reason,
          user_id: userId,  // 从解析的token中获取用户ID
          username: currentUser?.username,  // 可选字段，如果有的话
          realname: currentUser?.realname || currentUser?.name  // 可选字段，如果有的话
        }
        
        console.log('提交取消信息:', data)
        const response = await cancelTransaction(this.currentTransaction.id, data)
        
        this.$message.success('交易单取消成功')
        this.cancelDialogVisible = false
        this.getList() // 刷新列表
        
        // 如果当前正在查看此交易单的详情，更新详情信息
        if (this.detailDialogVisible && this.currentDetail.id === this.currentTransaction.id) {
          this.handleViewDetail(this.currentTransaction)
        }
      } catch (error) {
        console.error('取消交易单失败:', error)
        let errorMsg = '服务器错误'
        if (error instanceof Error) {
          errorMsg = error.message
        } else if (error.response && error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message
        }
        this.$message.error('取消交易单失败: ' + errorMsg)
      } finally {
        this.submitLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* 页面布局 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
}

/* 入库单对话框样式 */
.stock-in-dialog {
  .dialog-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 15px;
  }
  
  .form-divider {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #EBEEF5;
    font-weight: bold;
    color: #409EFF;
    
    .divider-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .table-summary {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 15px;
    padding: 10px 15px;
    background-color: #f8f8f8;
    border-radius: 4px;
    
    .summary-item {
      margin-left: 20px;
      
      .label {
        color: #606266;
        margin-right: 5px;
      }
      
      .value {
        font-weight: bold;
        color: #303133;
      }
      
      .highlight {
        color: #f56c6c;
      }
    }
  }
  
  .form-summary {
    flex: 1;
    text-align: left;
    
    .summary-text {
      font-size: 14px;
      color: #606266;
      
      b {
        font-weight: bold;
        color: #303133;
      }
      
      .total-amount {
        color: #f56c6c;
        font-size: 16px;
      }
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  /* 表格行样式 */
  .warning-row {
    background-color: #fdf6ec;
  }
  
  .incomplete-row {
    background-color: #f8f8f8;
  }
  
  .expiring-row {
    background-color: #fef0f0;
  }
  
  .even-row {
    background-color: #fafafa;
  }
  
  /* 新增UI元素样式 */
  .dialog-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 15px;
  }

  .form-divider {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 20px 0;
    border-bottom: 1px solid #EBEEF5;
    padding-bottom: 10px;
  }

  .form-divider span {
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }

  .divider-actions {
    display: flex;
    gap: 10px;
  }

  .table-summary {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 15px;
    background-color: #f8f8f8;
    padding: 10px;
    border-radius: 4px;
  }

  .summary-item {
    margin-left: 20px;
    display: flex;
    align-items: center;
  }

  .summary-item .label {
    margin-right: 5px;
    color: #606266;
  }

  .summary-item .value {
    font-weight: 600;
    color: #303133;
  }

  .summary-item .value.highlight {
    color: #f56c6c;
    font-size: 16px;
  }
  
  /* 数量输入框样式 */
  .quantity-input {
    width: 100%;
  }
  
  /* 金额样式 */
  .amount {
    color: #f56c6c;
    font-weight: bold;
  }
}

.page-title {
  font-size: 22px;
  color: #303133;
  margin: 0;
  font-weight: 600;
}

.filter-container {
  padding-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* 入库单列表 */
.link-type {
  color: #409EFF;
  cursor: pointer;
}

.link-type:hover {
  text-decoration: underline;
}

/* 详情对话框 */
.detail-header {
  display: flex;
  flex-wrap: wrap;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.header-item {
  margin-right: 30px;
  margin-bottom: 10px;
  min-width: 200px;
}

.header-item.full-width {
  width: 100%;
  margin-top: 10px;
}

.header-item .label {
  color: #606266;
  margin-right: 8px;
}

.header-item .value {
  font-weight: 500;
  color: #303133;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 15px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

.detail-footer {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.total-info {
  text-align: right;
}

.total-info .label {
  color: #606266;
  margin-right: 8px;
}

.total-info .value {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.detail-actions {
  margin-top: 20px;
  text-align: right;
}

/* 表单样式 */
.form-divider {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
  font-weight: 600;
  color: #303133;
}

.form-footer {
  margin-top: 20px;
  text-align: right;
}

.total-amount {
  font-size: 14px;
  color: #606266;
}

.total-amount .amount {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
  margin-left: 8px;
}

/* 状态样式 */
.expiring-soon {
  color: #e6a23c;
  font-weight: bold;
}

.expired {
  color: #f56c6c;
  font-weight: bold;
}

/* 分页容器 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 表格展开和药品明细样式 */
.table-expand {
  font-size: 0;
  padding: 20px;
}

.table-expand label {
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.table-expand .el-form-item {
  margin-right: 0;
  margin-bottom: 15px;
  width: 33%;
}

.table-expand .full-width-item {
  width: 100%;
}

.detail-medicine-list {
  width: 100%;
  margin-top: 15px;
}

/* 状态行样式 */
.pending-row {
  background-color: #fcf8e3 !important;
}

.approved-row {
  background-color: #f1f9ee !important;
}

.cancelled-row {
  background-color: #f9f0f0 !important;
}

/* 药品数量标签 */
.medicine-count-text {
  font-size: 12px;
  color: #409EFF;
  cursor: pointer;
}

/* 金额文本 */
.amount-text {
  color: #f56c6c;
  font-weight: 500;
}

/* 表格中的popover标题 */
.popover-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #EBEEF5;
}

/* 表格容器滚动样式 */
.table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
}

.table-card {
  margin-top: 20px;
}

.table-card .el-card__body {
  padding: 0;
  overflow: visible;
}

/* 强制启用水平滚动条 */
.table-container::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-track {
  background: #f5f7fa;
}

/* 浏览器兼容性样式 */
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.stock-in-dialog {
  .el-dialog__body {
    padding: 20px 30px;
  }
  
  .el-form-item {
    margin-bottom: 22px;
  }
  
  .el-table {
    .el-input-number {
      width: 100%;
      
      .el-input__inner {
        text-align: left;
        padding-left: 8px;
        padding-right: 8px;
        height: 32px;
        line-height: 32px;
      }
      
      &.quantity-input {
        .el-input__inner {
          padding-right: 30px;
        }
      }
    }
    
    .el-select, .el-input {
      width: 100%;
      
      .el-input__inner {
        padding-left: 8px;
        padding-right: 8px;
        height: 32px;
        line-height: 32px;
      }
    }
    
    .amount {
      color: #f56c6c;
      font-weight: 600;
    }
    
    .el-date-editor {
      width: 100%;
      
      .el-input__inner {
        padding-left: 8px;
        padding-right: 8px;
        height: 32px;
        line-height: 32px;
      }
    }
  }
  
  .form-divider {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #EBEEF5;
    font-weight: 600;
    color: #303133;
    
    .el-button {
      padding: 7px 15px;
    }
  }
  
  .form-footer {
    margin-top: 20px;
    text-align: right;
    padding: 10px 0;
    border-top: 1px solid #EBEEF5;
    
    .total-amount {
      font-size: 14px;
      color: #606266;
      
      .amount {
        font-size: 18px;
        font-weight: 600;
        color: #f56c6c;
        margin-left: 8px;
      }
    }
  }
  
  .dialog-footer {
    padding: 20px 0 0;
    text-align: right;
  }
}
</style>
