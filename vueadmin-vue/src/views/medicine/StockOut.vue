<template>
  <div class="app-container">
    <!-- 页面标题和摘要信息 -->
    <el-card class="summary-card" shadow="hover">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title"><i class="el-icon-goods title-icon"></i> 药品出库管理</h2>
          <div class="page-subtitle">管理药品的出库记录、审核和查询</div>
        </div>
        <div class="header-actions">
          <el-button type="primary" icon="el-icon-plus" @click="handleCreateStockOut">
            新建出库单
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
              <div class="data-title">全部出库单</div>
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
            placeholder="出库单号/药品名称"
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
            placeholder="出库状态"
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
        
        <el-form-item label="出库日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            align="right"
            unlink-panels
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            :picker-options="pickerOptions"
            style="width: 350px"
            @change="handleDateRangeChange"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>
          <el-button plain icon="el-icon-delete" @click="resetFilter">清除</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 出库单列表 -->
    <el-card class="table-card" shadow="hover" style="margin-top: 20px;">
      <div slot="header" class="table-header">
        <div class="table-title">
          <i class="el-icon-tickets"></i> 出库单列表
        </div>
        <div class="table-options">
          <el-radio-group v-model="tableView" size="small" @change="handleViewChange">
            <el-radio-button label="table"><i class="el-icon-tickets"></i> 表格</el-radio-button>
            <el-radio-button label="card"><i class="el-icon-menu"></i> 卡片</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 表格视图 -->
      <div v-if="tableView === 'table'" class="table-container" style="overflow: visible; min-height: 500px;">
        <el-table
          v-loading="listLoading"
          :data="list"
          border
          stripe
          highlight-current-row
          style="width: 100%; height: auto !important;"
          :row-class-name="getRowClassName"
          @row-click="onRowClick"
          size="small"
          :header-cell-style="{background:'#f5f7fa', color:'#606266'}"
        >
          <!-- 展开详情列 -->
          <el-table-column type="expand" width="50">
            <template slot-scope="{row}">
              <el-form label-position="left" inline class="table-expand">
                <el-form-item label="出库单号">
                  <span>{{ row.code }}</span>
                </el-form-item>
                <el-form-item label="出库日期">
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
                        <span>¥{{ formatPrice(scope.row.amount) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-form>
            </template>
          </el-table-column>
          
          <!-- 固定左侧列 -->
          <el-table-column label="出库单号" prop="code" align="center" width="150" fixed="left">
            <template slot-scope="{row}">
              <el-link type="primary" @click.stop="handleView(row)">{{ row.code }}</el-link>
            </template>
          </el-table-column>
          
          <el-table-column label="出库日期" width="100" align="center">
            <template slot-scope="{row}">
              <span>{{ formatDate(row.entry_date) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="部门" prop="department_name" min-width="100" show-overflow-tooltip />
          
          <el-table-column label="经办人" prop="operator_name" width="90" align="center" />

          <el-table-column label="药品种类" width="90" align="center">
            <template slot-scope="{row}">
              <span>{{ row.items ? row.items.length : 0 }}种</span>
            </template>
          </el-table-column>
          
          <el-table-column label="总金额" width="100" align="right">
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
          
          <el-table-column label="创建时间" width="150" align="center">
            <template slot-scope="{row}">
              <span>{{ formatDateTime(row.createdAt, 'YYYY-MM-DD HH:mm') }}</span>
            </template>
          </el-table-column>
          
          <!-- 固定右侧列 -->
          <el-table-column label="操作" align="center" width="90" fixed="right">
            <template slot-scope="{row}">
              <el-dropdown @command="(command) => handleCommand(command, row)" trigger="click" size="mini">
                <el-button size="mini" type="primary">
                  操作<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="view"><i class="el-icon-view"></i> 查看详情</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'pending'" command="approve"><i class="el-icon-check"></i> 审核出库</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'pending'" command="cancel"><i class="el-icon-close"></i> 取消出库</el-dropdown-item>
                  <el-dropdown-item command="print"><i class="el-icon-printer"></i> 打印出库单</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 卡片视图 -->
      <div v-else class="card-view-container">
        <el-empty v-if="list.length === 0" description="没有出库单记录"></el-empty>
        <div v-else class="card-grid">
          <el-card 
            v-for="(item, index) in list" 
            :key="index" 
            shadow="hover" 
            :body-style="{ padding: '0px' }" 
            :class="getCardClass(item)"
          >
            <div class="stock-card-header">
              <el-tag :type="getStatusType(item.status)" effect="dark" size="small">
                {{ getStatusText(item.status) }}
              </el-tag>
              <span class="stock-card-code">{{ item.code }}</span>
            </div>
            <div class="stock-card-body">
              <div class="stock-card-item">
                <span class="label">出库日期:</span>
                <span class="value">{{ formatDate(item.entry_date) }}</span>
              </div>
              <div class="stock-card-item" v-if="item.department_name">
                <span class="label">部门:</span>
                <span class="value" :title="item.department_name">{{ item.department_name }}</span>
              </div>
              <div class="stock-card-item">
                <span class="label">经办人:</span>
                <span class="value">{{ item.operator_name || '-' }}</span>
              </div>
              <div class="stock-card-item">
                <span class="label">药品数量：</span>
                <span class="value">{{ item.items ? item.items.length : 0 }}种</span>
              </div>
              <div class="stock-card-item">
                <span class="label">总金额：</span>
                <span class="value amount-text">¥{{ formatPrice(item.total_amount) }}</span>
              </div>
              <div class="stock-card-item" v-if="item.createdAt">
                <span class="label">创建时间：</span>
                <span class="value">{{ formatDateTime(item.createdAt, 'YYYY-MM-DD HH:mm') }}</span>
              </div>
            </div>
            <div class="stock-card-footer">
              <el-button type="text" icon="el-icon-view" @click="handleView(item)">详情</el-button>
              <el-button v-if="item.status === 'pending'" type="text" icon="el-icon-check" @click="handleApprove(item)">审核</el-button>
              <el-button v-if="item.status === 'pending'" type="text" icon="el-icon-close" @click="handleCancel(item)">取消</el-button>
            </div>
          </el-card>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-container" style="padding: 10px 20px; border-top: 1px solid #EBEEF5;">
        <pagination
          v-show="total > 0"
          :total="total"
          :page.sync="listQuery.page"
          :limit.sync="listQuery.limit"
          @pagination="getList"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      :title="'出库单详情 - ' + (detailData.code || '')"
      :visible.sync="detailVisible"
      :fullscreen="detailFullscreen"
      :class="{'detail-dialog-fullscreen': detailFullscreen}"
      width="70%"
      top="5vh"
      append-to-body
    >
      <div slot="title" class="dialog-title-container">
        <span>出库单详情 - {{ detailData.outboundNo || '' }}</span>
        <div class="dialog-title-tools">
          <i 
            :class="[detailFullscreen ? 'el-icon-close' : 'el-icon-full-screen']"
            class="fullscreen-btn"
            @click="toggleDetailFullscreen"
          ></i>
        </div>
      </div>
      
      <el-tabs v-model="detailActiveTab" type="border-card">
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-info-item">
                <span class="detail-info-label">出库单号：</span>
                <span class="detail-info-value">{{ detailData.outboundNo || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-info-item">
                <span class="detail-info-label">出库日期：</span>
                <span class="detail-info-value">{{ formatDate(detailData.outboundDate) || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-info-item">
                <span class="detail-info-label">状态：</span>
                <el-tag :type="getStatusType(detailData.status)" effect="plain" size="small">
                  {{ getStatusText(detailData.status) }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-info-item">
                <span class="detail-info-label">经办人：</span>
                <span class="detail-info-value">{{ detailData.operator || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="16">
              <div class="detail-info-item">
                <span class="detail-info-label">备注：</span>
                <span class="detail-info-value">{{ detailData.remark || '无' }}</span>
              </div>
            </el-col>
          </el-row>
          
          <div class="detail-divider"></div>
          
          <div class="detail-title">出库药品明细</div>
          <el-table 
            :data="detailData.items || []" 
            border 
            stripe 
            size="small"
            :header-cell-style="{background:'#f5f7fa', color:'#606266'}"
          >
            <el-table-column type="index" width="50" label="#" align="center"></el-table-column>
            <el-table-column prop="medicineName" label="药品名称" min-width="150"></el-table-column>
            <el-table-column prop="specification" label="规格" width="120"></el-table-column>
            <el-table-column prop="batchNumber" label="批号" width="100"></el-table-column>
            <el-table-column label="数量" width="80" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.quantity }}{{ scope.row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生产日期" width="100" align="center">
              <template slot-scope="scope">
                <span>{{ formatDate(scope.row.productionDate) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="有效期至" width="100" align="center">
              <template slot-scope="scope">
                <span :class="{ 'expiring-soon': isExpiringWithin30Days(scope.row.expiryDate), 'expired': isExpired(scope.row.expiryDate) }">
                  {{ formatDate(scope.row.expiryDate) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="存放位置" width="120"></el-table-column>
          </el-table>
        </el-tab-pane>
        
        <el-tab-pane label="操作历史" name="logs">
          <div class="detail-logs">
            <div v-if="!detailData.logs || detailData.logs.length === 0" class="no-data">
              <el-empty description="暂无操作记录"></el-empty>
            </div>
            <el-timeline v-else>
              <el-timeline-item
                v-for="(log, index) in detailData.logs"
                :key="index"
                :timestamp="formatDateTime(log.operateTime)"
                :type="log.operateType === 'approve' ? 'success' : (log.operateType === 'cancel' ? 'danger' : 'primary')"
              >
                <div class="timeline-title">{{ log.operateType === 'approve' ? '审核' : (log.operateType === 'cancel' ? '取消' : '创建') }}</div>
                <div class="timeline-content">
                  <div>操作人：{{ log.operateUser }}</div>
                  <div v-if="log.remark">备注：{{ log.remark }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关 闭</el-button>
        <el-button type="primary" @click="handleExportDetail">导出详情</el-button>
        <el-button v-if="detailData.status === 'pending'" type="success" @click="handleApprove(detailData)">审核通过</el-button>
        <el-button v-if="detailData.status === 'pending'" type="danger" @click="handleCancel(detailData)">取消出库</el-button>
      </div>
    </el-dialog>

    <!-- 出库单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="1000px"
      :close-on-click-modal="false"
      @close="resetStockOutForm"
      custom-class="stock-out-dialog"
    >
      <el-form ref="stockOutForm" :model="stockOutForm" :rules="stockOutRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出库日期" prop="outbound_date">
              <el-date-picker
                v-model="stockOutForm.outbound_date"
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
          <el-col :span="12">
            <el-form-item label="经办人" prop="operator">
              <el-input v-model="stockOutForm.operator" placeholder="请输入经办人姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="stockOutForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>

        <div class="form-divider">
          <span>药品明细</span>
          <el-button type="primary" icon="el-icon-plus" @click="handleAddItem" size="small">添加药品</el-button>
        </div>

        <div class="table-container" style="overflow-x: auto; margin-bottom: 20px;">
          <el-table
            :data="stockOutForm.items"
            border
            style="width: 100%; min-width: 950px;"
            :max-height="400"
            highlight-current-row
            size="small"
          >
          <el-table-column label="药品名称" width="180">
            <template slot-scope="{row, $index}">
              <el-select
                v-model="row.medicine_id"
                filterable
                remote
                placeholder="选择药品"
                style="width: 100%"
                :remote-method="getMedicineList"
                :loading="loading"
                @change="(val) => handleMedicineChange(val, $index)"
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
          
          <el-table-column label="规格" prop="specification" width="110" />
          
          <el-table-column label="批号" width="120">
            <template slot-scope="{row}">
              <el-select
                v-model="row.batch_number"
                placeholder="选择批号"
                style="width: 100%"
                @change="handleBatchNumberChange(row)"
                :clearable="true"
                size="small"
              >
                <el-option
                  v-for="item in getBatchOptions(row.medicine_id)"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </template>
          </el-table-column>
          
          <el-table-column label="数量" width="100">
            <template slot-scope="{row}">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                :max="getMaxQuantity(row)"
                :precision="0"
                size="small"
                style="width: 100%"
                @change="validateQuantity(row)"
                :disabled="!row.medicine_id || !row.batch_number"
                controls-position="right"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="单位" prop="unit" width="80" />
          
          <el-table-column label="生产日期" width="100">
            <template slot-scope="{row}">
              <span>{{ formatDate(row.production_date) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="有效期至" width="100">
            <template slot-scope="{row}">
              <span :class="{ 'expiring-soon': isExpiringWithin30Days(row.expiry_date), 'expired': isExpired(row.expiry_date) }">
                {{ formatDate(row.expiry_date) }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column label="存放位置" width="100">
            <template slot-scope="{row}">
              <span>{{ row.location }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="60" align="center" fixed="right">
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
        </div>
        <div class="form-footer">
          <div class="total-info">
            <span>总数量: </span>
            <span class="value">{{ getTotalQuantity(stockOutForm.items) }}件</span>
          </div>
        </div>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitStockOut" :loading="submitLoading">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { createStockOut, updateStockOut } from '@/api/medicine'
import { getMedicineList, getStockList, getStockOutList } from '@/api/medicineStock'
import Pagination from '@/components/Pagination'

export default {
  name: 'StockOut',
  components: { Pagination },
  data() {
    return {
      // 新UI相关属性
      tableView: 'table', // 表格视图类型：'table'或'card'
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
      
      // 详情对话框相关
      detailVisible: false,
      detailFullscreen: false,
      detailActiveTab: 'basic',
      detailData: {},

      // 列表和分页
      list: [],
      total: 0,
      listLoading: false,
      listQuery: {
        page: 1,
        limit: 10,
        keyword: '',
        status: '',
        department: '', // 部门过滤
        start_date: '',
        end_date: ''
      },
      dateRange: [],
      dialogVisible: false,
      dialogTitle: '新建出库单',
      submitLoading: false,
      stockOutForm: {
        outbound_date: new Date().toISOString().split('T')[0],
        operator: '',
        remark: '',
        items: []
      },
      stockOutRules: {
        outbound_date: [{ required: true, message: '请选择出库日期', trigger: 'change' }],
        operator: [{ required: true, message: '请输入经办人', trigger: 'blur' }]
      },
      medicineOptions: [],
      stockList: [],
      loading: false
    }
  },
  created() {
    this.getList()
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
          this.handleView(row)
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
    
    // 重置过滤条件
    resetFilter() {
      this.listQuery = {
        page: 1,
        limit: 10,
        keyword: '',
        status: '',
        department: '',
        start_date: '',
        end_date: ''
      }
      this.dateRange = []
      this.handleFilter()
    },
    
    // 处理日期范围变化
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
        this.handleView(row)
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
    
    // 导出数据
    handleExport() {
      this.$message.info('正在导出出库单数据...')
      // 这里应该调用导出API
      setTimeout(() => {
        this.$message.success('导出成功')
      }, 1500)
    },
    
    // 打印列表
    handlePrint() {
      this.$message.info('正在准备打印...')
      // 这里应该调用打印功能
      setTimeout(() => {
        window.print()
      }, 1000)
    },
    
    // 批量导入
    handleBatchImport() {
      this.$message.info('批量导入功能开发中...')
    },
    
    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        'pending': 'warning',
        'approved': 'success',
        'cancelled': 'danger'
      }
      return typeMap[status] || 'info'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'pending': '待审核',
        'approved': '已审核',
        'cancelled': '已取消'
      }
      return textMap[status] || '未知'
    },
    
    // 格式化价格
    formatPrice(price) {
      if (!price) return '0.00'
      return parseFloat(price).toFixed(2)
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      if (isNaN(d.getTime())) return date
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    
    // 格式化日期时间
    formatDateTime(datetime, format = 'YYYY-MM-DD HH:mm:ss') {
      if (!datetime) return '-'
      const date = new Date(datetime)
      if (isNaN(date.getTime())) return datetime
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
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
    async getList() {
      this.listLoading = true
      try {
        // 构建查询参数
        const params = { ...this.listQuery }
        
        // 日期格式化
        if (params.start_date) {
          params.start_date = this.formatDateTime(params.start_date, 'YYYY-MM-DD')
        }
        if (params.end_date) {
          params.end_date = this.formatDateTime(params.end_date, 'YYYY-MM-DD 23:59:59')
        }
        
        const { data } = await getStockOutList(params)
        
        // 处理响应数据
        if (data.items && Array.isArray(data.items)) {
          this.list = data.items
          this.total = data.total || data.items.length
          // 更新统计信息
          this.updateStatsSummary(this.list)
        } else if (Array.isArray(data)) {
          // 兼容不同的API响应格式
          this.list = data
          this.total = data.length
          // 更新统计信息
          this.updateStatsSummary(this.list)
        } else {
          this.list = []
          this.total = 0
          this.$message.warning('返回数据格式不正确')
        }
      } catch (error) {
        console.error('获取出库列表失败:', error)
        this.$message.error('获取出库列表失败')
      }
      this.listLoading = false
    },
    
    // 格式化日期时间
    formatDateTime(date, format = 'YYYY-MM-DD HH:mm') {
      if (!date) return ''
      const d = new Date(date)
      const year = d.getFullYear()
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const day = d.getDate().toString().padStart(2, '0')
      const hours = d.getHours().toString().padStart(2, '0')
      const minutes = d.getMinutes().toString().padStart(2, '0')
      const seconds = d.getSeconds().toString().padStart(2, '0')
      
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
    },
    
    // 查看出库单详情
    handleView(row) {
      // 打开详情对话框，传入当前行数据
      this.detailData = { ...row }
      this.detailActiveTab = 'basic' // 默认打开基本信息标签
      this.detailVisible = true
    },
    
    // 切换详情对话框全屏模式
    toggleDetailFullscreen() {
      this.detailFullscreen = !this.detailFullscreen
    },
    
    // 处理导出详情
    handleExportDetail() {
      this.$message.info(`正在导出出库单详情: ${this.detailData.id || this.detailData.transaction_id}`)
      // TODO: 实现导出详情的逻辑
      setTimeout(() => {
        this.$message.success('导出成功')
      }, 1500)
    },
    
    // 取消出库单
    handleCancel(row) {
      this.$confirm('确认取消该出库单？此操作不可逆!', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        try {
          await updateStockOut({ ...row, status: 'cancelled' })
          this.$message.success('取消成功')
          this.getList()
        } catch (error) {
          console.error('取消失败:', error)
          this.$message.error('取消失败')
        }
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleCreateStockOut() {
      this.dialogTitle = '新建出库单'
      this.dialogVisible = true
      this.resetStockOutForm()
    },
    async getMedicineList(query) {
      if (query !== '') {
        this.loading = true
        try {
          const { data } = await getMedicineList({ keyword: query })
          this.medicineOptions = data
        } catch (error) {
          console.error('获取药品列表失败:', error)
        }
        this.loading = false
      }
    },
    async handleMedicineChange(medicineId, index) {
      const medicine = this.medicineOptions.find(item => item.id === medicineId)
      if (medicine) {
        this.stockOutForm.items[index] = {
          ...this.stockOutForm.items[index],
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          specification: medicine.specification,
          unit: medicine.unit
        }
        
        // 获取药品库存信息
        try {
          const { data } = await getStockList({ medicine_id: medicine.id })
          this.stockList = data.items
        } catch (error) {
          console.error('获取药品库存失败:', error)
          this.$message.error('获取药品库存失败')
        }
      }
    },
    getBatchOptions(medicineId) {
      if (!medicineId) return []
      const stock = this.stockList.find(item => item.medicine_id === medicineId)
      return stock ? stock.batch_numbers : []
    },
    getMaxQuantity(row) {
      if (!row.medicine_id || !row.batch_number) return 0
      const stock = this.stockList.find(item => 
        item.medicine_id === row.medicine_id && 
        item.batch_number === row.batch_number
      )
      return stock ? stock.quantity : 0
    },
    validateQuantity(row) {
      const maxQuantity = this.getMaxQuantity(row)
      if (row.quantity > maxQuantity) {
        this.$message.warning(`超出库存数量，当前库存: ${maxQuantity}`)
        row.quantity = maxQuantity
      }
    },
    handleBatchNumberChange(row) {
      const stock = this.stockList.find(item => 
        item.medicine_id === row.medicine_id && 
        item.batch_number === row.batch_number
      )
      if (stock) {
        row.production_date = stock.production_date
        row.expiry_date = stock.expiry_date
        row.location = stock.location
        row.stock_quantity = stock.quantity
        this.validateQuantity(row)
      }
    },
    submitStockOut() {
      this.$refs.stockOutForm.validate(async valid => {
        if (valid) {
          // 检查是否有药品明细
          if (this.stockOutForm.items.length === 0) {
            this.$message.warning('请至少添加一种药品')
            return
          }

          // 检查药品明细是否填写完整
          const invalidItem = this.stockOutForm.items.find(item => {
            return !item.medicine_id || !item.batch_number || !item.quantity
          })

          if (invalidItem) {
            this.$message.warning('请完善药品明细信息')
            return
          }

          this.submitLoading = true
          try {
            await createStockOut(this.stockOutForm)
            this.$message.success('出库单创建成功')
            this.dialogVisible = false
            this.getList()
          } catch (error) {
            console.error('创建出库单失败:', error)
            this.$message.error('创建出库单失败')
          }
          this.submitLoading = false
        }
      })
    },
    resetStockOutForm() {
      this.stockOutForm = {
        outbound_date: new Date().toISOString().split('T')[0],
        operator: '',
        remark: '',
        items: []
      }
    },
    handleAddItem() {
      const newItem = {
        medicine_id: '',
        medicine_name: '',
        specification: '',
        unit: '',
        batch_number: '',
        quantity: 1,
        production_date: '',
        expiry_date: '',
        location: '',
        stock_quantity: 0
      }
      this.stockOutForm.items.push(newItem)
    },
    removeItem(index) {
      this.stockOutForm.items.splice(index, 1)
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString()
    },
    getTotalQuantity(items) {
      if (!items || items.length === 0) return 0
      return items.reduce((sum, item) => sum + (item.quantity || 0), 0)
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
    handleApprove(row) {
      this.$confirm('确认审核通过该出库单?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        try {
          await updateStockOut({ ...row, status: 'approved' })
          this.$message.success('审核成功')
          this.getList()
        } catch (error) {
          console.error('审核失败:', error)
        }
      })
    },
    handleCancel(row) {
      this.$confirm('确认取消该出库单?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        try {
          await updateStockOut({ ...row, status: 'cancelled' })
          this.$message.success('取消成功')
          this.getList()
        } catch (error) {
          console.error('取消失败:', error)
        }
      })
    },
    handleView(row) {
      this.dialogTitle = '查看出库单'
      this.dialogVisible = true
      this.stockOutForm = { ...row }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  
  .table-card {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }
  
  .card-view {
    overflow: auto;
    padding: 10px 0;
  }
}

.dashboard-container {
  padding: 20px;
}

.filter-container {
  padding-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 10px;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
  margin-right: 10px;
  margin-bottom: 10px;
}

.page-header {
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
  padding-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

/* 数据摘要卡片样式 */
.data-summary {
  margin-top: 20px;
}

.data-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
}

.data-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
}

.data-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #ecf5ff;
  color: #409EFF;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-right: 15px;
}

.data-card.pending .data-icon {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.data-card.approved .data-icon {
  background-color: #f0f9eb;
  color: #67c23a;
}

.data-card.cancelled .data-icon {
  background-color: #fef0f0;
  color: #f56c6c;
}

.data-info {
  flex: 1;
}

.data-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.data-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

/* 表格标题样式 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-options {
  display: flex;
  align-items: center;
}

.table-card {
  margin-top: 20px;
  box-sizing: border-box;
  width: 100%;
  height: auto;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-options {
  display: flex;
  align-items: center;
}

.table-card {
  margin-top: 20px;
}

.table-container {
  width: 100%;
  /* 让表格内容完全展开，确保最小高度 */
  overflow: visible;
  height: auto;
  min-height: 500px;
}

/* 重设表格的样式以确保其能正确显示 */
.el-table {
  width: 100%;
  height: auto !important;
  max-height: none !important;
}

/* 表格单元格内容过长时显示省略号 */
.el-table .cell {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* 确保表格内的所有内容都能正常显示 */
.el-table__body-wrapper {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

.el-table__header-wrapper {
  overflow: visible !important;
}

/* 确保表格行高正常 */
.el-table__row {
  height: auto !important;
}



/* 状态行颜色 */
.pending-row {
  background-color: #fdf6ec !important;
}

.approved-row {
  background-color: #f0f9eb !important;
}

.cancelled-row {
  background-color: #fef0f0 !important;
}

/* 卡片视图样式 */
.card-view-container {
  width: 100%;
  padding: 10px 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.stock-card {
  height: 100%;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.stock-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.pending-card {
  border-left: 4px solid #e6a23c;
}

.approved-card {
  border-left: 4px solid #67c23a;
}

.cancelled-card {
  border-left: 4px solid #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  margin-top: 10px;
}

.card-footer {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-status {
  position: absolute;
  top: 10px;
  right: 10px;
}

/* 详情对话框样式 */
.detail-dialog-fullscreen {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  height: 100%;
  overflow: hidden;
}

.detail-dialog-fullscreen .el-dialog__body {
  height: calc(100vh - 108px);
  overflow-y: auto;
}

.detail-dialog-fullscreen .el-dialog__header {
  padding: 15px 20px;
}

.fullscreen-btn {
  color: #606266;
  margin-right: 10px;
  cursor: pointer;
  font-size: 16px;
}

.fullscreen-btn:hover {
  color: #409EFF;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

.detail-info-item {
  margin-bottom: 10px;
}

.detail-info-label {
  font-weight: 600;
  color: #606266;
}

.detail-info-value {
  color: #303133;
}

.medicine-list-item {
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.medicine-list-item:last-child {
  border-bottom: none;
}

.expiring-soon {
  color: #e6a23c;
  font-weight: bold;
}

.expired {
  color: #f56c6c;
  font-weight: bold;
}

.form-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #EBEEF5;
}

.total-info {
  font-size: 14px;
  color: #606266;
}

.total-info .value {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
  margin-left: 8px;
}

.table-expand-detail {
  margin-left: 20px;
  margin-right: 20px;
  padding: 10px 0;
}

.table-expand-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.medicine-detail-list {
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}

/* 详情对话框额外样式 */
.dialog-title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-title-tools {
  display: flex;
  align-items: center;
}

.detail-divider {
  height: 1px;
  background-color: #ebeef5;
  margin: 20px 0;
}

.detail-logs {
  padding: 10px;
}

.timeline-title {
  font-weight: 600;
  margin-bottom: 5px;
}

.timeline-content {
  font-size: 14px;
  color: #606266;
}

/* 卡片视图额外样式 */
.stock-card-header {
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-card-body {
  padding: 15px;
}

.stock-card-item {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

.stock-card-item .label {
  color: #909399;
  width: 70px;
  flex-shrink: 0;
}

.stock-card-item .value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.stock-card-footer {
  border-top: 1px solid #ebeef5;
  padding: 10px;
  display: flex;
  justify-content: flex-end;
}

/* 展开行样式 */
.table-expand {
  display: flex;
  flex-wrap: wrap;
}

.table-expand .el-form-item {
  margin-right: 15px;
  margin-bottom: 10px;
  width: auto;
}

.table-expand .full-width-item {
  width: 100%;
}

.detail-medicine-list {
  margin-top: 15px;
  width: 100%;
}

.detail-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: #303133;
}

/* 出库单对话框样式 */
/* 出库单对话框样式 */
.stock-out-dialog .el-dialog__body {
  padding: 20px 30px;
}

.stock-out-dialog .el-form-item {
  margin-bottom: 22px;
}

.stock-out-dialog .el-table .el-input-number {
  width: 100%;
}

.stock-out-dialog .el-table .el-input-number .el-input__inner {
  text-align: left;
}

.stock-out-dialog .el-table .el-select {
  width: 100%;
}

.stock-out-dialog .form-divider {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #EBEEF5;
  font-weight: 600;
  color: #303133;
}

.stock-out-dialog .form-divider .el-button {
  padding: 7px 15px;
}

.stock-out-dialog .form-footer {
  margin-top: 20px;
  text-align: right;
  padding: 10px 0;
  border-top: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-out-dialog .form-footer .total-info {
  font-size: 14px;
  color: #606266;
}

.stock-out-dialog .form-footer .total-info .value {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
  margin-left: 8px;
}

.stock-out-dialog .dialog-footer {
  padding: 20px 0 0;
  text-align: right;
}

/* 状态样式 */
.stock-out-dialog .expiring-soon {
  color: #e6a23c;
  font-weight: bold;
}

.stock-out-dialog .expired {
  color: #f56c6c;
  font-weight: bold;
}

/* 修复表格内的下拉框文字过长问题 */
.stock-out-dialog .el-select-dropdown__item {
  white-space: normal;
  height: auto;
  padding: 8px 10px;
  line-height: 1.5;
}
</style> 