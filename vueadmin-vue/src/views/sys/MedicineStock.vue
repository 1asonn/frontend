<template>
  <div class="medicine-stock-container">
    <el-card class="main-card">
      <div slot="header" class="card-header">
        <h2><i class="el-icon-medicine-box"></i> 药品库存管理</h2>
      </div>
      
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 库存概览 Tab -->
        <el-tab-pane label="库存概览" name="overview">
          <div class="filter-container">
            <el-input
              placeholder="搜索药品名称/编码"
              v-model="stockSearch"
              class="filter-item"
              prefix-icon="el-icon-search"
              @input="handleStockSearch"
              clearable
            ></el-input>
            
            <el-select v-model="stockCategory" placeholder="药品分类" @change="handleStockSearch" clearable class="filter-item">
              <el-option label="全部" value=""></el-option>
              <el-option label="处方药" value="prescription"></el-option>
              <el-option label="非处方药" value="otc"></el-option>
              <el-option label="中药" value="chinese"></el-option>
              <el-option label="西药" value="western"></el-option>
            </el-select>
            
            <el-select v-model="stockStatus" placeholder="库存状态" @change="handleStockSearch" clearable class="filter-item">
              <el-option label="全部" value=""></el-option>
              <el-option label="库存充足" value="sufficient"></el-option>
              <el-option label="库存不足" value="low"></el-option>
              <el-option label="已过期" value="expired"></el-option>
              <el-option label="即将过期" value="expiring"></el-option>
            </el-select>
            
            <el-button type="primary" icon="el-icon-refresh" @click="refreshStockList">刷新</el-button>
          </div>
          
          <el-table
            :data="filteredStockList"
            v-loading="stockLoading"
            border
            style="width: 100%"
            :row-class-name="getStockRowClass"
          >
            <el-table-column prop="medicine_code" label="药品编码" width="120"></el-table-column>
            <el-table-column prop="medicine_name" label="药品名称" min-width="150">
              <template slot-scope="scope">
                <el-tooltip :content="scope.row.specification || '无规格信息'" placement="top" effect="light">
                  <span>{{ scope.row.medicine_name }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100">
              <template slot-scope="scope">
                <el-tag :type="getCategoryTagType(scope.row.category)" size="small">
                  {{ formatCategory(scope.row.category) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="当前库存" width="100">
              <template slot-scope="scope">
                <span :class="{ 'stock-warning': isLowStock(scope.row) }">
                  {{ scope.row.quantity }} {{ scope.row.unit }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="min_stock" label="最低库存" width="100"></el-table-column>
            <el-table-column prop="batch_number" label="批次" width="120"></el-table-column>
            <el-table-column prop="expiry_date" label="有效期至" width="120">
              <template slot-scope="scope">
                <span :class="{ 'expiry-warning': isExpiringSoon(scope.row) }">
                  {{ formatDate(scope.row.expiry_date) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="存放位置" width="120"></el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template slot-scope="scope">
                <el-button type="primary" size="mini" @click="handleStockIn(scope.row)">入库</el-button>
                <el-button type="warning" size="mini" @click="handleStockOut(scope.row)">出库</el-button>
                <el-button type="info" size="mini" @click="viewStockDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="pagination.page"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="pagination.size"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
            ></el-pagination>
          </div>
        </el-tab-pane>
        
        <!-- 药品入库 Tab -->
        <el-tab-pane label="药品入库" name="stockIn">
          <el-form :model="stockInForm" :rules="stockInRules" ref="stockInForm" label-width="100px" class="stock-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="药品" prop="medicine_id">
                  <el-select 
                    v-model="stockInForm.medicine_id" 
                    filterable 
                    remote 
                    placeholder="请选择药品"
                    :remote-method="searchMedicines"
                    :loading="medicineSearchLoading"
                    @change="handleMedicineChange"
                    style="width: 100%">
                    <el-option
                      v-for="item in medicineOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                      <span style="float: left">{{ item.name }}</span>
                      <span style="float: right; color: #8492a6; font-size: 13px">{{ item.code }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="供应商" prop="supplier_id">
                  <el-select 
                    v-model="stockInForm.supplier_id" 
                    filterable 
                    placeholder="请选择供应商"
                    style="width: 100%">
                    <el-option
                      v-for="item in supplierOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="批次号" prop="batch_number">
                  <el-input v-model="stockInForm.batch_number" placeholder="请输入批次号"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="生产日期" prop="production_date">
                  <el-date-picker
                    v-model="stockInForm.production_date"
                    type="date"
                    placeholder="选择生产日期"
                    value-format="yyyy-MM-dd"
                    style="width: 100%">
                  </el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="有效期至" prop="expiry_date">
                  <el-date-picker
                    v-model="stockInForm.expiry_date"
                    type="date"
                    placeholder="选择有效期"
                    value-format="yyyy-MM-dd"
                    style="width: 100%">
                  </el-date-picker>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="入库数量" prop="quantity">
                  <el-input-number 
                    v-model="stockInForm.quantity" 
                    :min="1" 
                    :precision="0"
                    style="width: 100%">
                  </el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="单价" prop="unit_price">
                  <el-input-number 
                    v-model="stockInForm.unit_price" 
                    :min="0" 
                    :precision="2"
                    :step="0.01"
                    style="width: 100%">
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="总金额">
                  <el-input :value="totalAmount" disabled></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="备注" prop="remark">
              <el-input type="textarea" v-model="stockInForm.remark" :rows="3"></el-input>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="submitStockIn" :loading="stockInSubmitting">提交入库</el-button>
              <el-button @click="resetStockInForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 药品出库 Tab -->
        <el-tab-pane label="药品出库" name="stockOut">
          <el-form :model="stockOutForm" :rules="stockOutRules" ref="stockOutForm" label-width="100px" class="stock-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="药品" prop="medicine_id">
                  <el-select 
                    v-model="stockOutForm.medicine_id" 
                    filterable 
                    remote 
                    placeholder="请选择药品"
                    :remote-method="searchMedicines"
                    :loading="medicineSearchLoading"
                    @change="handleStockOutMedicineChange"
                    style="width: 100%">
                    <el-option
                      v-for="item in medicineOptions"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id">
                      <span style="float: left">{{ item.name }}</span>
                      <span style="float: right; color: #8492a6; font-size: 13px">{{ item.code }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="批次" prop="stock_id">
                  <el-select 
                    v-model="stockOutForm.stock_id" 
                    placeholder="请选择批次"
                    @change="handleBatchChange"
                    style="width: 100%">
                    <el-option
                      v-for="item in batchOptions"
                      :key="item.id"
                      :label="`${item.batch_number} (${formatDate(item.expiry_date)}) - 库存: ${item.quantity}${item.unit}`"
                      :value="item.id">
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="出库类型" prop="record_type">
                  <el-select v-model="stockOutForm.record_type" placeholder="请选择出库类型" style="width: 100%">
                    <el-option label="普通出库" value="OUT"></el-option>
                    <el-option label="处方出库" value="PRESCRIPTION"></el-option>
                    <el-option label="报损出库" value="DAMAGE"></el-option>
                    <el-option label="过期出库" value="EXPIRED"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="出库数量" prop="quantity">
                  <el-input-number 
                    v-model="stockOutForm.quantity" 
                    :min="1" 
                    :max="currentBatchStock"
                    :precision="0"
                    style="width: 100%">
                  </el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="接收部门/患者" prop="recipient" v-if="stockOutForm.record_type !== 'DAMAGE' && stockOutForm.record_type !== 'EXPIRED'">
              <el-input v-model="stockOutForm.recipient" placeholder="请输入接收部门或患者信息"></el-input>
            </el-form-item>
            
            <el-form-item label="处方编号" prop="prescription_id" v-if="stockOutForm.record_type === 'PRESCRIPTION'">
              <el-input v-model="stockOutForm.prescription_id" placeholder="请输入处方编号"></el-input>
            </el-form-item>
            
            <el-form-item label="备注" prop="remark">
              <el-input type="textarea" v-model="stockOutForm.remark" :rows="3"></el-input>
            </el-form-item>
            
            <el-form-item>
              <el-button type="warning" @click="submitStockOut" :loading="stockOutSubmitting">提交出库</el-button>
              <el-button @click="resetStockOutForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 出入库记录 Tab -->
        <el-tab-pane label="出入库记录" name="records">
          <div class="filter-container">
            <el-input
              placeholder="搜索药品名称/批次"
              v-model="recordSearch"
              class="filter-item"
              prefix-icon="el-icon-search"
              @input="handleRecordSearch"
              clearable
            ></el-input>
            
            <el-select v-model="recordType" placeholder="记录类型" @change="handleRecordSearch" clearable class="filter-item">
              <el-option label="全部" value=""></el-option>
              <el-option label="入库" value="IN"></el-option>
              <el-option label="出库" value="OUT"></el-option>
              <el-option label="处方出库" value="PRESCRIPTION"></el-option>
              <el-option label="报损出库" value="DAMAGE"></el-option>
              <el-option label="过期出库" value="EXPIRED"></el-option>
            </el-select>
            
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              @change="handleRecordSearch"
              class="filter-item date-range"
            ></el-date-picker>
            
            <el-button type="primary" icon="el-icon-refresh" @click="refreshRecordList">刷新</el-button>
          </div>
          
          <el-table
            :data="filteredRecordList"
            v-loading="recordLoading"
            border
            style="width: 100%"
          >
            <el-table-column prop="record_number" label="记录编号" width="120"></el-table-column>
            <el-table-column prop="medicine_name" label="药品名称" min-width="150"></el-table-column>
            <el-table-column prop="record_type" label="类型" width="100">
              <template slot-scope="scope">
                <el-tag :type="getRecordTypeTagType(scope.row.record_type)" size="small">
                  {{ formatRecordType(scope.row.record_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100">
              <template slot-scope="scope">
                {{ scope.row.quantity }} {{ scope.row.unit }}
              </template>
            </el-table-column>
            <el-table-column prop="batch_number" label="批次" width="120"></el-table-column>
            <el-table-column prop="created_at" label="操作时间" width="180">
              <template slot-scope="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template slot-scope="scope">
                <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                  {{ formatStatus(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" @click="viewRecordDetail(scope.row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              @size-change="handleRecordSizeChange"
              @current-change="handleRecordCurrentChange"
              :current-page="recordPagination.page"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="recordPagination.size"
              layout="total, sizes, prev, pager, next, jumper"
              :total="recordPagination.total"
            ></el-pagination>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 库存详情对话框 -->
    <el-dialog
      title="药品库存详情"
      :visible.sync="stockDetailVisible"
      width="60%"
      :before-close="handleStockDetailClose">
      <div v-loading="stockDetailLoading">
        <el-descriptions title="基本信息" :column="3" border>
          <el-descriptions-item label="药品名称">{{ selectedStock.medicine_name }}</el-descriptions-item>
          <el-descriptions-item label="药品编码">{{ selectedStock.medicine_code }}</el-descriptions-item>
          <el-descriptions-item label="药品分类">
            <el-tag :type="getCategoryTagType(selectedStock.category)" size="small">
              {{ formatCategory(selectedStock.category) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="规格">{{ selectedStock.specification || '无' }}</el-descriptions-item>
          <el-descriptions-item label="生产厂商">{{ selectedStock.manufacturer || '无' }}</el-descriptions-item>
          <el-descriptions-item label="存放位置">{{ selectedStock.location || '无' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">库存信息</el-divider>
        
        <el-descriptions :column="3" border>
          <el-descriptions-item label="当前库存">
            <span :class="{ 'stock-warning': isLowStock(selectedStock) }">
              {{ selectedStock.quantity }} {{ selectedStock.unit }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="最低库存">{{ selectedStock.min_stock }} {{ selectedStock.unit }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ selectedStock.batch_number }}</el-descriptions-item>
          <el-descriptions-item label="生产日期">{{ formatDate(selectedStock.production_date) }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">
            <span :class="{ 'expiry-warning': isExpiringSoon(selectedStock) }">
              {{ formatDate(selectedStock.expiry_date) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="入库时间">{{ formatDateTime(selectedStock.created_at) }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">最近操作记录</el-divider>
        
        <el-table
          :data="stockRecords"
          border
          style="width: 100%"
          size="small"
        >
          <el-table-column prop="record_type" label="操作类型" width="100">
            <template slot-scope="scope">
              <el-tag :type="getRecordTypeTagType(scope.row.record_type)" size="small">
                {{ formatRecordType(scope.row.record_type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100">
            <template slot-scope="scope">
              {{ scope.row.quantity }} {{ scope.row.unit }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="操作时间" width="180">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150"></el-table-column>
        </el-table>
      </div>
    </el-dialog>
    
    <!-- 记录详情对话框 -->
    <el-dialog
      title="出入库记录详情"
      :visible.sync="recordDetailVisible"
      width="60%"
      :before-close="handleRecordDetailClose">
      <div v-loading="recordDetailLoading">
        <el-descriptions title="记录信息" :column="3" border>
          <el-descriptions-item label="记录编号">{{ selectedRecord.record_number }}</el-descriptions-item>
          <el-descriptions-item label="记录类型">
            <el-tag :type="getRecordTypeTagType(selectedRecord.record_type)" size="small">
              {{ formatRecordType(selectedRecord.record_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedRecord.status)" size="small">
              {{ formatStatus(selectedRecord.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ formatDateTime(selectedRecord.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ selectedRecord.operator }}</el-descriptions-item>
          <el-descriptions-item label="审核人" v-if="selectedRecord.approver">{{ selectedRecord.approver }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">药品信息</el-divider>
        
        <el-descriptions :column="3" border>
          <el-descriptions-item label="药品名称">{{ selectedRecord.medicine_name }}</el-descriptions-item>
          <el-descriptions-item label="药品编码">{{ selectedRecord.medicine_code }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ selectedRecord.quantity }} {{ selectedRecord.unit }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ selectedRecord.batch_number }}</el-descriptions-item>
          <el-descriptions-item label="有效期至" v-if="selectedRecord.expiry_date">{{ formatDate(selectedRecord.expiry_date) }}</el-descriptions-item>
          <el-descriptions-item label="单价" v-if="selectedRecord.unit_price">¥{{ selectedRecord.unit_price }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedRecord.record_type === 'IN'">
          <el-divider content-position="left">供应商信息</el-divider>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="供应商名称">{{ selectedRecord.supplier_name || '无' }}</el-descriptions-item>
            <el-descriptions-item label="联系方式">{{ selectedRecord.supplier_contact || '无' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div v-if="selectedRecord.record_type === 'PRESCRIPTION'">
          <el-divider content-position="left">处方信息</el-divider>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="处方编号">{{ selectedRecord.prescription_id || '无' }}</el-descriptions-item>
            <el-descriptions-item label="患者信息">{{ selectedRecord.recipient || '无' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <el-divider content-position="left">备注</el-divider>
        <div class="record-remark">
          {{ selectedRecord.remark || '无备注信息' }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>
