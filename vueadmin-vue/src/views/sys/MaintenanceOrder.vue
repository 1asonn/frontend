<template>
    <div class="main">
        <!-- 统计卡片区域 -->
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-title">总工单数</div>
                <div class="stat-value">{{ totalOrders }}</div>
                <div class="stat-trend">
                    <i class="el-icon-top" style="color: #f56c6c; margin-right: 5px;"></i>
                    <span>较上月增长 12%</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-title">待处理工单</div>
                <div class="stat-value">{{ getPendingOrdersCount() }}</div>
                <div class="stat-trend">
                    <i class="el-icon-bottom" style="color: #67c23a; margin-right: 5px;"></i>
                    <span>较上月下降 5%</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-title">处理中工单</div>
                <div class="stat-value">{{ getProcessingOrdersCount() }}</div>
                <div class="stat-trend">
                    <i class="el-icon-top" style="color: #f56c6c; margin-right: 5px;"></i>
                    <span>较上月增长 8%</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-title">平均处理时间</div>
                <div class="stat-value">2.5 天</div>
                <div class="stat-trend">
                    <i class="el-icon-bottom" style="color: #67c23a; margin-right: 5px;"></i>
                    <span>较上月缩短 0.5 天</span>
                </div>
            </div>
        </div>
        
        <!-- 搜索区域 -->
        <div class="search-box">
            <el-input
                placeholder="搜索工单号/设备名称"
                v-model="searchQuery"
                class="search-input"
                prefix-icon="el-icon-search"
                @input="handleSearch"
                clearable
            >
            </el-input>
            <el-select v-model="filterDepartment" placeholder="所属科室" @change="handleSearch" class="filter-select" clearable>
                <el-option label="全部" value=""></el-option>
                <el-option label="放射科" value="放射科"></el-option>
                <el-option label="检验科" value="检验科"></el-option>
                <el-option label="手术室" value="手术室"></el-option>
            </el-select>
            <el-select v-model="filterStatus" placeholder="工单状态" @change="handleSearch" class="filter-select" clearable>
                <el-option label="全部" value=""></el-option>
                <el-option label="待处理" value="pending"></el-option>
                <el-option label="处理中" value="processing"></el-option>
                <el-option label="已完成" value="completed"></el-option>
                <el-option label="已取消" value="cancelled"></el-option>
            </el-select>
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                @change="handleSearch"
                class="date-range-picker"
            >
            </el-date-picker>
            <el-button type="primary" icon="el-icon-plus" @click="showCreateOrderDialog">新建工单</el-button>
            <el-button type="success" icon="el-icon-download" @click="exportMaintenanceData" class="export-button">导出维修数据</el-button>
        </div>

        <!-- 工单列表区域 -->
        <div v-loading="loading" class="order-container">
            <!-- 骨架屏 -->
            <template v-if="loading">
                <div class="skeleton-container" v-for="i in 6" :key="'skeleton-' + i">
                    <el-card class="skeleton-card">
                        <div class="skeleton-header"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-info"></div>
                            <div class="skeleton-info"></div>
                            <div class="skeleton-footer"></div>
                        </div>
                    </el-card>
                </div>
            </template>

            <!-- 空数据提示 -->
            <div class="empty-data" v-else-if="filteredOrderList.length === 0">
                <el-empty description="暂无工单数据" :image-size="200">
                    <el-button type="primary" @click="showCreateOrderDialog">创建工单</el-button>
                </el-empty>
            </div>

            <!-- 工单列表 -->
            <div class="order-list">
                <el-card 
                    v-for="order in filteredOrderList" 
                    :key="order.id" 
                    class="order-card" 
                    shadow="hover"
                    @click.native="viewOrderDetail(order)"
                >
                    <div class="order-header">
                        <div class="order-title">
                            <span class="order-number">工单号: {{ order.order_number }}</span>
                            <el-tag 
                                :type="getStatusType(order.status)" 
                                size="small" 
                                effect="dark"
                            >
                                {{ formatStatus(order.status) }}
                            </el-tag>
                        </div>
                        <div class="order-date">
                            <i class="el-icon-time"></i>
                            <span>{{ formatDate(order.create_time) }}</span>
                        </div>
                    </div>

                    <div class="order-content">
                        <div class="equipment-info">
                            <div class="info-item">
                                <span class="label">设备名称:</span>
                                <span class="value">{{ order.equipment_name }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">设备编号:</span>
                                <span class="value">{{ order.equipment_code }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">所属科室:</span>
                                <span class="value">{{ order.department }}</span>
                            </div>
                            <div class="info-item">
                                <span class="label">故障类型:</span>
                                <span class="value">{{ order.fault_type }}</span>
                            </div>
                        </div>
                        <div class="order-description">
                            <span class="label">故障描述:</span>
                            <span class="value description-text">{{ order.fault_description }}</span>
                        </div>
                    </div>

                    <div class="order-footer">
                        <div class="assignee-info" v-if="order.assignee">
                            <i class="el-icon-user"></i>
                            <span>处理人: {{ order.assignee }}</span>
                        </div>
                        <div class="order-actions">
                            <el-button 
                                type="primary" 
                                size="mini" 
                                icon="el-icon-view"
                                @click.stop="viewOrderDetail(order)"
                            >
                                查看详情
                            </el-button>
                            <el-button 
                                v-if="order.status === 'pending'"
                                type="success" 
                                size="mini" 
                                icon="el-icon-s-operation"
                                @click.stop="processOrder(order)"
                            >
                                处理工单
                            </el-button>
                            <el-button 
                                v-if="order.status === 'processing'"
                                type="warning" 
                                size="mini" 
                                icon="el-icon-finished"
                                @click.stop="completeOrder(order)"
                            >
                                完成工单
                            </el-button>
                            <el-button 
                                v-if="['pending', 'processing'].includes(order.status)"
                                type="danger" 
                                size="mini" 
                                icon="el-icon-close"
                                @click.stop="cancelOrder(order)"
                            >
                                取消工单
                            </el-button>
                        </div>
                    </div>
                </el-card>
            </div>

            <!-- 分页 -->
            <div class="pagination-container">
                <el-pagination
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    :current-page.sync="currentPage"
                    :page-sizes="[5, 10, 20, 50]"
                    :page-size="pageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="totalOrders"
                >
                </el-pagination>
            </div>
        </div>

        <!-- 工单详情对话框 -->
        <el-dialog
            :title="`工单详情 - ${selectedOrder.order_number || ''}`"
            :visible.sync="detailDialogVisible"
            width="70%"
            :before-close="handleDetailClose"
            class="order-detail-dialog"
        >
            <div class="dialog-toolbar" v-if="detailDialogVisible">
                <el-button type="text" icon="el-icon-printer" @click="printOrderDetail">打印工单</el-button>
                <el-button type="text" icon="el-icon-full-screen" @click="toggleFullScreen">
                    {{ isFullScreen ? '退出全屏' : '全屏查看' }}
                </el-button>
            </div>

            <el-steps :active="getStatusStep(selectedOrder.status)" finish-status="success" align-center>
                <el-step title="创建工单" description="工单已创建"></el-step>
                <el-step title="处理中" description="工单处理中"></el-step>
                <el-step title="完成" description="工单已完成"></el-step>
            </el-steps>

            <el-divider content-position="left">
                <i class="el-icon-tickets"></i> 工单信息
            </el-divider>

            <div class="detail-section">
                <div class="detail-row">
                    <div class="detail-item">
                        <span class="detail-label">工单号</span>
                        <span class="detail-value">{{ selectedOrder.order_number || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">创建时间</span>
                        <span class="detail-value">{{ formatDate(selectedOrder.create_time) || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">工单状态</span>
                        <el-tag 
                            :type="getStatusType(selectedOrder.status)" 
                            effect="dark"
                        >
                            {{ formatStatus(selectedOrder.status) }}
                        </el-tag>
                    </div>
                </div>
            </div>

            <el-divider content-position="left">
                <i class="el-icon-cpu"></i> 设备信息
            </el-divider>

            <div class="detail-section">
                <div class="detail-row">
                    <div class="detail-item">
                        <span class="detail-label">设备名称</span>
                        <span class="detail-value">{{ selectedOrder.equipment_name || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">设备编号</span>
                        <span class="detail-value">{{ selectedOrder.equipment_code || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">所属科室</span>
                        <span class="detail-value">{{ selectedOrder.department || '暂无' }}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-item">
                        <span class="detail-label">设备型号</span>
                        <span class="detail-value">{{ selectedOrder.equipment_model || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">存放位置</span>
                        <span class="detail-value">{{ selectedOrder.location || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">制造商</span>
                        <span class="detail-value">{{ selectedOrder.manufacturer || '暂无' }}</span>
                    </div>
                </div>
            </div>

            <el-divider content-position="left">
                <i class="el-icon-warning"></i> 故障信息
            </el-divider>

            <div class="detail-section">
                <div class="detail-row">
                    <div class="detail-item">
                        <span class="detail-label">故障类型</span>
                        <span class="detail-value">{{ selectedOrder.fault_type || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">报修人</span>
                        <span class="detail-value">{{ selectedOrder.reporter || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">联系电话</span>
                        <span class="detail-value">{{ selectedOrder.contact_phone || '暂无' }}</span>
                    </div>
                </div>
                <div class="detail-item full-width">
                    <span class="detail-label">故障描述</span>
                    <div class="description-content">
                        {{ selectedOrder.fault_description || '暂无故障描述' }}
                    </div>
                </div>
            </div>

            <el-divider content-position="left" v-if="selectedOrder.assignee">
                <i class="el-icon-s-operation"></i> 处理信息
            </el-divider>

            <div class="detail-section" v-if="selectedOrder.assignee">
                <div class="detail-row">
                    <div class="detail-item">
                        <span class="detail-label">处理人</span>
                        <span class="detail-value">{{ selectedOrder.assignee || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">开始处理时间</span>
                        <span class="detail-value">{{ formatDate(selectedOrder.process_time) || '暂无' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">完成时间</span>
                        <span class="detail-value">{{ formatDate(selectedOrder.complete_time) || '暂无' }}</span>
                    </div>
                </div>
                <div class="detail-item full-width" v-if="selectedOrder.process_result">
                    <span class="detail-label">处理结果</span>
                    <div class="description-content">
                        {{ selectedOrder.process_result || '暂无处理结果' }}
                    </div>
                </div>
            </div>
            
            <!-- 维修历史记录 -->
            <el-divider content-position="left" v-if="maintenanceHistory.length > 0">
                <i class="el-icon-time"></i> 维修历史记录
            </el-divider>
            
            <div class="history-timeline" v-if="maintenanceHistory.length > 0">
                <el-timeline>
                    <el-timeline-item
                        v-for="(history, index) in maintenanceHistory"
                        :key="index"
                        :timestamp="formatDate(history.time)"
                        :type="getHistoryItemType(history.type)"
                    >
                        <div class="history-content">
                            <h4>{{ history.title }}</h4>
                            <p>{{ history.content }}</p>
                            <p v-if="history.operator"><small>操作人: {{ history.operator }}</small></p>
                        </div>
                    </el-timeline-item>
                </el-timeline>
            </div>

            <div class="detail-footer">
                <el-button @click="detailDialogVisible = false">关闭</el-button>
                <el-button 
                    v-if="selectedOrder.status === 'pending'"
                    type="success" 
                    @click="processOrder(selectedOrder)"
                >
                    处理工单
                </el-button>
                <el-button 
                    v-if="selectedOrder.status === 'processing'"
                    type="warning" 
                    @click="completeOrder(selectedOrder)"
                >
                    完成工单
                </el-button>
                <el-button 
                    v-if="['pending', 'processing'].includes(selectedOrder.status)"
                    type="danger" 
                    @click="cancelOrder(selectedOrder)"
                >
                    取消工单
                </el-button>
            </div>
        </el-dialog>

        <!-- 创建工单对话框 -->
        <el-dialog
            title="创建维修工单"
            :visible.sync="createDialogVisible"
            width="65%"
            :before-close="handleCreateClose"
            class="create-order-dialog"
        >
            <div class="dialog-toolbar" v-if="createDialogVisible">
                <el-button type="text" icon="el-icon-refresh-left" @click="resetCreateForm">重置表单</el-button>
                <el-button type="text" icon="el-icon-full-screen" @click="toggleCreateFullScreen">
                    {{ isCreateFullScreen ? '退出全屏' : '全屏编辑' }}
                </el-button>
            </div>

            <el-form 
                ref="createForm" 
                :model="createForm" 
                :rules="createRules" 
                label-width="100px"
                class="create-order-form"
            >
                <el-steps :active="createActiveStep" finish-status="success" simple>
                    <el-step title="设备信息" icon="el-icon-cpu"></el-step>
                    <el-step title="故障信息" icon="el-icon-warning"></el-step>
                    <el-step title="联系信息" icon="el-icon-user"></el-step>
                </el-steps>

                <!-- 第一步：设备信息 -->
                <div v-show="createActiveStep === 0" class="step-content">
                    <el-form-item label="设备选择方式">
                        <el-radio-group v-model="equipmentSelectMethod" @change="handleEquipmentSelectChange">
                            <el-radio :label="'search'">搜索设备</el-radio>
                            <el-radio :label="'manual'">手动输入</el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <template v-if="equipmentSelectMethod === 'search'">
                        <el-form-item label="设备搜索" prop="equipment_id">
                            <el-select 
                                v-model="createForm.equipment_id" 
                                filterable 
                                remote 
                                reserve-keyword
                                placeholder="请输入设备名称或编号搜索" 
                                :remote-method="searchEquipment"
                                :loading="equipmentLoading"
                                @change="handleEquipmentSelect"
                                style="width: 100%"
                            >
                                <el-option
                                    v-for="item in equipmentOptions"
                                    :key="item.id"
                                    :label="`${item.name} (${item.equipment_code})`"
                                    :value="item.id"
                                >
                                    <span style="float: left">{{ item.name }}</span>
                                    <span style="float: right; color: #8492a6; font-size: 13px">{{ item.equipment_code }}</span>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </template>

                    <template v-else>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="设备名称" prop="equipment_name">
                                    <el-input v-model="createForm.equipment_name" placeholder="请输入设备名称"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="设备编号" prop="equipment_code">
                                    <el-input v-model="createForm.equipment_code" placeholder="请输入设备编号"></el-input>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="设备型号" prop="equipment_model">
                                    <el-input v-model="createForm.equipment_model" placeholder="请输入设备型号"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="所属科室" prop="department">
                                    <el-select v-model="createForm.department" placeholder="请选择所属科室" style="width: 100%">
                                        <el-option label="放射科" value="放射科"></el-option>
                                        <el-option label="检验科" value="检验科"></el-option>
                                        <el-option label="手术室" value="手术室"></el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="存放位置" prop="location">
                                    <el-input v-model="createForm.location" placeholder="请输入存放位置"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="制造商" prop="manufacturer">
                                    <el-input v-model="createForm.manufacturer" placeholder="请输入制造商"></el-input>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </template>
                </div>

                <!-- 第二步：故障信息 -->
                <div v-show="createActiveStep === 1" class="step-content">
                    <el-form-item label="故障类型" prop="fault_type">
                        <el-select v-model="createForm.fault_type" placeholder="请选择故障类型" style="width: 100%">
                            <el-option label="硬件故障" value="硬件故障"></el-option>
                            <el-option label="软件故障" value="软件故障"></el-option>
                            <el-option label="电气故障" value="电气故障"></el-option>
                            <el-option label="机械故障" value="机械故障"></el-option>
                            <el-option label="其他故障" value="其他故障"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="故障描述" prop="fault_description">
                        <el-input 
                            type="textarea" 
                            v-model="createForm.fault_description" 
                            placeholder="请详细描述故障情况，包括故障现象、发生时间、可能原因等"
                            :rows="6"
                        ></el-input>
                    </el-form-item>
                    <el-form-item label="故障图片">
                        <el-upload
                            action="#"
                            list-type="picture-card"
                            :auto-upload="false"
                            :on-change="handleImageChange"
                            :on-remove="handleImageRemove"
                            :limit="3"
                        >
                            <i class="el-icon-plus"></i>
                        </el-upload>
                        <div class="el-upload__tip">最多上传3张图片，每张不超过5MB</div>
                    </el-form-item>
                    <el-form-item label="紧急程度" prop="priority">
                        <el-radio-group v-model="createForm.priority">
                            <el-radio label="high">高 (24小时内)</el-radio>
                            <el-radio label="medium">中 (3天内)</el-radio>
                            <el-radio label="low">低 (7天内)</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </div>

                <!-- 第三步：联系信息 -->
                <div v-show="createActiveStep === 2" class="step-content">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item label="报修人" prop="reporter">
                                <el-input v-model="createForm.reporter" placeholder="请输入报修人姓名"></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="联系电话" prop="contact_phone">
                                <el-input v-model="createForm.contact_phone" placeholder="请输入联系电话"></el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-form-item label="备注">
                        <el-input 
                            type="textarea" 
                            v-model="createForm.remarks" 
                            placeholder="其他需要说明的情况"
                            :rows="4"
                        ></el-input>
                    </el-form-item>
                </div>

                <div class="form-footer">
                    <el-button @click="prevStep" v-if="createActiveStep > 0">上一步</el-button>
                    <el-button type="primary" @click="nextStep" v-if="createActiveStep < 2">下一步</el-button>
                    <el-button type="success" @click="submitCreateForm" v-if="createActiveStep === 2">提交工单</el-button>
                </div>
            </el-form>
        </el-dialog>

        <!-- 处理工单对话框 -->
        <el-dialog
            title="处理维修工单"
            :visible.sync="processDialogVisible"
            width="60%"
            :before-close="handleProcessClose"
        >
            <el-form ref="processForm" :model="processForm" :rules="processRules" label-width="100px">
                <el-form-item label="工单号">
                    <span>{{ selectedOrder.order_number }}</span>
                </el-form-item>
                <el-form-item label="设备名称">
                    <span>{{ selectedOrder.equipment_name }}</span>
                </el-form-item>
                <el-form-item label="故障类型">
                    <span>{{ selectedOrder.fault_type }}</span>
                </el-form-item>
                <el-form-item label="处理人" prop="assignee">
                    <el-input v-model="processForm.assignee" placeholder="请输入处理人姓名"></el-input>
                </el-form-item>
                <el-form-item label="预计完成时间" prop="estimated_time">
                    <el-date-picker
                        v-model="processForm.estimated_time"
                        type="datetime"
                        placeholder="选择预计完成时间"
                        format="yyyy-MM-dd HH:mm"
                        value-format="yyyy-MM-dd HH:mm:ss"
                        :picker-options="{ disabledDate: disabledDate }"
                        style="width: 100%"
                    >
                    </el-date-picker>
                </el-form-item>
                <el-form-item label="处理备注" prop="process_remark">
                    <el-input 
                        type="textarea" 
                        v-model="processForm.process_remark" 
                        placeholder="请输入处理备注"
                        :rows="4"
                    ></el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="processDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitProcessForm">确认处理</el-button>
            </div>
        </el-dialog>

        <!-- 完成工单对话框 -->
        <el-dialog
            title="完成维修工单"
            :visible.sync="completeDialogVisible"
            width="60%"
            :before-close="handleCompleteClose"
        >
            <el-form ref="completeForm" :model="completeForm" :rules="completeRules" label-width="100px">
                <el-form-item label="工单号">
                    <span>{{ selectedOrder.order_number }}</span>
                </el-form-item>
                <el-form-item label="设备名称">
                    <span>{{ selectedOrder.equipment_name }}</span>
                </el-form-item>
                <el-form-item label="处理人">
                    <span>{{ selectedOrder.assignee }}</span>
                </el-form-item>
                <el-form-item label="维修结果" prop="result_type">
                    <el-select v-model="completeForm.result_type" placeholder="请选择维修结果" style="width: 100%">
                        <el-option label="已修复" value="fixed"></el-option>
                        <el-option label="部分修复" value="partially_fixed"></el-option>
                        <el-option label="无法修复" value="cannot_fix"></el-option>
                        <el-option label="需要更换零件" value="need_parts"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="处理结果" prop="process_result">
                    <el-input 
                        type="textarea" 
                        v-model="completeForm.process_result" 
                        placeholder="请详细描述处理过程和结果"
                        :rows="6"
                    ></el-input>
                </el-form-item>
                <el-form-item label="维修费用" prop="cost">
                    <el-input-number 
                        v-model="completeForm.cost" 
                        :precision="2" 
                        :step="100" 
                        :min="0"
                        controls-position="right"
                        style="width: 100%"
                    ></el-input-number>
                </el-form-item>
                <el-form-item label="更换零件" v-if="completeForm.result_type === 'need_parts'">
                    <el-tag
                        :key="tag"
                        v-for="tag in completeForm.parts"
                        closable
                        :disable-transitions="false"
                        @close="handlePartClose(tag)"
                        class="part-tag"
                    >
                        {{tag}}
                    </el-tag>
                    <el-input
                        class="input-new-tag"
                        v-if="inputPartVisible"
                        v-model="inputPartValue"
                        ref="savePartInput"
                        size="small"
                        @keyup.enter.native="handlePartInputConfirm"
                        @blur="handlePartInputConfirm"
                    >
                    </el-input>
                    <el-button v-else class="button-new-tag" size="small" @click="showPartInput">+ 添加零件</el-button>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="completeDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitCompleteForm">确认完成</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { getEquipmentList, getEquipmentById } from '@/api/equipment'

export default {
    name: 'MaintenanceOrder',
    data() {
        return {
            // 搜索和筛选
            searchQuery: '',
            filterDepartment: '',
            filterStatus: '',
            dateRange: [],
            
            // 分页
            currentPage: 1,
            pageSize: 10,
            totalOrders: 0,
            
            // 加载状态
            loading: false,
            equipmentLoading: false,
            
            // 工单列表
            orderList: [],
            filteredOrderList: [],
            
            // 设备选择
            equipmentOptions: [],
            equipmentSelectMethod: 'search',
            
            // 对话框显示状态
            detailDialogVisible: false,
            createDialogVisible: false,
            processDialogVisible: false,
            completeDialogVisible: false,
            isFullScreen: false,
            isCreateFullScreen: false,
            
            // 创建工单表单
            createActiveStep: 0,
            createForm: {
                equipment_id: '',
                equipment_name: '',
                equipment_code: '',
                equipment_model: '',
                department: '',
                location: '',
                manufacturer: '',
                fault_type: '',
                fault_description: '',
                priority: 'medium',
                reporter: '',
                contact_phone: '',
                remarks: '',
                images: []
            },
            
            // 处理工单表单
            processForm: {
                assignee: '',
                estimated_time: '',
                process_remark: ''
            },
            
            // 完成工单表单
            completeForm: {
                result_type: 'fixed',
                process_result: '',
                cost: 0,
                parts: [],
            },
            inputPartVisible: false,
            inputPartValue: '',
            
            // 当前选中的工单
            selectedOrder: {},
            
            // 维修历史记录
            maintenanceHistory: [],
            
            // 表单验证规则
            createRules: {
                equipment_id: [
                    { required: true, message: '请选择设备', trigger: 'change' }
                ],
                equipment_name: [
                    { required: true, message: '请输入设备名称', trigger: 'blur' }
                ],
                equipment_code: [
                    { required: true, message: '请输入设备编号', trigger: 'blur' }
                ],
                department: [
                    { required: true, message: '请选择所属科室', trigger: 'change' }
                ],
                fault_type: [
                    { required: true, message: '请选择故障类型', trigger: 'change' }
                ],
                fault_description: [
                    { required: true, message: '请输入故障描述', trigger: 'blur' },
                    { min: 10, message: '故障描述不能少于10个字符', trigger: 'blur' }
                ],
                priority: [
                    { required: true, message: '请选择紧急程度', trigger: 'change' }
                ],
                reporter: [
                    { required: true, message: '请输入报修人姓名', trigger: 'blur' }
                ],
                contact_phone: [
                    { required: true, message: '请输入联系电话', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
                ]
            },
            processRules: {
                assignee: [
                    { required: true, message: '请输入处理人姓名', trigger: 'blur' }
                ],
                estimated_time: [
                    { required: true, message: '请选择预计完成时间', trigger: 'change' }
                ]
            },
            completeRules: {
                result_type: [
                    { required: true, message: '请选择维修结果', trigger: 'change' }
                ],
                process_result: [
                    { required: true, message: '请输入处理结果', trigger: 'blur' },
                    { min: 10, message: '处理结果不能少于10个字符', trigger: 'blur' }
                ]
            }
        }
    },
    created() {
        this.fetchOrderList();
    },
    methods: {
        // 获取工单列表
        async fetchOrderList() {
            this.loading = true;
            try {
                // 这里应该调用后端API获取工单列表
                // 由于目前没有实际的API，我们使用模拟数据
                setTimeout(() => {
                    this.orderList = this.getMockOrders();
                    this.filteredOrderList = [...this.orderList];
                    this.totalOrders = this.orderList.length;
                    this.loading = false;
                }, 800);
            } catch (error) {
                console.error('获取工单列表失败:', error);
                this.$message.error('获取工单列表失败');
                this.loading = false;
            }
        },
        
        // 模拟数据
        getMockOrders() {
            return [
                {
                    id: '1',
                    order_number: 'MO202504270001',
                    equipment_name: 'X光机',
                    equipment_code: 'XG-2023-001',
                    equipment_model: 'XR-5000',
                    department: '放射科',
                    location: '放射科检查室1',
                    manufacturer: '飞利浦医疗',
                    status: 'pending',
                    create_time: '2025-04-26 14:30:00',
                    fault_type: '硬件故障',
                    fault_description: 'X光机启动后显示器无法正常显示图像，设备发出异常声音。',
                    reporter: '张医生',
                    contact_phone: '13800138000',
                    priority: 'high'
                },
                {
                    id: '2',
                    order_number: 'MO202504270002',
                    equipment_name: '血液分析仪',
                    equipment_code: 'XF-2023-005',
                    equipment_model: 'BA-3000',
                    department: '检验科',
                    location: '检验科实验室2',
                    manufacturer: '迈瑞医疗',
                    status: 'processing',
                    create_time: '2025-04-25 09:15:00',
                    process_time: '2025-04-25 13:20:00',
                    fault_type: '软件故障',
                    fault_description: '血液分析仪在分析过程中经常出现软件崩溃，需要重启才能继续使用。',
                    reporter: '李技师',
                    contact_phone: '13900139000',
                    assignee: '王工程师',
                    estimated_time: '2025-04-28 18:00:00',
                    priority: 'medium'
                },
                {
                    id: '3',
                    order_number: 'MO202504270003',
                    equipment_name: '手术无影灯',
                    equipment_code: 'SS-2023-010',
                    equipment_model: 'SL-8000',
                    department: '手术室',
                    location: '手术室3',
                    manufacturer: '通用电气',
                    status: 'completed',
                    create_time: '2025-04-20 16:45:00',
                    process_time: '2025-04-21 08:30:00',
                    complete_time: '2025-04-22 14:20:00',
                    fault_type: '电气故障',
                    fault_description: '手术无影灯亮度不足，且调节按钮失灵。',
                    reporter: '刘主任',
                    contact_phone: '13700137000',
                    assignee: '赵技术员',
                    process_result: '更换了灯泡和控制面板，设备已恢复正常使用。',
                    priority: 'high',
                    cost: 2500
                }
            ];
        },
        
        // 搜索和筛选
        handleSearch() {
            if (!this.orderList.length) return;
            
            this.filteredOrderList = this.orderList.filter(order => {
                // 搜索条件：工单号或设备名称
                const searchMatch = !this.searchQuery || 
                    order.order_number.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    order.equipment_name.toLowerCase().includes(this.searchQuery.toLowerCase());
                
                // 科室筛选
                const departmentMatch = !this.filterDepartment || 
                    order.department === this.filterDepartment;
                
                // 状态筛选
                const statusMatch = !this.filterStatus || 
                    order.status === this.filterStatus;
                
                // 日期范围筛选
                let dateMatch = true;
                if (this.dateRange && this.dateRange.length === 2) {
                    const orderDate = new Date(order.create_time);
                    const startDate = new Date(this.dateRange[0]);
                    const endDate = new Date(this.dateRange[1]);
                    endDate.setHours(23, 59, 59, 999); // 设置为当天结束时间
                    
                    dateMatch = orderDate >= startDate && orderDate <= endDate;
                }
                
                return searchMatch && departmentMatch && statusMatch && dateMatch;
            });
            
            this.totalOrders = this.filteredOrderList.length;
            this.currentPage = 1; // 重置到第一页
        },
        
        // 分页处理
        handleSizeChange(val) {
            this.pageSize = val;
        },
        
        handleCurrentChange(val) {
            this.currentPage = val;
            // 如果是实际项目，这里应该调用API重新获取数据
        },
        
        // 格式化工单状态
        formatStatus(status) {
            const statusMap = {
                'pending': '待处理',
                'processing': '处理中',
                'completed': '已完成',
                'cancelled': '已取消'
            };
            return statusMap[status] || status;
        },
        
        // 获取状态对应的类型
        getStatusType(status) {
            const typeMap = {
                'pending': 'warning',
                'processing': 'primary',
                'completed': 'success',
                'cancelled': 'info'
            };
            return typeMap[status] || '';
        },
        
        // 获取状态步骤
        getStatusStep(status) {
            const stepMap = {
                'pending': 0,
                'processing': 1,
                'completed': 2,
                'cancelled': 0
            };
            return stepMap[status] || 0;
        },
        
        // 格式化日期
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        },
        
        // 查看工单详情
        viewOrderDetail(order) {
            this.selectedOrder = JSON.parse(JSON.stringify(order));
            this.detailDialogVisible = true;
            this.fetchMaintenanceHistory(order.id);
        },
        
        // 获取维修历史记录
        fetchMaintenanceHistory(orderId) {
            // 这里应该调用API获取维修历史记录
            // 由于目前没有实际的API，我们使用模拟数据
            setTimeout(() => {
                if (orderId === '1') {
                    this.maintenanceHistory = [];
                } else if (orderId === '2') {
                    this.maintenanceHistory = [
                        {
                            time: '2025-04-25 09:15:00',
                            type: 'create',
                            title: '创建工单',
                            content: '工单已创建，等待处理',
                            operator: '李技师'
                        },
                        {
                            time: '2025-04-25 13:20:00',
                            type: 'process',
                            title: '开始处理',
                            content: '工程师已接单，开始处理故障',
                            operator: '王工程师'
                        }
                    ];
                } else if (orderId === '3') {
                    this.maintenanceHistory = [
                        {
                            time: '2025-04-20 16:45:00',
                            type: 'create',
                            title: '创建工单',
                            content: '工单已创建，等待处理',
                            operator: '刘主任'
                        },
                        {
                            time: '2025-04-21 08:30:00',
                            type: 'process',
                            title: '开始处理',
                            content: '技术员已接单，开始处理故障',
                            operator: '赵技术员'
                        },
                        {
                            time: '2025-04-21 14:15:00',
                            type: 'update',
                            title: '处理进展',
                            content: '已确认为灯泡和控制面板故障，需要更换零件',
                            operator: '赵技术员'
                        },
                        {
                            time: '2025-04-22 14:20:00',
                            type: 'complete',
                            title: '完成维修',
                            content: '更换了灯泡和控制面板，设备已恢复正常使用',
                            operator: '赵技术员'
                        }
                    ];
                }
            }, 300);
        },
        
        // 获取历史记录项类型
        getHistoryItemType(type) {
            const typeMap = {
                'create': 'primary',
                'process': 'warning',
                'update': 'info',
                'complete': 'success',
                'cancel': 'danger'
            };
            return typeMap[type] || 'info';
        },
        
        // 处理工单
        processOrder(order) {
            this.selectedOrder = JSON.parse(JSON.stringify(order));
            this.processForm = {
                assignee: '',
                estimated_time: '',
                process_remark: ''
            };
            this.processDialogVisible = true;
        },
        
        // 完成工单
        completeOrder(order) {
            this.selectedOrder = JSON.parse(JSON.stringify(order));
            this.completeForm = {
                result_type: 'fixed',
                process_result: '',
                cost: 0,
                parts: []
            };
            this.completeDialogVisible = true;
        },
        
        // 取消工单
        cancelOrder(order) {
            this.$confirm('确定要取消该工单吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // 这里应该调用API取消工单
                this.$message({
                    type: 'success',
                    message: '工单已取消'
                });
                // 模拟API调用成功后更新本地数据
                const index = this.orderList.findIndex(item => item.id === order.id);
                if (index !== -1) {
                    this.orderList[index].status = 'cancelled';
                    this.orderList[index].cancel_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
                    
                    // 添加历史记录
                    if (this.detailDialogVisible && this.selectedOrder.id === order.id) {
                        this.maintenanceHistory.push({
                            time: this.orderList[index].cancel_time,
                            type: 'cancel',
                            title: '取消工单',
                            content: '工单已取消',
                            operator: this.$store.state.user.username || '系统管理员'
                        });
                    }
                    
                    this.handleSearch(); // 重新筛选
                }
            }).catch(() => {
                // 取消操作
            });
        },
        
        // 对话框关闭处理
        handleDetailClose() {
            this.detailDialogVisible = false;
            this.isFullScreen = false;
        },
        
        handleCreateClose() {
            this.$confirm('关闭将丢失已填写的内容，是否确认关闭?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.createDialogVisible = false;
                this.isCreateFullScreen = false;
                this.resetCreateForm();
            }).catch(() => {
                // 取消关闭
            });
        },
        
        handleProcessClose() {
            this.processDialogVisible = false;
        },
        
        handleCompleteClose() {
            this.completeDialogVisible = false;
        },
        
        // 全屏切换
        toggleFullScreen() {
            this.isFullScreen = !this.isFullScreen;
            const dialog = document.querySelector('.order-detail-dialog .el-dialog');
            if (dialog) {
                if (this.isFullScreen) {
                    dialog.style.width = '100%';
                    dialog.style.height = '100%';
                    dialog.style.margin = '0';
                    dialog.style.position = 'fixed';
                    dialog.style.top = '0';
                    dialog.style.left = '0';
                } else {
                    dialog.style.width = '70%';
                    dialog.style.height = 'auto';
                    dialog.style.margin = '15vh auto 50px';
                    dialog.style.position = 'relative';
                }
            }
        },
        
        toggleCreateFullScreen() {
            this.isCreateFullScreen = !this.isCreateFullScreen;
            const dialog = document.querySelector('.create-order-dialog .el-dialog');
            if (dialog) {
                if (this.isCreateFullScreen) {
                    dialog.style.width = '100%';
                    dialog.style.height = '100%';
                    dialog.style.margin = '0';
                    dialog.style.position = 'fixed';
                    dialog.style.top = '0';
                    dialog.style.left = '0';
                } else {
                    dialog.style.width = '65%';
                    dialog.style.height = 'auto';
                    dialog.style.margin = '15vh auto 50px';
                    dialog.style.position = 'relative';
                }
            }
        },
        
        // 打印工单
        printOrderDetail() {
            window.print();
        },
        
        // 创建工单相关方法
        showCreateOrderDialog() {
            this.createDialogVisible = true;
            this.createActiveStep = 0;
            this.resetCreateForm();
        },
        
        resetCreateForm() {
            if (this.$refs.createForm) {
                this.$refs.createForm.resetFields();
            }
            this.createForm = {
                equipment_id: '',
                equipment_name: '',
                equipment_code: '',
                equipment_model: '',
                department: '',
                location: '',
                manufacturer: '',
                fault_type: '',
                fault_description: '',
                priority: 'medium',
                reporter: '',
                contact_phone: '',
                remarks: '',
                images: []
            };
            this.equipmentSelectMethod = 'search';
        },
        
        nextStep() {
            // 表单验证
            if (this.createActiveStep === 0) {
                // 第一步验证
                if (this.equipmentSelectMethod === 'search') {
                    this.$refs.createForm.validateField('equipment_id', (err) => {
                        if (!err) this.createActiveStep++;
                    });
                } else {
                    this.$refs.createForm.validateField(['equipment_name', 'equipment_code', 'department'], (err) => {
                        if (!err) this.createActiveStep++;
                    });
                }
            } else if (this.createActiveStep === 1) {
                // 第二步验证
                this.$refs.createForm.validateField(['fault_type', 'fault_description', 'priority'], (err) => {
                    if (!err) this.createActiveStep++;
                });
            }
        },
        
        prevStep() {
            if (this.createActiveStep > 0) {
                this.createActiveStep--;
            }
        },
        
        // 设备选择方式变更
        handleEquipmentSelectChange(value) {
            if (value === 'search') {
                this.createForm.equipment_name = '';
                this.createForm.equipment_code = '';
                this.createForm.equipment_model = '';
                this.createForm.department = '';
                this.createForm.location = '';
                this.createForm.manufacturer = '';
            } else {
                this.createForm.equipment_id = '';
            }
        },
        
        // 搜索设备
        async searchEquipment(query) {
            if (query.length < 2) return;
            
            this.equipmentLoading = true;
            try {
                // 调用设备搜索API
                const response = await getEquipmentList({
                    name: query,
                    page: 1,
                    size: 10
                });
                
                if (response && response.data && response.data.records) {
                    this.equipmentOptions = response.data.records;
                }
            } catch (error) {
                console.error('搜索设备失败:', error);
                // 使用模拟数据
                this.equipmentOptions = [
                    { id: '1', name: 'X光机', equipment_code: 'XG-2023-001', model: 'XR-5000', department: '放射科' },
                    { id: '2', name: '血液分析仪', equipment_code: 'XF-2023-005', model: 'BA-3000', department: '检验科' },
                    { id: '3', name: '手术无影灯', equipment_code: 'SS-2023-010', model: 'SL-8000', department: '手术室' }
                ];
            } finally {
                this.equipmentLoading = false;
            }
        },
        
        // 选择设备后获取详情
        async handleEquipmentSelect(id) {
            if (!id) return;
            
            try {
                // 调用设备详情API
                const response = await getEquipmentById(id);
                
                if (response && response.data) {
                    const equipment = response.data;
                    this.createForm.equipment_name = equipment.name;
                    this.createForm.equipment_code = equipment.equipment_code;
                    this.createForm.equipment_model = equipment.model;
                    this.createForm.department = equipment.department;
                    this.createForm.location = equipment.location;
                    this.createForm.manufacturer = equipment.manufacturer;
                }
            } catch (error) {
                console.error('获取设备详情失败:', error);
                // 使用模拟数据
                const mockEquipment = this.equipmentOptions.find(item => item.id === id);
                if (mockEquipment) {
                    this.createForm.equipment_name = mockEquipment.name;
                    this.createForm.equipment_code = mockEquipment.equipment_code;
                    this.createForm.equipment_model = mockEquipment.model;
                    this.createForm.department = mockEquipment.department;
                    this.createForm.location = '未知';
                    this.createForm.manufacturer = '未知';
                }
            }
        },
        
        // 图片上传相关
        handleImageChange(file, fileList) {
            this.createForm.images = fileList;
        },
        
        handleImageRemove(file, fileList) {
            this.createForm.images = fileList;
        },
        
        // 提交创建工单表单
        submitCreateForm() {
            this.$refs.createForm.validate(async (valid) => {
                if (valid) {
                    try {
                        // 这里应该调用API创建工单
                        this.$message({
                            type: 'success',
                            message: '工单创建成功'
                        });
                        
                        // 模拟API调用成功后更新本地数据
                        const createTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
                        const newOrder = {
                            id: Date.now().toString(),
                            order_number: `MO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
                            equipment_name: this.createForm.equipment_name,
                            equipment_code: this.createForm.equipment_code,
                            equipment_model: this.createForm.equipment_model,
                            department: this.createForm.department,
                            location: this.createForm.location,
                            manufacturer: this.createForm.manufacturer,
                            status: 'pending',
                            create_time: createTime,
                            fault_type: this.createForm.fault_type,
                            fault_description: this.createForm.fault_description,
                            reporter: this.createForm.reporter,
                            contact_phone: this.createForm.contact_phone,
                            priority: this.createForm.priority,
                            remarks: this.createForm.remarks
                        };
                        
                        this.orderList.unshift(newOrder);
                        this.handleSearch(); // 重新筛选
                        this.createDialogVisible = false;
                        this.resetCreateForm();
                    } catch (error) {
                        console.error('创建工单失败:', error);
                        this.$message.error('创建工单失败');
                    }
                }
            });
        },
        
        // 提交处理工单表单
        submitProcessForm() {
            this.$refs.processForm.validate(async (valid) => {
                if (valid) {
                    try {
                        // 这里应该调用API处理工单
                        this.$message({
                            type: 'success',
                            message: '工单已开始处理'
                        });
                        
                        // 模拟API调用成功后更新本地数据
                        const index = this.orderList.findIndex(item => item.id === this.selectedOrder.id);
                        if (index !== -1) {
                            this.orderList[index].status = 'processing';
                            this.orderList[index].assignee = this.processForm.assignee;
                            this.orderList[index].process_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
                            this.orderList[index].estimated_time = this.processForm.estimated_time;
                            this.orderList[index].process_remark = this.processForm.process_remark;
                            
                            // 添加历史记录
                            if (this.selectedOrder.id === this.orderList[index].id) {
                                this.maintenanceHistory.push({
                                    time: this.orderList[index].process_time,
                                    type: 'process',
                                    title: '开始处理',
                                    content: this.processForm.process_remark || '工程师已接单，开始处理故障',
                                    operator: this.processForm.assignee
                                });
                            }
                            
                            this.handleSearch(); // 重新筛选
                        }
                        this.processDialogVisible = false;
                    } catch (error) {
                        console.error('处理工单失败:', error);
                        this.$message.error('处理工单失败');
                    }
                }
            });
        },
        
        // 提交完成工单表单
        submitCompleteForm() {
            this.$refs.completeForm.validate(async (valid) => {
                if (valid) {
                    try {
                        // 这里应该调用API完成工单
                        this.$message({
                            type: 'success',
                            message: '工单已完成'
                        });
                        
                        // 模拟API调用成功后更新本地数据
                        const index = this.orderList.findIndex(item => item.id === this.selectedOrder.id);
                        if (index !== -1) {
                            this.orderList[index].status = 'completed';
                            this.orderList[index].complete_time = new Date().toISOString().replace('T', ' ').substring(0, 19);
                            this.orderList[index].process_result = this.completeForm.process_result;
                            this.orderList[index].result_type = this.completeForm.result_type;
                            this.orderList[index].cost = this.completeForm.cost;
                            this.orderList[index].parts = [...this.completeForm.parts];
                            
                            // 添加历史记录
                            if (this.selectedOrder.id === this.orderList[index].id) {
                                this.maintenanceHistory.push({
                                    time: this.orderList[index].complete_time,
                                    type: 'complete',
                                    title: '完成维修',
                                    content: this.completeForm.process_result,
                                    operator: this.orderList[index].assignee
                                });
                            }
                            
                            this.handleSearch(); // 重新筛选
                        }
                        this.completeDialogVisible = false;
                    } catch (error) {
                        console.error('完成工单失败:', error);
                        this.$message.error('完成工单失败');
                    }
                }
            });
        },
        
        // 日期禁用
        disabledDate(time) {
            return time.getTime() < Date.now() - 8.64e7; // 禁用今天之前的日期
        },
        
        // 零件标签相关
        handlePartClose(tag) {
            this.completeForm.parts.splice(this.completeForm.parts.indexOf(tag), 1);
        },
        
        showPartInput() {
            this.inputPartVisible = true;
            this.$nextTick(_ => {
                this.$refs.savePartInput.$refs.input.focus();
            });
        },
        
        handlePartInputConfirm() {
            if (this.inputPartValue) {
                if (!this.completeForm.parts.includes(this.inputPartValue)) {
                    this.completeForm.parts.push(this.inputPartValue);
                }
            }
            this.inputPartVisible = false;
            this.inputPartValue = '';
        },
        
        // 获取待处理工单数量
        getPendingOrdersCount() {
            return this.orderList.filter(order => order.status === 'pending').length;
        },
        
        // 获取处理中工单数量
        getProcessingOrdersCount() {
            return this.orderList.filter(order => order.status === 'processing').length;
        },
        
        // 导出维修数据
        exportMaintenanceData() {
            this.$confirm('确定要导出维修数据吗?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'info'
            }).then(() => {
                // 这里应该调用API导出数据
                this.$message({
                    type: 'success',
                    message: '维修数据导出成功，请在下载中心查看'
                });
                
                // 实际项目中，这里应该触发文件下载
                // 例如：window.open('/api/maintenance/export');
            }).catch(() => {
                // 取消操作
            });
        }
    }
}
</script>

<style scoped>
.main {
    padding: 20px;
}

.search-box {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 15px;
}

.search-input {
    width: 250px;
}

.filter-select {
    width: 150px;
}

.date-range-picker {
    width: 320px;
}

.order-container {
    min-height: 400px;
}

.order-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
}

.order-card {
    width: 100%;
    transition: all 0.3s;
    cursor: pointer;
}

.order-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
}

.order-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.order-number {
    font-weight: bold;
    font-size: 16px;
}

.order-date {
    color: #909399;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.order-content {
    margin-bottom: 15px;
}

.equipment-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 15px;
}

.info-item {
    display: flex;
    align-items: center;
}

.label {
    color: #606266;
    margin-right: 5px;
    font-size: 14px;
    min-width: 70px;
}

.value {
    color: #303133;
    font-size: 14px;
}

.description-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.order-description {
    margin-top: 10px;
}

.order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #ebeef5;
}

.assignee-info {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #606266;
    font-size: 13px;
}

.order-actions {
    display: flex;
    gap: 10px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}

/* 详情对话框 */
.order-detail-dialog .el-dialog__body {
    padding: 20px 30px;
}

.dialog-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
    gap: 15px;
}

.detail-section {
    margin-bottom: 25px;
}

.detail-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 15px;
}

.detail-item {
    display: flex;
    align-items: flex-start;
}

.detail-label {
    color: #606266;
    margin-right: 10px;
    font-size: 14px;
    min-width: 80px;
    font-weight: bold;
}

.detail-value {
    color: #303133;
    font-size: 14px;
}

.full-width {
    grid-column: span 3;
}

.description-content {
    background-color: #f8f8f8;
    padding: 10px 15px;
    border-radius: 4px;
    width: 100%;
    line-height: 1.6;
}

.detail-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 30px;
    gap: 10px;
}

/* 创建工单对话框 */
.create-order-dialog .el-dialog__body {
    padding: 20px 30px;
}

.step-content {
    margin: 30px 0;
    min-height: 250px;
}

.form-footer {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
}

/* 骨架屏 */
.skeleton-container {
    margin-bottom: 20px;
}

.skeleton-card {
    width: 100%;
}

.skeleton-header {
    height: 20px;
    background: #f2f2f2;
    margin-bottom: 15px;
    border-radius: 4px;
}

.skeleton-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.skeleton-title {
    height: 16px;
    background: #f2f2f2;
    width: 40%;
    border-radius: 4px;
}

.skeleton-info {
    height: 14px;
    background: #f2f2f2;
    width: 70%;
    border-radius: 4px;
}

.skeleton-footer {
    height: 14px;
    background: #f2f2f2;
    width: 30%;
    margin-top: 15px;
    border-radius: 4px;
}

/* 标签样式 */
.part-tag {
    margin-right: 10px;
    margin-bottom: 10px;
}

.input-new-tag {
    width: 120px;
    margin-right: 10px;
    vertical-align: bottom;
}

/* 统计卡片 */
.stats-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 20px;
}

.stat-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
}

.stat-title {
    font-size: 14px;
    color: #606266;
    margin-bottom: 10px;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
}

.stat-trend {
    display: flex;
    align-items: center;
    font-size: 12px;
}

.trend-up {
    color: #f56c6c;
}

.trend-down {
    color: #67c23a;
}

/* 维修历史记录 */
.history-timeline {
    padding: 20px;
}

.history-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* 导出按钮 */
.export-button {
    margin-left: auto;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
    .stats-container {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .detail-row {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media screen and (max-width: 768px) {
    .stats-container {
        grid-template-columns: 1fr;
    }
    
    .detail-row {
        grid-template-columns: 1fr;
    }
}
</style>