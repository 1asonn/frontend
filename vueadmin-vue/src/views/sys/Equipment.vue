<template>
    <div class="main">
        <div class="search-box">
            <el-input
                placeholder="搜索设备名称"
                v-model="searchQuery"
                class="search-input"
                prefix-icon="el-icon-search"
                @input="handleSearch"
            >
            </el-input>
            <el-select v-model="filterDepartment" placeholder="所属科室" @change="handleSearch" class="filter-select">
                <el-option label="全部" value=""></el-option>
                <el-option 
                    v-for="dept in departmentOptions" 
                    :key="dept.id" 
                    :label="dept.name" 
                    :value="dept.id">
                </el-option>
            </el-select>
            <el-select v-model="filterStatus" placeholder="设备状态" @change="handleSearch" class="filter-select">
                <el-option label="全部" value=""></el-option>
                <el-option label="正常" value="normal"></el-option>
                <el-option label="维修中" value="maintenance"></el-option>
                <el-option label="报废" value="scrapped"></el-option>
            </el-select>
            <el-button type="primary" icon="el-icon-plus" @click="showAddEquipmentDialog">新增设备</el-button>
        </div>
        <div v-loading="loading" class="equipment-container">
            <template v-if="loading">
                <div class="skeleton-container" v-for="i in 6" :key="'skeleton-' + i">
                    <el-card class="skeleton-card">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-info"></div>
                            <div class="skeleton-info"></div>
                            <div class="skeleton-footer"></div>
                        </div>
                    </el-card>
                </div>
            </template>
            <div class="empty-data" v-else-if="filteredEquipmentList.length === 0">
                <el-empty description="暂无设备数据" :image-size="200">
                    <!-- <el-button type="primary" @click="openAddDialog">添加设备</el-button> -->
                </el-empty>
            </div>
            <div class="container" v-for="item in filteredEquipmentList" :key="item.id">
                <el-card :body-style="{ position:'relative', padding: '0px' }" class="equipment-card" shadow="hover">
                    <div class="image-container">
                        <img :src="item.image_url" @click="checkDetail(item)" class="image">
                        <div class="overlay">
                            <i class="el-icon-view"></i>
                            <span>查看详情</span>
                        </div>
                    </div>
                    <div style="position:relative;padding: 14px;">
                        <div class="equipment-title">
                            <span class="equipment-name">{{ item.name }}</span>
                            <el-tooltip :content="formatStatus(item.status)" placement="top">
                                <span class="equipment-status-dot" :class="getStatusClass(item.status)"></span>
                            </el-tooltip>
                        </div>
                        <div class="equipment-info">
                            <span class="equipment-code">编号: {{ item.equipment_code }}</span>
                            <span class="equipment-department">科室: {{ item.department }}</span>
                        </div>
                        <div class="equipment-meta">
                            <span><i class="el-icon-location"></i> {{ item.location || '未设置' }}</span>
                            <span><i class="el-icon-date"></i> {{ formatDate(item.purchase_date) }}</span>
                        </div>
                        <div class="bottom">
                            <el-button type="primary" size="mini" icon="el-icon-edit" @click="editDetail(item)">编辑</el-button>
                            <el-button type="info" size="mini" icon="el-icon-document" @click="showMaintenanceRecords(item)">维护记录</el-button>
                        </div>
                    </div>
                </el-card>
                <el-dialog
                    :title="selectedEquipment.name"
                    :visible.sync="dialogVisible"
                    width="60%"
                    :before-close="handleDetailClose"
                    custom-class="equipment-detail-dialog">
                    <div class="detail-header">
                        <el-tag :type="getStatusTagType(selectedEquipment.status)" effect="dark" size="medium">
                            {{ formatStatus(selectedEquipment.status) }}
                        </el-tag>
                        <div class="detail-actions">
                            <el-button type="primary" size="small" icon="el-icon-edit" @click="editFromDetail">编辑设备</el-button>
                            <el-button type="success" size="small" icon="el-icon-document" @click="showMaintenanceRecords">维护记录</el-button>
                            <el-button type="info" size="small" icon="el-icon-printer" @click="printEquipmentDetail">打印信息</el-button>
                            <el-button type="warning" size="small" icon="el-icon-data-analysis" @click="showAIHealthReport(selectedEquipment)">AI健康报表</el-button>
                        </div>
                    </div>
                    
                    <el-divider content-position="left">
                        <i class="el-icon-info"></i> 基本信息
                    </el-divider>
                    
                    <div class="detail-body">
                        <div class="detail-image-container">
                            <el-image 
                                class="detail-image"
                                fit="contain"
                                :src="selectedEquipment.image_url" 
                                :preview-src-list="[selectedEquipment.image_url]">
                                <div slot="error" class="image-error">
                                    <i class="el-icon-picture-outline"></i>
                                    <p>暂无图片</p>
                                </div>
                            </el-image>
                            <div class="image-caption">设备实拍图</div>
                        </div>
                        
                        <div class="detail-info">
                            <div class="info-group">
                                <div class="info-item">
                                    <span class="info-label">设备编号</span>
                                    <span class="info-value">{{ selectedEquipment.equipment_code || '暂无' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">所属科室</span>
                                    <span class="info-value">{{ selectedEquipment.department || '暂无' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">存放位置</span>
                                    <span class="info-value">{{ selectedEquipment.location || '暂无' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">设备型号</span>
                                    <span class="info-value">{{ selectedEquipment.model || '暂无' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">制造商</span>
                                    <span class="info-value">{{ selectedEquipment.manufacturer || '暂无' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <el-divider content-position="left">
                        <i class="el-icon-date"></i> 时间信息
                    </el-divider>
                    
                    <div class="detail-timeline">
                        <el-timeline>
                            <el-timeline-item
                                :timestamp="formatDate(selectedEquipment.purchase_date)"
                                placement="top"
                                :color="'#409EFF'">
                                <div class="timeline-content">
                                    <h4>采购日期</h4>
                                    <p v-if="selectedEquipment.purchase_price">采购价格: {{ selectedEquipment.purchase_price }} 元</p>
                                </div>
                            </el-timeline-item>
                            <el-timeline-item
                                :timestamp="formatDate(selectedEquipment.warranty_period)"
                                placement="top"
                                :color="isWarrantyExpired(selectedEquipment.warranty_period) ? '#F56C6C' : '#67C23A'">
                                <div class="timeline-content">
                                    <h4>保修期限</h4>
                                    <p>{{ isWarrantyExpired(selectedEquipment.warranty_period) ? '保修已过期' : '在保修期内' }}</p>
                                </div>
                            </el-timeline-item>
                            <el-timeline-item
                                :timestamp="formatDate(selectedEquipment.next_maintenance_date)"
                                placement="top"
                                :color="isMaintenanceDue(selectedEquipment.next_maintenance_date) ? '#E6A23C' : '#909399'">
                                <div class="timeline-content">
                                    <h4>下次维护日期</h4>
                                    <p>{{ getMaintenanceStatus(selectedEquipment.next_maintenance_date) }}</p>
                                </div>
                            </el-timeline-item>
                        </el-timeline>
                    </div>
                    
                    <el-divider content-position="left">
                        <i class="el-icon-user"></i> 联系信息
                    </el-divider>
                    
                    <div class="detail-contact">
                        <div class="contact-card">
                            <div class="contact-avatar">
                                <i class="el-icon-user-solid"></i>
                            </div>
                            <div class="contact-info">
                                <h3>{{ selectedEquipment.responsible_person || '暂无负责人' }}</h3>
                                <p v-if="selectedEquipment.contact_number">
                                    <i class="el-icon-phone"></i> {{ selectedEquipment.contact_number }}
                                    <el-button type="text" size="mini" @click="copyContactNumber" class="copy-btn">复制</el-button>
                                </p>
                                <p v-else>暂无联系方式</p>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="selectedEquipment.description" class="detail-description">
                        <el-divider content-position="left">
                            <i class="el-icon-document"></i> 设备描述
                        </el-divider>
                        <div class="description-content">
                            {{ selectedEquipment.description }}
                        </div>
                    </div>
                    
                    <span slot="footer" class="dialog-footer">
                        <el-button @click="dialogVisible = false">关闭</el-button>
                        <el-button type="primary" @click="editFromDetail">编辑设备</el-button>
                    </span>
                </el-dialog>
                <el-dialog
                    :title="'编辑设备 - ' + selectedEquipment.name"
                    :visible.sync="EditdialogVisible"
                    width="65%"
                    :before-close="handleEditClose"
                    :fullscreen="isFullscreen"
                    custom-class="equipment-edit-dialog"
                    @open="onEditDialogOpen">
                    <div class="dialog-toolbar">
                        <el-button type="text" @click="toggleFullscreen">
                            <i :class="isFullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
                            {{ isFullscreen ? '退出全屏' : '全屏编辑' }}
                        </el-button>
                        <el-button type="text" @click="resetForm" v-if="formChanged">
                            <i class="el-icon-refresh-left"></i> 重置表单
                        </el-button>
                    </div>
                    <el-form v-if="EditdialogVisible" :model="editForm" :rules="rules" :ref="'editForm' + selectedEquipment.id" label-width="100px" class="edit-equipment-form" @change="onFormChange">
                        <!-- 表单步骤指示器 -->
                        <el-steps :active="activeStepIndex" finish-status="success" simple style="margin-bottom: 20px">
                            <el-step title="基本信息" icon="el-icon-document"></el-step>
                            <el-step title="时间信息" icon="el-icon-date"></el-step>
                            <el-step title="联系信息" icon="el-icon-user"></el-step>
                            <el-step title="设备图片" icon="el-icon-picture"></el-step>
                        </el-steps>
                        <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
                            <el-tab-pane label="基本信息" name="basic">
                                <el-row :gutter="20">
                                    <el-col :span="12">
                                        <el-form-item label="设备名称" prop="name">
                                            <el-input v-model="editForm.name" placeholder="请输入设备名称"></el-input>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="12">
                                        <el-form-item label="设备编号" prop="equipment_code">
                                            <el-input v-model="editForm.equipment_code" placeholder="请输入设备编号"></el-input>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                
                                <el-row :gutter="20">
                                    <el-col :span="12">
                                        <el-form-item label="设备型号" prop="model">
                                            <el-input v-model="editForm.model" placeholder="请输入设备型号"></el-input>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="12">
                                        <el-form-item label="制造商" prop="manufacturer">
                                            <el-input v-model="editForm.manufacturer" placeholder="请输入制造商名称"></el-input>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                
                                <el-row :gutter="20">
                                    <el-col :span="12">
                                        <el-form-item label="所属科室" prop="department">
                                            <el-select v-model="editForm.department" placeholder="请选择所属科室" style="width: 100%">
                                                <el-option 
                                                    v-for="dept in departmentOptions" 
                                                    :key="dept.id" 
                                                    :label="dept.name" 
                                                    :value="dept.name">
                                                </el-option>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="12">
                                        <el-form-item label="存放位置" prop="location">
                                            <el-input v-model="editForm.location" placeholder="请输入设备存放位置"></el-input>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                
                                <el-row :gutter="20">
                                    <el-col :span="12">
                                        <el-form-item label="设备状态" prop="status">
                                            <el-select v-model="editForm.status" placeholder="请选择设备状态" style="width: 100%">
                                                <el-option label="正常" value="normal">
                                                    <span style="float: left">正常</span>
                                                    <span style="float: right; color: #67C23A; font-size: 13px">在用</span>
                                                </el-option>
                                                <el-option label="维修中" value="maintenance">
                                                    <span style="float: left">维修中</span>
                                                    <span style="float: right; color: #E6A23C; font-size: 13px">暂停使用</span>
                                                </el-option>
                                                <el-option label="报废" value="scrapped">
                                                    <span style="float: left">报废</span>
                                                    <span style="float: right; color: #F56C6C; font-size: 13px">不可用</span>
                                                </el-option>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="12">
                                        <el-form-item label="使用年限" prop="service_life">
                                            <el-input-number v-model="editForm.service_life" :min="1" :max="20" style="width: 100%"></el-input-number>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </el-tab-pane>
                            
                            <el-tab-pane label="时间信息" name="time">
                                <el-row :gutter="20">
                                    <el-col :span="12">
                                        <el-form-item label="采购日期" prop="purchase_date">
                                            <el-date-picker
                                                v-model="editForm.purchase_date"
                                                type="date"
                                                placeholder="选择采购日期"
                                                value-format="yyyy-MM-dd"
                                                style="width: 100%">
                                            </el-date-picker>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="12">
                                        <el-form-item label="保修期至" prop="warranty_period">
                                            <el-date-picker
                                                v-model="editForm.warranty_period"
                                                type="date"
                                                placeholder="选择保修期限"
                                                value-format="yyyy-MM-dd"
                                                style="width: 100%">
                                            </el-date-picker>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                
                                <el-row :gutter="20">
                                    <el-col :span="12">
                                        <el-form-item label="下次维护" prop="next_maintenance_date">
                                            <el-date-picker
                                                v-model="editForm.next_maintenance_date"
                                                type="date"
                                                placeholder="选择下次维护日期"
                                                value-format="yyyy-MM-dd"
                                                style="width: 100%">
                                            </el-date-picker>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                            </el-tab-pane>
                            
                            <el-tab-pane label="联系信息" name="contact">
                                <el-row :gutter="20">
                                    <el-col :span="12">
                                        <el-form-item label="负责人" prop="responsible_person">
                                            <el-input v-model="editForm.responsible_person" placeholder="请输入负责人姓名"></el-input>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="12">
                                        <el-form-item label="联系电话" prop="contact_number">
                                            <el-input v-model="editForm.contact_number" placeholder="请输入联系电话"></el-input>
                                        </el-form-item>
                                    </el-col>
                                </el-row>
                                
                                <el-form-item label="备注" prop="description">
                                    <el-input type="textarea" v-model="editForm.description" :rows="3" placeholder="请输入备注信息"></el-input>
                                </el-form-item>
                            </el-tab-pane>
                            
                            <el-tab-pane label="设备图片" name="image">
                                <div class="image-upload-container">
                                    <el-upload
                                        class="equipment-uploader"
                                        action="#"
                                        :show-file-list="false"
                                        :http-request="handleEditUploadRequest"
                                        :before-upload="beforeUpload"
                                        drag>
                                        <div v-if="!editForm.imagePreview && !editForm.image_url" class="upload-placeholder">
                                            <i class="el-icon-upload"></i>
                                            <div class="el-upload__text">拖放图片到此处或 <em>点击上传</em></div>
                                            <div class="el-upload__tip">只能上传 jpg/png 文件，且不超过 2MB</div>
                                        </div>
                                        <div v-else class="image-preview-wrapper">
                                            <img :src="editForm.imagePreview || editForm.image_url" class="equipment-image">
                                            <div class="image-preview-actions">
                                                <el-button size="mini" type="danger" icon="el-icon-delete" circle @click.stop="removeUploadedImage"></el-button>
                                                <el-button size="mini" type="primary" icon="el-icon-zoom-in" circle @click.stop="previewImage(editForm.imagePreview || editForm.image_url)"></el-button>
                                            </div>
                                        </div>
                                    </el-upload>
                                    <el-progress 
                                        v-if="uploadProgress > 0 && uploadProgress < 100" 
                                        :percentage="uploadProgress" 
                                        :stroke-width="6"
                                        status="success">
                                    </el-progress>
                                    <div v-if="editForm.imagePreview && uploadProgress === 100" class="upload-success-message">
                                        <i class="el-icon-check"></i> 图片已上传成功
                                    </div>
                                </div>
                            </el-tab-pane>
                        </el-tabs>
                    </el-form>
                    <span slot="footer" class="dialog-footer">
                        <el-button @click="handleEditClose" :disabled="submitLoading">取消</el-button>
                        <el-button v-if="activeStepIndex > 0" icon="el-icon-arrow-left" @click="prevStep">上一步</el-button>
                        <el-button v-if="activeStepIndex < 3" type="primary" icon="el-icon-arrow-right" @click="nextStep">下一步</el-button>
                        <el-button v-else type="primary" @click="submitFormDirectly" :loading="submitLoading" icon="el-icon-check">保存修改</el-button>
                    </span>
                </el-dialog>
            </div>
        </div>
        <div class="pagination-container" v-if="pagination.total > 0">
            <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="pagination.page"
                :page-sizes="[5, 10, 20, 50]"
                :page-size="pagination.size"
                layout="total, sizes, prev, pager, next, jumper"
                :total="pagination.total">
            </el-pagination>
        </div>
        
        <!-- 新增设备弹窗 -->
        <el-dialog
            title="新增设备"
            :visible.sync="addDialogVisible"
            width="65%"
            :before-close="handleAddClose"
            :fullscreen="isAddFullscreen"
            custom-class="equipment-add-dialog"
            @open="onAddDialogOpen">
            
            <!-- 顶部工具栏 -->
            <div class="dialog-toolbar">
                <el-button type="text" @click="toggleAddFullscreen">
                    <i :class="isAddFullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
                    {{ isAddFullscreen ? '退出全屏' : '全屏编辑' }}
                </el-button>
                <el-dropdown @command="handleQuickTemplate">
                    <el-button type="text">
                        <i class="el-icon-magic-stick"></i> 快速模板 <i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <el-dropdown-item command="template1">放射科设备模板</el-dropdown-item>
                        <el-dropdown-item command="template2">检验科设备模板</el-dropdown-item>
                        <el-dropdown-item command="template3">手术室设备模板</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </div>
            
            <el-form :model="addForm" :rules="rules" ref="addForm" label-width="120px" class="add-equipment-form">
                <!-- 表单步骤指示器 -->
                <el-steps :active="addActiveStepIndex" finish-status="success" simple style="margin-bottom: 20px">
                    <el-step title="基本信息" icon="el-icon-document"></el-step>
                    <el-step title="详细信息" icon="el-icon-notebook-2"></el-step>
                    <el-step title="联系信息" icon="el-icon-user"></el-step>
                    <el-step title="设备图片" icon="el-icon-picture"></el-step>
                </el-steps>
                <!-- 基本信息表单 - 步骤1 -->
                <div v-if="addActiveStepIndex === 0">
                    <div class="form-section">
                        <div class="form-section-title">
                            <i class="el-icon-info"></i> 设备基本信息
                        </div>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="设备名称" prop="name">
                                    <el-input v-model="addForm.name" placeholder="请输入设备名称"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="设备编号" prop="equipment_code">
                                    <el-input v-model="addForm.equipment_code" placeholder="请输入设备编号">
                                        <el-button slot="append" @click="generateEquipmentCode" type="primary">自动生成</el-button>
                                    </el-input>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="设备型号" prop="model">
                                    <el-input v-model="addForm.model" placeholder="请输入设备型号"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="生产厂商" prop="manufacturer">
                                    <el-input v-model="addForm.manufacturer" placeholder="请输入生产厂商"></el-input>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="所属科室" prop="department">
                                    <el-select v-model="addForm.department" placeholder="请选择科室" style="width: 100%">
                                        <el-option 
                                            v-for="dept in departmentOptions" 
                                            :key="dept.id" 
                                            :label="dept.name" 
                                            :value="dept.id">
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="设备状态" prop="status">
                                    <el-select v-model="addForm.status" placeholder="请选择状态" style="width: 100%">
                                        <el-option label="正常" value="normal">
                                            <span style="float: left">正常</span>
                                            <span style="float: right; color: #67C23A; font-size: 13px">在用</span>
                                        </el-option>
                                        <el-option label="维修中" value="maintenance">
                                            <span style="float: left">维修中</span>
                                            <span style="float: right; color: #E6A23C; font-size: 13px">暂停使用</span>
                                        </el-option>
                                        <el-option label="报废" value="scrapped">
                                            <span style="float: left">报废</span>
                                            <span style="float: right; color: #F56C6C; font-size: 13px">不可用</span>
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </div>
                </div>
                
                <!-- 详细信息表单 - 步骤2 -->
                <div v-if="addActiveStepIndex === 1">
                    <div class="form-section">
                        <div class="form-section-title">
                            <i class="el-icon-notebook-2"></i> 设备详细信息
                        </div>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="存放位置" prop="location">
                                    <el-input v-model="addForm.location" placeholder="请输入设备存放位置"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="采购价格" prop="purchase_price">
                                    <el-input v-model="addForm.purchase_price" type="number" placeholder="请输入采购价格">
                                        <template slot="append">元</template>
                                    </el-input>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="采购日期" prop="purchase_date">
                                    <el-date-picker
                                        v-model="addForm.purchase_date"
                                        type="date"
                                        placeholder="选择采购日期"
                                        value-format="yyyy-MM-dd"
                                        style="width: 100%">
                                    </el-date-picker>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="保修期限" prop="warranty_period">
                                    <el-date-picker
                                        v-model="addForm.warranty_period"
                                        type="date"
                                        placeholder="选择保修期限"
                                        value-format="yyyy-MM-dd"
                                        style="width: 100%">
                                    </el-date-picker>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="预计使用年限" prop="service_life">
                                    <el-input-number v-model="addForm.service_life" :min="1" :max="20" style="width: 100%"></el-input-number>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="下次维护日期" prop="next_maintenance_date">
                                    <el-date-picker
                                        v-model="addForm.next_maintenance_date"
                                        type="date"
                                        placeholder="选择下次维护日期"
                                        value-format="yyyy-MM-dd"
                                        style="width: 100%">
                                    </el-date-picker>
                                </el-form-item>
                            </el-col>
                        </el-row>
                    </div>
                </div>
                
                <!-- 联系信息表单 - 步骤3 -->
                <div v-if="addActiveStepIndex === 2">
                    <div class="form-section">
                        <div class="form-section-title">
                            <i class="el-icon-user"></i> 联系人信息
                        </div>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item label="负责人" prop="responsible_person">
                                    <el-input v-model="addForm.responsible_person" placeholder="请输入负责人姓名"></el-input>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="联系电话" prop="contact_number">
                                    <el-input v-model="addForm.contact_number" placeholder="请输入联系电话"></el-input>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        
                        <el-form-item label="设备描述" prop="description">
                            <el-input type="textarea" v-model="addForm.description" :rows="4" placeholder="请输入设备描述或备注信息"></el-input>
                        </el-form-item>
                    </div>
                </div>
                
                <!-- 设备图片 - 步骤4 -->
                <div v-if="addActiveStepIndex === 3">
                    <div class="form-section">
                        <div class="form-section-title">
                            <i class="el-icon-picture"></i> 设备图片
                        </div>
                        <div class="image-upload-container">
                            <el-upload
                                class="equipment-uploader"
                                action="#"
                                :show-file-list="false"
                                :before-upload="beforeUpload"
                                :http-request="handleUploadRequest"
                                :on-success="handleAddUploadSuccess"
                                drag>
                                <div v-if="!addForm.image_url" class="upload-placeholder">
                                    <i class="el-icon-upload equipment-uploader-icon"></i>
                                    <div class="el-upload__text">拖放图片到此处或 <em>点击上传</em></div>
                                    <div class="el-upload__tip">只能上传 jpg/png 文件，且不超过 2MB</div>
                                </div>
                                <div v-else class="image-preview-wrapper">
                                    <img :src="addForm.image_url" class="equipment-image">
                                    <div class="image-preview-actions">
                                        <el-button size="mini" type="danger" icon="el-icon-delete" circle @click.stop="removeAddUploadedImage"></el-button>
                                        <el-button size="mini" type="primary" icon="el-icon-zoom-in" circle @click.stop="previewImage(addForm.image_url)"></el-button>
                                    </div>
                                </div>
                            </el-upload>
                            <el-progress 
                                v-if="addUploadProgress > 0 && addUploadProgress < 100" 
                                :percentage="addUploadProgress" 
                                :stroke-width="6"
                                status="success">
                            </el-progress>
                            <div v-if="addForm.image_url && addUploadProgress === 100" class="upload-success-message">
                                <i class="el-icon-check"></i> 图片已上传成功
                            </div>
                        </div>
                    </div>
                </div>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="handleAddClose" :disabled="addSubmitLoading">取 消</el-button>
                <el-button v-if="addActiveStepIndex > 0" icon="el-icon-arrow-left" @click="prevAddStep">上一步</el-button>
                <el-button v-if="addActiveStepIndex < 3" type="primary" icon="el-icon-arrow-right" @click="nextAddStep">下一步</el-button>
                <el-button v-else type="primary" @click="submitAddForm('addForm')" :loading="addSubmitLoading" icon="el-icon-check">创建设备</el-button>
            </span>
        </el-dialog>

        <!-- 设备维护记录对话框 -->
        <el-dialog
            title="设备维护记录"
            :visible.sync="maintenanceRecordsVisible"
            width="80%"
            custom-class="maintenance-records-dialog">
            <div class="filter-container">
                <el-form :inline="true" :model="maintenanceFilter" class="filter-form">
                    <el-form-item label="开始日期">
                        <el-date-picker
                            v-model="maintenanceFilter.startDate"
                            type="date"
                            placeholder="选择开始日期"
                            value-format="yyyy-MM-dd"
                            @change="fetchMaintenanceRecords">
                        </el-date-picker>
                    </el-form-item>
                    <el-form-item label="结束日期">
                        <el-date-picker
                            v-model="maintenanceFilter.endDate"
                            type="date"
                            placeholder="选择结束日期"
                            value-format="yyyy-MM-dd"
                            @change="fetchMaintenanceRecords">
                        </el-date-picker>
                    </el-form-item>
                    <el-form-item label="维护类型">
                        <el-select v-model="maintenanceFilter.maintenanceType" placeholder="全部类型" @change="fetchMaintenanceRecords">
                            <el-option label="全部" value=""></el-option>
                            <el-option label="预防性维护" value="preventive"></el-option>
                            <el-option label="故障维修" value="repair"></el-option>
                            <el-option label="校准" value="calibration"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="状态">
                        <el-select v-model="maintenanceFilter.status" placeholder="全部状态" @change="fetchMaintenanceRecords">
                            <el-option label="全部" value=""></el-option>
                            <el-option label="进行中" value="in_progress"></el-option>
                            <el-option label="已完成" value="completed"></el-option>
                            <el-option label="待处理" value="pending"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="结果">
                        <el-select v-model="maintenanceFilter.result" placeholder="全部结果" @change="fetchMaintenanceRecords">
                            <el-option label="全部" value=""></el-option>
                            <el-option label="完全修复" value="fully_fixed"></el-option>
                            <el-option label="部分修复" value="partially_fixed"></el-option>
                            <el-option label="未修复" value="not_fixed"></el-option>
                            <el-option label="已完成" value="completed"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" icon="el-icon-search" @click="fetchMaintenanceRecords">查询</el-button>
                        <el-button icon="el-icon-refresh" @click="resetMaintenanceFilter">重置</el-button>
                    </el-form-item>
                </el-form>
            </div>

            <el-table
                v-loading="maintenanceLoading"
                :data="maintenanceRecords"
                style="width: 100%"
                border>
                <el-table-column prop="order_number" label="工单编号" width="140" align="center">
                    <template slot-scope="scope">
                        <el-tooltip effect="dark" :content="`工单ID: ${scope.row.maintenance_order_id || '-'}`" placement="top">
                            <span>{{ scope.row.order_number || '-' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column label="维护类型" width="100">
                    <template slot-scope="scope">
                        <el-tag :type="getMaintenanceTypeTag(scope.row.maintenance_type)">
                            {{ formatMaintenanceType(scope.row.maintenance_type) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="start_date" label="开始日期" width="180">
                    <template slot-scope="scope">
                        {{ formatDateTime(scope.row.start_date) }}
                    </template>
                </el-table-column>
                <el-table-column prop="end_date" label="结束日期" width="180">
                    <template slot-scope="scope">
                        {{ formatDateTime(scope.row.end_date) || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="operator" label="操作人员" width="120">
                </el-table-column>
                <el-table-column prop="total_cost" label="维护费用" width="120">
                    <template slot-scope="scope">
                        {{ scope.row.total_cost ? `￥${scope.row.total_cost}` : '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="fault_description" label="故障描述" min-width="200" show-overflow-tooltip>
                </el-table-column>
                <el-table-column prop="maintenance_details" label="维修详情" min-width="200" show-overflow-tooltip>
                    <template slot-scope="scope">
                        {{ scope.row.maintenance_details || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="next_maintenance_date" label="下次维护日期" width="120" align="center">
                    <template slot-scope="scope">
                        {{ formatDate(scope.row.next_maintenance_date) || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="remarks" label="备注" min-width="120" show-overflow-tooltip>
                    <template slot-scope="scope">
                        {{ scope.row.remarks || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center" fixed="right">
                    <template slot-scope="scope">
                        <el-button type="text" size="small" @click="viewMaintenanceDetail(scope.row)">
                            <i class="el-icon-view"></i> 详情
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-container">
                <el-pagination
                    @size-change="handleMaintenanceSizeChange"
                    @current-change="handleMaintenanceCurrentChange"
                    :current-page="maintenancePagination.page"
                    :page-sizes="[5, 10, 20, 50]"
                    :page-size="maintenancePagination.size"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="maintenancePagination.total">
                </el-pagination>
            </div>
        </el-dialog>

        <!-- 工单详情对话框 -->
        <el-dialog
            title="维修工单详情"
            :visible.sync="workOrderDetailDialogVisible"
            width="70%"
            class="work-order-detail-dialog"
            @closed="handleWorkOrderDetailClosed">
            <div v-loading="workOrderDetailLoading" class="work-order-detail-container">
                <template v-if="currentWorkOrder">
                    <el-descriptions title="工单信息" :column="3" border>
                        <el-descriptions-item label="工单编号">
                            {{ currentWorkOrder.order_number || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="工单状态">
                            <el-tag :type="getStatusType(currentWorkOrder.status)">
                                {{ formatStatus(currentWorkOrder.status) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="维护类型">
                            <el-tag :type="getMaintenanceTypeTag(currentWorkOrder.maintenance_type)">
                                {{ formatMaintenanceType(currentWorkOrder.maintenance_type) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="创建时间">
                            {{ formatDateTime(currentWorkOrder.create_time) || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="开始时间">
                            {{ formatDateTime(currentWorkOrder.start_date) || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="完成时间">
                            {{ formatDateTime(currentWorkOrder.end_date) || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="报修人">
                            {{ currentWorkOrder.reporter || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="处理人">
                            {{ currentWorkOrder.assignee || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="维修费用">
                            {{ currentWorkOrder.total_cost ? '¥' + currentWorkOrder.total_cost : '无' }}
                        </el-descriptions-item>
                    </el-descriptions>
                    
                    <el-divider content-position="left">设备信息</el-divider>
                    
                    <el-descriptions :column="3" border>
                        <el-descriptions-item label="设备名称">
                            {{ currentWorkOrder.equipment_name || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="设备编号">
                            {{ currentWorkOrder.equipment_code || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="所属科室">
                            {{ currentWorkOrder.department || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="设备位置">
                            {{ currentWorkOrder.location || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="设备型号">
                            {{ currentWorkOrder.model || '无' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="制造商">
                            {{ currentWorkOrder.manufacturer || '无' }}
                        </el-descriptions-item>
                    </el-descriptions>
                    
                    <el-divider content-position="left">故障信息</el-divider>
                    
                    <div class="detail-section">
                        <div class="detail-row">
                            <div class="detail-item full-width">
                                <div class="detail-label">故障描述</div>
                                <div class="description-content">
                                    {{ currentWorkOrder.fault_description || '无故障描述' }}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-row" v-if="currentWorkOrder.images && currentWorkOrder.images.length">
                            <div class="detail-item full-width">
                                <div class="detail-label">故障图片</div>
                                <div class="fault-images">
                                    <div v-for="(image, index) in currentWorkOrder.images" :key="index" class="fault-image">
                                        <el-image 
                                            :src="image.url" 
                                            fit="cover"
                                            :preview-src-list="getImageUrlList(currentWorkOrder.images)">
                                            <div slot="error" class="image-error">
                                                <i class="el-icon-picture-outline"></i>
                                                <span>加载失败</span>
                                            </div>
                                        </el-image>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <el-divider content-position="left">维修信息</el-divider>
                    
                    <div class="detail-section">
                        <div class="detail-row">
                            <div class="detail-item full-width">
                                <div class="detail-label">维修详情</div>
                                <div class="description-content">
                                    {{ currentWorkOrder.maintenance_details || '无维修详情' }}
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-item">
                                <div class="detail-label">维修结果</div>
                                <div class="detail-value">
                                    <el-tag v-if="currentWorkOrder.result_type" :type="getResultTypeTag(currentWorkOrder.result_type)">
                                        {{ formatResultType(currentWorkOrder.result_type) }}
                                    </el-tag>
                                    <span v-else>无</span>
                                </div>
                            </div>
                            
                            <div class="detail-item">
                                <div class="detail-label">更换部件</div>
                                <div class="detail-value">
                                    <template v-if="currentWorkOrder.replaced_parts && currentWorkOrder.replaced_parts.length">
                                        <el-tag 
                                            v-for="(part, index) in currentWorkOrder.replaced_parts" 
                                            :key="index"
                                            size="medium"
                                            class="part-tag">
                                            {{ part }}
                                        </el-tag>
                                    </template>
                                    <span v-else>无</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-row">
                            <div class="detail-item full-width">
                                <div class="detail-label">备注</div>
                                <div class="description-content">
                                    {{ currentWorkOrder.remarks || '无备注' }}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <el-divider content-position="left">工单历史</el-divider>
                    
                    <div class="history-section">
                        <template v-if="workOrderHistory && workOrderHistory.length">
                            <el-timeline>
                                <el-timeline-item
                                    v-for="(history, index) in workOrderHistory"
                                    :key="index"
                                    :timestamp="formatDateTime(history.timestamp)"
                                    :type="getHistoryTypeColor(history.action_type)">
                                    <div class="history-content">
                                        <div>{{ history.description }}</div>
                                        <div class="history-operator" v-if="history.operator">
                                            操作人: {{ history.operator }}
                                        </div>
                                    </div>
                                </el-timeline-item>
                            </el-timeline>
                        </template>
                        <div v-else class="empty-history">
                            <i class="el-icon-info"></i>
                            <p>暂无工单历史记录</p>
                        </div>
                    </div>
                </template>
                <div v-else class="empty-data">
                    <el-empty description="无法加载工单详情"></el-empty>
                </div>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="workOrderDetailDialogVisible = false">关闭</el-button>
            </span>
        </el-dialog>

        <!-- 维护记录详情对话框 -->
        <el-dialog
            title="维护记录详情"
            :visible.sync="maintenanceDetailVisible"
            width="60%"
            class="maintenance-detail-dialog">
            <div v-if="selectedMaintenance" class="maintenance-detail-container">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="工单编号">
                        <el-tag size="medium">{{ selectedMaintenance.order_number || '-' }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="维护类型">
                        <el-tag :type="getMaintenanceTypeTag(selectedMaintenance.maintenance_type)">
                            {{ formatMaintenanceType(selectedMaintenance.maintenance_type) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="开始日期">
                        {{ formatDateTime(selectedMaintenance.start_date) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="结束日期">
                        {{ formatDateTime(selectedMaintenance.end_date) || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="操作人员">
                        {{ selectedMaintenance.operator || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="维护费用">
                        {{ selectedMaintenance.total_cost ? `￥${selectedMaintenance.total_cost}` : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="故障描述" :span="2">
                        {{ selectedMaintenance.fault_description || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="维修详情" :span="2">
                        {{ selectedMaintenance.maintenance_details || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="下次维护日期">
                        {{ formatDate(selectedMaintenance.next_maintenance_date) || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">
                        {{ formatDateTime(selectedMaintenance.created_at) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="备注" :span="2">
                        {{ selectedMaintenance.remarks || '-' }}
                    </el-descriptions-item>
                </el-descriptions>

                <div class="work-order-info" v-if="selectedMaintenance.maintenance_order_id">
                    <h3>关联工单信息</h3>
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="工单编号">
                            <el-tag size="medium">{{ selectedMaintenance.order_number }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="工单ID">
                            {{ selectedMaintenance.maintenance_order_id }}
                        </el-descriptions-item>
                        <el-descriptions-item label="设备ID">
                            {{ selectedMaintenance.equipment_id }}
                        </el-descriptions-item>
                        <el-descriptions-item label="创建时间">
                            {{ formatDateTime(selectedMaintenance.created_at) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="操作" :span="2">
                            <el-button 
                                type="primary" 
                                size="small" 
                                @click="viewWorkOrderDetail(selectedMaintenance.maintenance_order_id)">
                                <i class="el-icon-view"></i> 查看工单详情
                            </el-button>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
        </el-dialog>

        <!-- 工单详情对话框 -->
        <el-dialog
            title="维修工单详情"
            :visible.sync="workOrderDetailVisible"
            width="80%"
            :close-on-click-modal="false"
            custom-class="work-order-detail-dialog"
            :fullscreen="false"
            top="3vh"
            :destroy-on-close="true"
        >
            <div v-loading="workOrderLoading" element-loading-text="加载工单详情中..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)">
                <div v-if="selectedWorkOrder" class="work-order-detail-container">
                    <!-- 工单状态和基本信息头部 -->
                    <div class="work-order-header">
                        <el-card shadow="hover" class="header-card">
                            <div class="header-content">
                                <div class="work-order-status">
                                    <el-tag 
                                        :type="getStatusType(selectedWorkOrder.status)" 
                                        effect="dark"
                                        size="large"
                                        class="status-tag"
                                    >
                                        {{ formatStatus(selectedWorkOrder.status) }}
                                    </el-tag>
                                </div>
                                <div class="work-order-basic-info">
                                    <div class="order-number">
                                        <i class="el-icon-document"></i>
                                        <span class="info-label">工单编号:</span>
                                        <span class="info-value">{{ selectedWorkOrder.order_number || '暂无' }}</span>
                                    </div>
                                    <div class="order-time">
                                        <i class="el-icon-time"></i>
                                        <span class="info-label">创建时间:</span>
                                        <span class="info-value">{{ formatDateTime(selectedWorkOrder.create_time) || '暂无' }}</span>
                                    </div>
                                    <div class="maintenance-type">
                                        <i class="el-icon-s-operation"></i>
                                        <span class="info-label">维修类型:</span>
                                        <el-tag size="small" :type="getMaintenanceTypeTag(selectedWorkOrder.maintenance_type)">
                                            {{ formatMaintenanceType(selectedWorkOrder.maintenance_type) || '暂无' }}
                                        </el-tag>
                                    </div>
                                </div>
                            </div>
                        </el-card>
                    </div>

                    <!-- 信息部分 -->
                    <div class="info-section">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-card shadow="hover" class="detail-card info-card">
                                    <div slot="header" class="card-header">
                                        <i class="el-icon-cpu"></i> 设备信息
                                    </div>
                                    <div class="equipment-info">
                                        <div class="equipment-name">
                                            <el-tag type="success" size="medium" effect="dark">{{ selectedWorkOrder.equipment_name || '暂无' }}</el-tag>
                                        </div>
                                        <div class="info-grid">
                                            <div class="info-item">
                                                <div class="info-item-label">设备编号</div>
                                                <div class="info-item-value">{{ selectedWorkOrder.equipment_code || '暂无' }}</div>
                                            </div>
                                            <div class="info-item">
                                                <div class="info-item-label">设备型号</div>
                                                <div class="info-item-value">{{ selectedWorkOrder.equipment_model || '暂无' }}</div>
                                            </div>
                                            <div class="info-item">
                                                <div class="info-item-label">所属科室</div>
                                                <div class="info-item-value">{{ selectedWorkOrder.department || '暂无' }}</div>
                                            </div>
                                            <div class="info-item">
                                                <div class="info-item-label">存放位置</div>
                                                <div class="info-item-value">{{ selectedWorkOrder.location || '暂无' }}</div>
                                            </div>
                                            <div class="info-item">
                                                <div class="info-item-label">制造商</div>
                                                <div class="info-item-value">{{ selectedWorkOrder.manufacturer || '暂无' }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </el-card>
                            </el-col>
                            <el-col :span="12">
                                <el-card shadow="hover" class="detail-card info-card">
                                    <div slot="header" class="card-header">
                                        <i class="el-icon-warning"></i> 故障信息
                                    </div>
                                    <div class="fault-info">
                                        <div class="fault-type">
                                            <el-tag type="danger" size="medium" effect="dark">{{ selectedWorkOrder.fault_type || '暂无' }}</el-tag>
                                        </div>
                                        <div class="info-grid">
                                            <div class="info-item">
                                                <div class="info-item-label">报修人</div>
                                                <div class="info-item-value">{{ selectedWorkOrder.reporter || '暂无' }}</div>
                                            </div>
                                            <div class="info-item">
                                                <div class="info-item-label">联系电话</div>
                                                <div class="info-item-value">{{ selectedWorkOrder.contact_phone || '暂无' }}</div>
                                            </div>
                                        </div>
                                        
                                        <div class="fault-description">
                                            <div class="fault-description-title">故障描述</div>
                                            <div class="fault-description-content">
                                                {{ selectedWorkOrder.fault_description || '暂无故障描述' }}
                                            </div>
                                        </div>
                                    </div>
                                </el-card>
                            </el-col>
                        </el-row>
                    </div>
                    
                    <!-- 故障图片展示 -->
                    <div class="image-section" v-if="workOrderImages && workOrderImages.length > 0">
                        <el-card shadow="hover" class="detail-card image-card">
                            <div slot="header" class="card-header">
                                <i class="el-icon-picture-outline"></i> 故障图片
                                <span class="image-count">{{ workOrderImages.length }}张图片</span>
                            </div>
                            <div class="images-wrapper">
                                <el-carousel :interval="4000" type="card" height="300px" v-if="workOrderImages.length > 1" indicator-position="outside">
                                    <el-carousel-item v-for="(url, index) in workOrderImages" :key="index">
                                        <div class="carousel-item-wrapper">
                                            <el-image 
                                                :src="url"
                                                :preview-src-list="workOrderImages"
                                                fit="contain"
                                                class="carousel-image"
                                            >
                                                <div slot="error" class="image-error">
                                                    <i class="el-icon-picture-outline"></i>
                                                    <span>图片加载失败</span>
                                                </div>
                                            </el-image>
                                            <div class="image-index">{{ index + 1 }} / {{ workOrderImages.length }}</div>
                                        </div>
                                    </el-carousel-item>
                                </el-carousel>
                                
                                <div class="single-image-container" v-else>
                                    <el-image 
                                        :src="workOrderImages[0]"
                                        :preview-src-list="workOrderImages"
                                        fit="contain"
                                        class="single-fault-image"
                                    >
                                        <div slot="error" class="image-error">
                                            <i class="el-icon-picture-outline"></i>
                                            <span>图片加载失败</span>
                                        </div>
                                    </el-image>
                                </div>
                            </div>
                            
                            <div class="image-thumbnails" v-if="workOrderImages.length > 1">
                                <div 
                                    v-for="(url, index) in workOrderImages" 
                                    :key="index"
                                    class="image-thumbnail"
                                    @click="previewImage(index)"
                                >
                                    <el-image 
                                        :src="url"
                                        fit="cover"
                                        class="thumbnail-image"
                                    ></el-image>
                                </div>
                            </div>
                        </el-card>
                    </div>

                    <!-- 处理信息部分 -->
                    <div class="process-section" v-if="selectedWorkOrder.assignee">
                        <el-card shadow="hover" class="detail-card process-card">
                            <div slot="header" class="card-header">
                                <i class="el-icon-s-operation"></i> 处理信息
                                <el-tag type="primary" size="small" effect="dark" class="header-tag">处理中</el-tag>
                            </div>
                            <div class="process-info">
                                <div class="process-person">
                                    <i class="el-icon-user"></i>
                                    <span class="process-person-name">{{ selectedWorkOrder.assignee || '暂无' }}</span>
                                </div>
                                
                                <div class="process-time-info">
                                    <div class="time-item">
                                        <i class="el-icon-time"></i>
                                        <span class="time-label">处理时间：</span>
                                        <span class="time-value">{{ formatDateTime(selectedWorkOrder.process_time) || '暂无' }}</span>
                                    </div>
                                    <div class="time-item">
                                        <i class="el-icon-date"></i>
                                        <span class="time-label">预计完成：</span>
                                        <span class="time-value">{{ formatDateTime(selectedWorkOrder.estimated_time) || '暂无' }}</span>
                                    </div>
                                </div>
                                
                                <div class="process-remark" v-if="selectedWorkOrder.process_remark">
                                    <div class="remark-title">
                                        <i class="el-icon-document"></i> 处理备注
                                    </div>
                                    <div class="remark-content">
                                        {{ selectedWorkOrder.process_remark || '暂无备注' }}
                                    </div>
                                </div>
                            </div>
                        </el-card>
                    </div>

                    <!-- 完成信息部分 -->
                    <div class="complete-section" v-if="selectedWorkOrder.status === 'completed'">
                        <el-card shadow="hover" class="detail-card complete-card">
                            <div slot="header" class="card-header">
                                <i class="el-icon-finished"></i> 完成信息
                                <el-tag type="success" size="small" effect="dark" class="header-tag">已完成</el-tag>
                            </div>
                            
                            <div class="complete-info">
                                <div class="complete-header">
                                    <div class="complete-time">
                                        <i class="el-icon-time"></i>
                                        <span class="time-label">完成时间：</span>
                                        <span class="time-value">{{ formatDateTime(selectedWorkOrder.complete_time) || '暂无' }}</span>
                                    </div>
                                    
                                    <div class="result-type">
                                        <el-tag :type="getResultTypeTag(selectedWorkOrder.result_type)" effect="dark" size="medium">
                                            {{ formatResultType(selectedWorkOrder.result_type) || '暂无' }}
                                        </el-tag>
                                    </div>
                                    
                                    <div class="repair-cost" v-if="selectedWorkOrder.cost">
                                        <i class="el-icon-money"></i>
                                        <span class="cost-label">维修费用：</span>
                                        <span class="cost-value">{{ selectedWorkOrder.cost ? `￥${selectedWorkOrder.cost}` : '暂无' }}</span>
                                    </div>
                                </div>
                                
                                <div class="result-section">
                                    <div class="section-title">
                                        <i class="el-icon-document-checked"></i> 处理结果
                                    </div>
                                    <div class="section-content result-content">
                                        {{ selectedWorkOrder.process_result || '暂无处理结果' }}
                                    </div>
                                </div>
                                
                                <div class="parts-section" v-if="selectedWorkOrder.parts">
                                    <div class="section-title">
                                        <i class="el-icon-set-up"></i> 更换零件
                                    </div>
                                    <div class="parts-list">
                                        <el-tag v-for="(part, index) in formatParts(selectedWorkOrder.parts)" 
                                                :key="index" 
                                                type="warning" 
                                                effect="plain" 
                                                class="part-tag">
                                            <i class="el-icon-goods"></i> {{ part }}
                                        </el-tag>
                                        <span v-if="!selectedWorkOrder.parts" class="no-parts">暂无更换零件</span>
                                    </div>
                                </div>
                            </div>
                        </el-card>
                    </div>

                    <!-- 工单历史部分 -->
                    <div class="history-section-container">
                        <el-card shadow="hover" class="detail-card history-card-container">
                            <div slot="header" class="card-header">
                                <i class="el-icon-time"></i> 工单历史
                                <span class="history-count" v-if="workOrderHistory && workOrderHistory.length > 0">{{ workOrderHistory.length }}条记录</span>
                            </div>
                            
                            <div class="history-section">
                                <el-timeline v-if="workOrderHistory && workOrderHistory.length > 0">
                                    <el-timeline-item
                                        v-for="(history, index) in workOrderHistory"
                                        :key="index"
                                        :type="getHistoryTypeColor(history.type)"
                                        :timestamp="formatDateTime(history.time)"
                                        placement="top"
                                        :size="'large'"
                                        :icon="getHistoryIcon(history.type)"
                                    >
                                        <el-card shadow="hover" class="history-item-card">
                                            <div class="history-header">
                                                <span class="history-type-tag" :class="'history-type-' + history.type">
                                                    {{ getHistoryTypeText(history.type) }}
                                                </span>
                                                <h4 class="history-title">{{ history.title }}</h4>
                                            </div>
                                            <div class="history-body">
                                                <p class="history-content">{{ history.content }}</p>
                                            </div>
                                            <div v-if="history.operator" class="history-footer">
                                                <p class="history-operator">
                                                    <i class="el-icon-user"></i> 操作人: {{ history.operator }}
                                                </p>
                                            </div>
                                        </el-card>
                                    </el-timeline-item>
                                </el-timeline>
                                <div v-else class="empty-history">
                                    <i class="el-icon-document"></i>
                                    <p>暂无工单历史记录</p>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>
            </div>

            <span slot="footer" class="dialog-footer">
                <el-button plain @click="workOrderDetailVisible = false" icon="el-icon-back">返回</el-button>
                
                <div class="action-buttons">
                    <el-button 
                        v-if="selectedWorkOrder && selectedWorkOrder.status === 'pending'" 
                        type="success" 
                        icon="el-icon-s-operation"
                        @click="handleProcessWorkOrder(selectedWorkOrder)"
                    >处理工单</el-button>
                    
                    <el-button 
                        v-if="selectedWorkOrder && selectedWorkOrder.status === 'processing'" 
                        type="primary" 
                        icon="el-icon-finished"
                        @click="handleCompleteWorkOrder(selectedWorkOrder)"
                    >完成工单</el-button>
                    
                    <el-button 
                        v-if="selectedWorkOrder && (selectedWorkOrder.status === 'pending' || selectedWorkOrder.status === 'processing')" 
                        type="danger" 
                        icon="el-icon-close"
                        @click="handleCancelWorkOrder(selectedWorkOrder)"
                    >取消工单</el-button>
                    
                    <el-button 
                        type="info" 
                        icon="el-icon-printer"
                        @click="printWorkOrder"
                    >打印工单</el-button>
                </div>
            </span>
        </el-dialog>
            <!-- AI健康报表对话框 -->
    <el-dialog
        title="设备AI健康报表"
        :visible.sync="aiHealthReportVisible"
        width="65%"
        class="ai-health-report-dialog"
        :before-close="handleAIHealthReportClose"
    >
        <div v-loading="aiHealthReportLoading">
            <div v-if="currentEquipmentForReport" class="report-header">
                <div class="equipment-info-box">
                    <div class="equipment-image">
                        <el-image
                            :src="currentEquipmentForReport.image_url"
                            fit="cover"
                            :preview-src-list="[currentEquipmentForReport.image_url]"
                        >
                            <div slot="error" class="image-error">
                                <i class="el-icon-picture-outline"></i>
                            </div>
                        </el-image>
                    </div>
                    <div class="equipment-info">
                        <h3>{{ currentEquipmentForReport.name }}</h3>
                        <p><span class="info-label">设备编号：</span>{{ currentEquipmentForReport.equipment_code }}</p>
                        <p><span class="info-label">科室：</span>{{ currentEquipmentForReport.department }}</p>
                        <p><span class="info-label">位置：</span>{{ currentEquipmentForReport.location || '未设置' }}</p>
                        <p><span class="info-label">状态：</span>
                            <el-tag :type="getStatusType(currentEquipmentForReport.status)" size="small">
                                {{ formatStatus(currentEquipmentForReport.status) }}
                            </el-tag>
                        </p>
                    </div>
                </div>

                <div class="health-score-box">
                    <div class="health-score">
                        <el-progress type="dashboard" :percentage="healthReport.score" :stroke-width="6" :color="getHealthScoreColor"></el-progress>
                        <div class="score-label">健康评分</div>
                    </div>
                    <div class="health-status">
                        <div class="status-title">当前状态</div>
                        <div class="status-value" :class="getHealthStatusClass">{{ healthReport.status }}</div>
                    </div>
                </div>
            </div>

            <el-divider content-position="left">设备健康分析</el-divider>

            <div class="report-metrics">
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-card shadow="hover" class="metric-card">
                            <div slot="header" class="metric-header">
                                <i class="el-icon-time"></i>
                                <span>上次维护</span>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value">{{ healthReport.lastMaintenance ? formatDate(healthReport.lastMaintenance) : '无记录' }}</div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card shadow="hover" class="metric-card">
                            <div slot="header" class="metric-header">
                                <i class="el-icon-date"></i>
                                <span>下次维护</span>
                            </div>
                            <div class="metric-content">
                                <div class="metric-value" :class="{warning: isMaintenanceSoon, danger: isMaintenanceOverdue}">{{ healthReport.nextMaintenance ? formatDate(healthReport.nextMaintenance) : '未安排' }}</div>
                                <div v-if="isMaintenanceOverdue" class="metric-alert">已逾期</div>
                                <div v-else-if="isMaintenanceSoon" class="metric-alert">即将到期</div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="8">
                        <el-card shadow="hover" class="metric-card">
                            <div slot="header" class="metric-header">
                                <i class="el-icon-warning"></i>
                                <span>故障风险</span>
                            </div>
                            <div class="metric-content">
                                <el-progress :percentage="healthReport.failureRisk" :color="getFailureRiskColor" :stroke-width="10" :show-text="false"></el-progress>
                                <div class="risk-level" :class="getFailureRiskClass">{{ getFailureRiskText }}</div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </div>

            <el-divider content-position="left">AI维护建议</el-divider>

            <div class="recommendations-section">
                <el-timeline>
                    <el-timeline-item
                        v-for="(recommendation, index) in healthReport.recommendations"
                        :key="index"
                        :type="recommendation.type"
                        :color="getRecommendationColor(recommendation.priority)"
                        :timestamp="recommendation.timeframe"
                        placement="top"
                    >
                        <el-card>
                            <div class="recommendation-header">
                                <el-tag size="small" :type="getRecommendationTagType(recommendation.priority)">{{ getRecommendationPriorityText(recommendation.priority) }}</el-tag>
                                <h4>{{ recommendation.title }}</h4>
                            </div>
                            <p>{{ recommendation.description }}</p>
                            <div class="recommendation-benefits" v-if="recommendation.benefits && recommendation.benefits.length > 0">
                                <span>预期效果：</span>
                                <el-tag
                                    v-for="(benefit, bidx) in recommendation.benefits"
                                    :key="bidx"
                                    size="small"
                                    effect="plain"
                                    class="benefit-tag"
                                >{{ benefit }}</el-tag>
                            </div>
                        </el-card>
                    </el-timeline-item>
                </el-timeline>
                
                <div v-if="!healthReport.recommendations || healthReport.recommendations.length === 0" class="empty-recommendations">
                    <i class="el-icon-success"></i>
                    <p>当前设备运行良好，无特别维护建议</p>
                </div>
            </div>

            <el-divider content-position="left">历史健康记录</el-divider>

            <div class="health-history-section">
                <el-table
                    :data="healthReport.history"
                    style="width: 100%"
                    border
                    :empty-text="'暂无历史健康记录'"
                >
                    <el-table-column prop="date" label="日期" width="120" align="center">
                        <template slot-scope="scope">
                            {{ formatDate(scope.row.date) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="score" label="健康评分" width="100" align="center">
                        <template slot-scope="scope">
                            <span :class="getScoreClass(scope.row.score)">{{ scope.row.score }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="设备状态" width="120" align="center">
                        <template slot-scope="scope">
                            <el-tag :type="getStatusReportType(scope.row.status)" size="small">{{ scope.row.status }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="event" label="事件" min-width="200">
                        <template slot-scope="scope">
                            {{ scope.row.event }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="failureRisk" label="故障风险" width="120" align="center">
                        <template slot-scope="scope">
                            <el-progress :percentage="scope.row.failureRisk" :color="getHistoryRiskColor(scope.row.failureRisk)" :stroke-width="5"></el-progress>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>

        <div v-if="!aiHealthReportLoading" slot="footer" class="dialog-footer">
            <div class="report-info">
                <p class="report-generation-info">报告生成时间: {{ formatDateTime(new Date()) }}</p>
            </div>
            <div class="action-buttons">
                <el-button @click="handleAIHealthReportClose">关闭</el-button>
                <el-button type="primary" @click="generateReport(currentEquipmentForReport.id)">重新生成报表</el-button>
                <el-button type="success" @click="exportReport">导出报表</el-button>
            </div>
        </div>
    </el-dialog>
    </div>


</template>

<script>
import { getEquipmentList, createEquipment, updateEquipment, deleteEquipment, uploadEquipmentImage, getEquipmentHealthReport, exportEquipmentHealthReport } from '@/api/equipment'
import { GetDepartmentList } from '@/api/index'
import { GetEquipmentMaintenanceHistory, GetMaintenanceOrderById, GetMaintenanceOrderHistory } from '@/api/equipmentMaintenance'

export default {
    data() {
        return {
            submitLoading: false,
            loading: false,
            searchQuery: '',
            filterDepartment: '',
            filterStatus: '',
            equipmentList: [],
            departmentOptions: [], // 科室列表选项
            pagination: {
                page: 1,
                size: 10,
                total: 0
            },
            selectedEquipment: {},
            editForm: {
                imagePreview: null
            },
            uploadProgress: 0,
            activeTab: 'basic',
            isFullscreen: false,
            formChanged: false,
            originalFormData: '',
            activeStepIndex: 0,
            isAddFullscreen: false,
            addFormChanged: false,
            addActiveStepIndex: 0,
            addSubmitLoading: false,
            addUploadProgress: 0,
            _uploadFile: null, // 保存上传的原始文件对象
            rules: {
                name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
                equipment_code: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
                department: [{ required: true, message: '请选择所属科室', trigger: 'change' }],
                status: [{ required: true, message: '请选择设备状态', trigger: 'change' }],
                model: [{ required: true, message: '请输入设备型号', trigger: 'blur' }],
                manufacturer: [{ required: true, message: '请输入生产厂商', trigger: 'blur' }],
                location: [{ required: true, message: '请输入存放位置', trigger: 'blur' }],
                purchase_date: [{ required: true, message: '请选择采购日期', trigger: 'change' }],
                warranty_period: [{ required: true, message: '请选择保修期限', trigger: 'change' }],
                responsible_person: [{ required: true, message: '请输入负责人', trigger: 'blur' }],
                contact_number: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
                purchase_price: [{ required: true, message: '请输入采购价格', trigger: 'blur' }],
                service_life: [{ required: true, message: '请输入预计使用年限', trigger: 'blur' }]
            },
            dialogVisible: false,
            EditdialogVisible: false,
            addDialogVisible: false,
            addForm: {
                name: '',
                equipment_code: '',
                department: '',
                status: 'normal',
                model: '',
                manufacturer: '',
                location: '',
                purchase_date: '',
                warranty_period: '',
                responsible_person: '',
                contact_number: '',
                purchase_price: '',
                service_life: '',
                next_maintenance_date: '',
                description: '',
                image_url: ''
            },
            // 维护记录相关
            maintenanceRecordsVisible: false,
            maintenanceLoading: false,
            maintenanceRecords: [],
            currentEquipment: null,
            maintenanceFilter: {
                startDate: '',
                endDate: '',
                maintenanceType: '',
                status: ''
            },
            // 维护记录详情对话框
            maintenanceDetailVisible: false,
            selectedMaintenance: null,
            totalMaintenanceRecords: 0,
            currentPage: 1,
            pageSize: 10,
            maintenancePagination: {
                page: 1,
                size: 10,
                total: 0
            },
            
            // 工单详情相关
            workOrderDetailDialogVisible: false,
            workOrderDetailVisible: false,
            workOrderDetailLoading: false,
            workOrderLoading: false,
            currentWorkOrder: null,
            selectedWorkOrder: null,
            workOrderHistory: [],

            // AI健康报表相关
            aiHealthReportVisible: false,
            aiHealthReportLoading: false,
            currentEquipmentForReport: null,
            healthReport: {
                score: 0,
                status: '',
                lastMaintenance: null,
                nextMaintenance: null,
                maintenanceFrequency: '',
                usageRate: 0,
                failureRisk: 0,
                recommendations: [],
                history: []
            }
        };
    },
    computed: {
        filteredEquipmentList() {
            // 直接返回设备列表，筛选已由后端实现
            return this.equipmentList;
        },
        
        // 解析工单图片
        workOrderImages() {
            if (!this.selectedWorkOrder || !this.selectedWorkOrder.images) return [];
            
            try {
                if (typeof this.selectedWorkOrder.images === 'string') {
                    return JSON.parse(this.selectedWorkOrder.images);
                } else if (Array.isArray(this.selectedWorkOrder.images)) {
                    return this.selectedWorkOrder.images;
                }
            } catch (e) {
                console.error('Failed to parse work order images:', e);
            }
            
            return [];
        },

        // AI健康报表相关计算属性
        getHealthScoreColor() {
            const score = this.healthReport.score;
            if (score >= 80) return '#67C23A';  // 绿色 - 优秀
            if (score >= 60) return '#E6A23C';  // 橙色 - 一般
            return '#F56C6C';                   // 红色 - 差
        },
        
        getHealthStatusClass() {
            const score = this.healthReport.score;
            if (score >= 80) return 'status-good';
            if (score >= 60) return 'status-warning';
            return 'status-danger';
        },
        
        isMaintenanceSoon() {
            if (!this.healthReport.nextMaintenance) return false;
            const now = new Date();
            const nextMaintenance = new Date(this.healthReport.nextMaintenance);
            const daysUntilMaintenance = Math.floor((nextMaintenance - now) / (1000 * 60 * 60 * 24));
            return daysUntilMaintenance >= 0 && daysUntilMaintenance <= 15;
        },
        
        isMaintenanceOverdue() {
            if (!this.healthReport.nextMaintenance) return false;
            const now = new Date();
            const nextMaintenance = new Date(this.healthReport.nextMaintenance);
            return nextMaintenance < now;
        },
        
        getFailureRiskColor() {
            const risk = this.healthReport.failureRisk;
            if (risk < 30) return '#67C23A';    // 绿色 - 低风险
            if (risk < 70) return '#E6A23C';    // 橙色 - 中风险
            return '#F56C6C';                   // 红色 - 高风险
        },
        
        getFailureRiskClass() {
            const risk = this.healthReport.failureRisk;
            if (risk < 30) return 'risk-low';
            if (risk < 70) return 'risk-medium';
            return 'risk-high';
        },
        
        getFailureRiskText() {
            const risk = this.healthReport.failureRisk;
            if (risk < 30) return '低风险';
            if (risk < 70) return '中等风险';
            return '高风险';
        }
    },
    created() {
        this.getEquipmentList();
        this.fetchDepartments(); // 获取科室列表
    },
    methods: {
        // 编辑弹窗相关方法
        toggleFullscreen() {
            this.isFullscreen = !this.isFullscreen;
        },
        
        handleEditClose() {
            if (this.formChanged) {
                this.$confirm('表单已修改，确定要关闭吗？未保存的修改将丢失', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.EditdialogVisible = false;
                    this.formChanged = false;
                }).catch(() => {});
            } else {
                this.EditdialogVisible = false;
            }
        },
        
        onFormChange() {
            this.formChanged = true;
        },
        
        onEditDialogOpen() {
            this.formChanged = false;
            this.originalFormData = JSON.stringify(this.editForm);
            this.activeStepIndex = 0;
            this.mapTabToStep();
        },
        
        resetForm() {
            this.$confirm('确定要重置表单吗？所有未保存的修改将丢失', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.editForm = JSON.parse(this.originalFormData);
                this.formChanged = false;
                this.$message.success('表单已重置');
            }).catch(() => {});
        },
        
        // 维护记录相关方法
        // 显示维护记录对话框
        showMaintenanceRecords(equipment) {
            this.currentEquipment = equipment;
            this.resetMaintenanceFilter();
            this.maintenanceRecordsVisible = true;
            this.fetchMaintenanceRecords();
        },
        
        // 获取设备维护记录
        async fetchMaintenanceRecords() {
            if (!this.currentEquipment) return;
            
            this.maintenanceLoading = true;
            try {
                // 构建查询参数
                const params = {
                    page: this.maintenancePagination.page,
                    size: this.maintenancePagination.size
                };
                
                // 添加筛选条件
                if (this.maintenanceFilter.startDate) params.startDate = this.maintenanceFilter.startDate;
                if (this.maintenanceFilter.endDate) params.endDate = this.maintenanceFilter.endDate;
                if (this.maintenanceFilter.maintenanceType) params.maintenanceType = this.maintenanceFilter.maintenanceType;
                if (this.maintenanceFilter.status) params.status = this.maintenanceFilter.status;
                if (this.maintenanceFilter.result) params.result = this.maintenanceFilter.result;
                
                const response = await GetEquipmentMaintenanceHistory(this.currentEquipment.id, params);
                
                if (response && response.success) {
                    // 适应新的响应格式，使用 items 而非 records
                    this.maintenanceRecords = response.data.items || [];
                    this.maintenancePagination.total = response.data.total || 0;
                    this.maintenancePagination.page = response.data.page || 1;
                    this.maintenancePagination.size = response.data.size || 10;
                } else {
                    this.$message.error(response.message || '获取维护记录失败');
                    this.maintenanceRecords = [];
                    this.maintenancePagination.total = 0;
                }
            } catch (error) {
                console.error('获取维护记录错误:', error);
                this.$message.error(error.message || '获取维护记录失败');
                this.maintenanceRecords = [];
                this.maintenancePagination.total = 0;
            } finally {
                this.maintenanceLoading = false;
            }
        },
        
        // 重置维护记录筛选条件
        resetMaintenanceFilter() {
            this.maintenanceFilter = {
                startDate: '',
                endDate: '',
                maintenanceType: '',
                status: '',
                result: ''
            };
            this.maintenancePagination.page = 1;
            if (this.maintenanceRecordsVisible) {
                this.fetchMaintenanceRecords();
            }
        },
        
        // 查看维护记录详情
        viewMaintenanceDetail(record) {
            this.selectedMaintenance = JSON.parse(JSON.stringify(record)); // 深拷贝防止引用问题
            this.maintenanceDetailVisible = true;
        },
        
        // 查看工单详情
        viewWorkOrderDetail(workOrder) {
            this.workOrderDetailLoading = true;
            this.workOrderDetailDialogVisible = true;
            this.currentWorkOrder = null;
            this.workOrderHistory = [];
            
            // 获取工单详情
            GetMaintenanceOrderById(workOrder.id)
                .then(response => {
                    this.currentWorkOrder = response.data;
                    // 获取工单历史
                    return GetMaintenanceOrderHistory(workOrder.id);
                })
                .then(response => {
                    this.workOrderHistory = response.data || [];
                    this.workOrderDetailLoading = false;
                })
                .catch(error => {
                    console.error('获取工单详情失败:', error);
                    this.$message.error('获取工单详情失败');
                    this.workOrderDetailLoading = false;
                });
        },
        
        // 处理工单详情对话框关闭
        handleWorkOrderDetailClosed() {
            this.currentWorkOrder = null;
            this.workOrderHistory = [];
        },
        
        // 获取图片URL列表用于预览
        getImageUrlList(images) {
            if (!images || !Array.isArray(images)) return [];
            return images.map(image => image.url);
        },
        
        // 查看关联的工单详情
        async viewWorkOrderDetail(orderId) {
            // 显示加载中
            this.workOrderLoading = true;
            
            try {
                // 调用API获取工单详情
                const response = await GetMaintenanceOrderById(orderId);
                
                if (response && response.success) {
                    // 关闭当前对话框
                    this.maintenanceDetailVisible = false;
                    
                    // 设置选中的工单并显示工单详情对话框
                    this.selectedWorkOrder = response.data;
                    this.workOrderDetailVisible = true;
                    
                    // 获取工单历史记录
                    this.fetchWorkOrderHistory(orderId);
                } else {
                    this.$message.error(response.message || '获取工单详情失败');
                }
            } catch (error) {
                console.error('获取工单详情错误:', error);
                this.$message.error(error.message || '获取工单详情失败');
            } finally {
                this.workOrderLoading = false;
            }
        },
        
        // 获取工单历史记录
        async fetchWorkOrderHistory(orderId) {
            try {
                const response = await GetMaintenanceOrderHistory(orderId);
                
                if (response && response.success) {
                    this.workOrderHistory = response.data || [];
                } else {
                    this.workOrderHistory = [];
                }
            } catch (error) {
                console.error('获取工单历史记录错误:', error);
                this.workOrderHistory = [];
            }
        },
        
        // 处理维护记录分页大小变化
        handleMaintenanceSizeChange(size) {
            this.maintenancePagination.size = size;
            this.fetchMaintenanceRecords();
        },
        
        // 处理维护记录当前页变化
        handleMaintenanceCurrentChange(page) {
            this.maintenancePagination.page = page;
            this.fetchMaintenanceRecords();
        },
        
        // 格式化维护类型
        formatMaintenanceType(type) {
            const typeMap = {
                'preventive': '预防性维护',
                'corrective': '故障维修',
                'calibration': '校准',
                'inspection': '检查',
                'upgrade': '升级',
                'other': '其他'
            };
            return typeMap[type] || type || '未知';
        },
        
        // 获取维护类型标签样式
        getMaintenanceTypeTag(type) {
            const typeMap = {
                'preventive': 'info',
                'corrective': 'danger',
                'calibration': 'success',
                'inspection': 'warning',
                'upgrade': 'primary',
                'other': ''
            };
            return typeMap[type] || '';
        },
        
        // 获取工单状态类型
        getStatusType(status) {
            switch(status) {
                case 'pending': return 'warning';
                case 'processing': return 'primary';
                case 'completed': return 'success';
                case 'cancelled': return 'info';
                default: return 'info';
            }
        },
        
        // 格式化工单状态
        formatStatus(status) {
            switch(status) {
                case 'pending': return '待处理';
                case 'processing': return '处理中';
                case 'completed': return '已完成';
                case 'cancelled': return '已取消';
                default: return '未知状态';
            }
        },
        
        // 获取历史记录图标
        getHistoryIcon(type) {
            switch(type) {
                case 'create': return 'el-icon-plus';
                case 'process': return 'el-icon-s-operation';
                case 'complete': return 'el-icon-check';
                case 'cancel': return 'el-icon-close';
                default: return 'el-icon-time';
            }
        },
        
        // 获取历史记录类型文本
        getHistoryTypeText(type) {
            switch(type) {
                case 'create': return '创建';
                case 'process': return '处理';
                case 'complete': return '完成';
                case 'cancel': return '取消';
                default: return '操作';
            }
        },
        
        // 预览图片
        previewImage(index) {
            // 使用Element UI的图片预览功能
            const previewInstance = this.$refs.imagePreview;
            if (previewInstance) {
                previewInstance.showViewer = true;
                previewInstance.currentImg = index;
            }
        },
        
        // 格式化零件列表
        formatParts(parts) {
            if (!parts) return [];
            try {
                if (typeof parts === 'string') {
                    // 尝试解析JSON
                    try {
                        const parsedParts = JSON.parse(parts);
                        if (Array.isArray(parsedParts)) {
                            return parsedParts;
                        }
                    } catch (e) {
                        // 如果不是JSON，则按逗号分隔
                        return parts.split(',').map(part => part.trim()).filter(part => part);
                    }
                } else if (Array.isArray(parts)) {
                    return parts;
                }
            } catch (e) {
                console.error('解析零件列表失败:', e);
            }
            
            // 如果不是数组或字符串，返回原始值作为单个项
            return [parts.toString()];
        },
        
        // 获取结果类型标签颜色
        getResultTypeTag(type) {
            const typeMap = {
                'fixed': 'success',
                'replaced': 'warning',
                'unrepairable': 'danger',
                'other': 'info'
            };
            return typeMap[type] || 'info';
        },
        
        // 格式化结果类型
        formatResultType(type) {
            const typeMap = {
                'fixed': '已修复',
                'replaced': '已更换',
                'unrepairable': '无法修复',
                'other': '其他'
            };
            return typeMap[type] || type || '未知';
        },
        
        // 获取历史记录类型颜色
        getHistoryTypeColor(type) {
            const typeMap = {
                'create': 'primary',
                'assign': 'warning',
                'process': 'warning',
                'complete': 'success',
                'cancel': 'danger',
                'update': 'info'
            };
            return typeMap[type] || 'info';
        },
        
        // 格式化维护状态
        formatMaintenanceStatus(status) {
            const statusMap = {
                'pending': '待处理',
                'in_progress': '进行中',
                'completed': '已完成'
            };
            return statusMap[status] || status;
        },
        
        // 获取维护状态标签样式
        getMaintenanceStatusTag(status) {
            const statusMap = {
                'pending': 'info',
                'in_progress': 'warning',
                'completed': 'success'
            };
            return statusMap[status] || '';
        },
        
        // 格式化维护结果
        formatMaintenanceResult(result) {
            const resultMap = {
                'fully_fixed': '完全修复',
                'partially_fixed': '部分修复',
                'not_fixed': '未修复',
                'completed': '已完成'
            };
            return resultMap[result] || result;
        },
        
        // 获取维护结果标签样式
        getMaintenanceResultTag(result) {
            const resultMap = {
                'fully_fixed': 'success',
                'partially_fixed': 'warning',
                'not_fixed': 'danger',
                'completed': 'info'
            };
            return resultMap[result] || '';
        },
        
        // 格式化更换零件
        formatPartsReplaced(parts) {
            if (!parts) return '-';
            
            try {
                // 如果是JSON字符串，尝试解析
                const partsArray = typeof parts === 'string' ? JSON.parse(parts) : parts;
                
                if (Array.isArray(partsArray)) {
                    return partsArray.join(', ');
                } else if (typeof partsArray === 'object') {
                    return Object.entries(partsArray)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                }
                
                return String(parts);
            } catch (error) {
                console.error('解析更换零件错误:', error);
                return String(parts);
            }
        },
        
        // 格式化日期时间
        formatDateTime(datetime) {
            if (!datetime) return '-';
            const date = new Date(datetime);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        },
        
        // 获取科室列表
        async fetchDepartments() {
            try {
                const response = await GetDepartmentList();
                if (response && response.data) {
                    this.departmentOptions = response.data;
                }
            } catch (error) {
                this.$message.error('获取科室列表失败');
                console.error('获取科室列表失败:', error);
            }
        },
        
        mapTabToStep() {
            const tabToStepMap = {
                'basic': 0,
                'time': 1,
                'contact': 2,
                'image': 3
            };
            this.activeStepIndex = tabToStepMap[this.activeTab] || 0;
        },
        
        handleTabClick() {
            this.mapTabToStep();
        },
        
        nextStep() {
            if (this.activeStepIndex < 3) {
                console.log("this is activeStepIndex", this.activeStepIndex)
                this.activeStepIndex++;
                this.setActiveTabByStep();
            }
        },
        
        prevStep() {
            if (this.activeStepIndex > 0) {
                this.activeStepIndex--;
                this.setActiveTabByStep();
            }
        },
        
        setActiveTabByStep() {
            const stepToTabMap = ['basic', 'time', 'contact', 'image'];
            this.activeTab = stepToTabMap[this.activeStepIndex];
        },
        async getEquipmentList() {
            try {
                this.loading = true;
                
                // 构建查询参数
                const queryParams = {
                    page: this.pagination.page,
                    size: this.pagination.size
                };
                
                // 添加筛选条件
                if (this.searchQuery) {
                    queryParams.name = this.searchQuery;
                }
                
                if (this.filterDepartment) {
                    queryParams.department_id = this.filterDepartment;
                }
                
                if (this.filterStatus) {
                    queryParams.status = this.filterStatus;
                }
                
                const response = await getEquipmentList(queryParams);
                
                if (response.code === 200) {
                    // 添加过渡动画效果
                    setTimeout(() => {
                        this.equipmentList = response.data.items;
                        this.pagination.total = response.data.total;
                        this.loading = false;
                    }, 300);
                } else {
                    this.$message.error(response.message || '获取设备列表失败');
                    this.loading = false;
                }
            } catch (error) {
                console.error('获取设备列表失败:', error);
                this.$message.error('获取设备列表失败: ' + error.message);
                this.loading = false;
            }
        },
        formatDate(dateString) {
            if (!dateString) return '未设置';
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        formatStatus(status) {
            const statusMap = {
                'normal': '正常',
                'maintenance': '维修中',
                'scrapped': '报废'
            };
            return statusMap[status] || status;
        },
        
        getStatusTagType(status) {
            const typeMap = {
                'normal': 'success',
                'maintenance': 'warning',
                'scrapped': 'danger'
            };
            return typeMap[status] || 'info';
        },
        
        getStatusType(status) {
            const statusMap = {
                'normal': 'success',
                'maintenance': 'warning',
                'scrapped': 'danger'
            };
            return statusMap[status] || 'info';
        },
        
        isWarrantyExpired(date) {
            if (!date) return true;
            const warrantyDate = new Date(date);
            const today = new Date();
            return warrantyDate < today;
        },
        
        isMaintenanceDue(date) {
            if (!date) return false;
            const maintenanceDate = new Date(date);
            const today = new Date();
            const timeDiff = maintenanceDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysDiff <= 30 && daysDiff >= 0; // 维护日期在30天内
        },
        
        getMaintenanceStatus(date) {
            if (!date) return '未设置维护日期';
            const maintenanceDate = new Date(date);
            const today = new Date();
            const timeDiff = maintenanceDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff < 0) {
                return '维护日期已过期';
            } else if (daysDiff <= 30) {
                return `距离下次维护还有 ${daysDiff} 天`;
            } else {
                return '距离下次维护还有较长时间';
            }
        },
        
        // 从详情页面编辑设备
        editFromDetail() {
            this.dialogVisible = false;
            this.editDetail(this.selectedEquipment);
        },
        
        printEquipmentDetail() {
            this.$message.success('正在准备打印信息...');
            window.print();
        },

        // AI健康报表相关方法
        // 显示AI健康报表
        showAIHealthReport(equipment) {
            if (!equipment || !equipment.id) {
                this.$message.error('设备信息不完整，无法生成AI健康报表');
                return;
            }
            
            this.currentEquipmentForReport = equipment;
            this.aiHealthReportVisible = true;
            this.generateReport(equipment.id);
        },
        
        // 生成AI健康报表
        async generateReport(equipmentId) {
            if (!equipmentId) {
                this.$message.error('设备ID不能为空');
                return;
            }
            
            this.aiHealthReportLoading = true;
            
            try {
                const response = await getEquipmentHealthReport(equipmentId);
                
                if (response.success) {
                    this.healthReport = response.data;
                    this.$message.success('AI健康报表生成成功');
                } else {
                    this.$message.error(response.message || 'AI健康报表生成失败');
                }
            } catch (error) {
                console.error('生成AI健康报表失败:', error);
                this.$message.error('生成AI健康报表失败: ' + (error.message || '服务器错误'));
                // 如果生成失败，设置一个默认的报表数据用于展示UI
                this.setDemoHealthReport();
            } finally {
                this.aiHealthReportLoading = false;
            }
        },
        
        // 关闭AI健康报表对话框
        handleAIHealthReportClose() {
            this.aiHealthReportVisible = false;
            this.currentEquipmentForReport = null;
            // 重置健康报表数据
            this.healthReport = {
                score: 0,
                status: '',
                lastMaintenance: null,
                nextMaintenance: null,
                maintenanceFrequency: '',
                usageRate: 0,
                failureRisk: 0,
                recommendations: [],
                history: []
            };
        },
        
        // 导出AI健康报表
        async exportReport() {
            if (!this.currentEquipmentForReport || !this.currentEquipmentForReport.id) {
                this.$message.error('设备信息不完整，无法导出报表');
                return;
            }
            
            try {
                this.$message.info('正在准备导出报表...');
                const format = 'pdf'; // 默认为PDF格式
                
                const response = await exportEquipmentHealthReport(this.currentEquipmentForReport.id, format);
                
                // 创建Blob对象
                const blob = new Blob([response.data], { type: 'application/pdf' });
                
                // 创建下载链接
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `设备健康报表_${this.currentEquipmentForReport.name}_${this.formatDate(new Date())}.pdf`;
                link.click();
                
                // 释放URL对象
                URL.revokeObjectURL(link.href);
                
                this.$message.success('报表导出成功');
            } catch (error) {
                console.error('导出AI健康报表失败:', error);
                this.$message.error('导出AI健康报表失败: ' + (error.message || '服务器错误'));
            }
        },
        
        // 设置演示健康报表数据（当API不可用时使用）
        setDemoHealthReport() {
            const today = new Date();
            const lastMonth = new Date(today);
            lastMonth.setMonth(today.getMonth() - 1);
            
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            
            this.healthReport = {
                score: 78,
                status: '状态良好',
                lastMaintenance: lastMonth.toISOString().split('T')[0],
                nextMaintenance: nextMonth.toISOString().split('T')[0],
                maintenanceFrequency: '每季度',
                usageRate: 65,
                failureRisk: 25,
                recommendations: [
                    {
                        priority: 'high',
                        type: 'warning',
                        title: '建议更换滤芯',
                        description: '设备滤芯已使用超过3个月，建议进行更换以保持设备性能。',
                        timeframe: '两周内',
                        benefits: ['提高性能', '延长寿命']
                    },
                    {
                        priority: 'medium',
                        type: 'info',
                        title: '校准传感器',
                        description: '设备传感器可能存在轻微偏差，建议进行校准以确保精确度。',
                        timeframe: '一个月内',
                        benefits: ['提高精度', '减少误差']
                    }
                ],
                history: [
                    {
                        date: '2025-01-15',
                        score: 85,
                        status: '状态优秀',
                        event: '完成季度维护',
                        failureRisk: 15
                    },
                    {
                        date: '2025-02-20',
                        score: 72,
                        status: '状态良好',
                        event: '更换了主板',
                        failureRisk: 30
                    },
                    {
                        date: '2025-03-10',
                        score: 78,
                        status: '状态良好',
                        event: '例行检查',
                        failureRisk: 25
                    }
                ]
            };
        },
        
        // 获取推荐颜色
        getRecommendationColor(priority) {
            const colorMap = {
                'high': '#F56C6C',
                'medium': '#E6A23C',
                'low': '#67C23A'
            };
            return colorMap[priority] || '#909399';
        },
        
        // 获取推荐类型标签
        getRecommendationTagType(priority) {
            const typeMap = {
                'high': 'danger',
                'medium': 'warning',
                'low': 'success'
            };
            return typeMap[priority] || 'info';
        },
        
        // 获取推荐优先级文本
        getRecommendationPriorityText(priority) {
            const textMap = {
                'high': '高优先级',
                'medium': '中优先级',
                'low': '低优先级'
            };
            return textMap[priority] || '未知优先级';
        },
        
        // 获取历史记录风险颜色
        getHistoryRiskColor(risk) {
            if (risk < 30) return '#67C23A';
            if (risk < 70) return '#E6A23C';
            return '#F56C6C';
        },
        
        // 获取分数样式类
        getScoreClass(score) {
            if (score >= 80) return 'score-good';
            if (score >= 60) return 'score-warning';
            return 'score-danger';
        },
        
        // 获取状态报表类型
        getStatusReportType(status) {
            if (status.includes('优秀')) return 'success';
            if (status.includes('良好')) return 'warning';
            if (status.includes('一般')) return 'info';
            if (status.includes('差')) return 'danger';
            return 'info';
        },
        
        // 格式化日期时间
        formatDateTime(date) {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        },
        
        // 打印工单详情
        printWorkOrder() {
            if (!this.selectedWorkOrder) {
                this.$message.warning('未选择工单或工单数据不完整');
                return;
            }
            
            this.$message.success('正在准备打印工单...');
            
            // 保存当前页面状态
            const originalTitle = document.title;
            const originalBodyClass = document.body.className;
            
            // 添加打印样式类
            document.body.classList.add('printing-work-order');
            document.title = `维修工单_${this.selectedWorkOrder.order_number || '无编号'}`;
            
            // 执行打印
            window.print();
            
            // 恢复原始状态
            setTimeout(() => {
                document.title = originalTitle;
                document.body.className = originalBodyClass;
            }, 500);
        },
        
        copyContactNumber() {
            if (this.selectedEquipment.contact_number) {
                const textArea = document.createElement('textarea');
                textArea.value = this.selectedEquipment.contact_number;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.$message.success('联系电话已复制到剪贴板');
            }
        },
        getStatusClass(status) {
            return {
                'status-normal': status === 'normal',
                'status-maintenance': status === 'maintenance',
                'status-scrapped': status === 'scrapped'
            };
        },
        handleSearch() {
            this.pagination.page = 1; // 重置到第一页
            this.getEquipmentList();
        },
        handleSizeChange(size) {
            this.pagination.size = size;
            this.getEquipmentList();
        },
        handleCurrentChange(page) {
            this.pagination.page = page;
            // 添加平滑滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.getEquipmentList();
        },
        handleClose() {
            this.EditdialogVisible = false;
        },
        
        handleDetailClose() {
            this.dialogVisible = false;
        },
        checkDetail(item) {
            this.selectedEquipment = item;
            this.dialogVisible = true;
        },
        editDetail(item) {
            this.selectedEquipment = { ...item };
            this.editForm = { ...item };
            this.editForm.imagePreview = null;
            this.EditdialogVisible = true;
        },
        // 直接提交表单，不使用表单验证
        async submitFormDirectly() {
            // 显示加载状态
            this.submitLoading = true;
            
            // 手动验证必填字段
            const validationErrors = [];
            
            if (!this.editForm.name) {
                validationErrors.push('设备名称');
            }
            if (!this.editForm.equipment_code) {
                validationErrors.push('设备编号');
            }
            if (!this.editForm.department) {
                validationErrors.push('所属科室');
            }
            
            if (validationErrors.length > 0) {
                this.submitLoading = false;
                this.$message({
                    message: `请完善以下必填信息: ${validationErrors.join('、')}`,
                    type: 'warning',
                    duration: 3000,
                    showClose: true
                });
                return false;
            }
            
            try {
                // 移除base64预览数据，避免数据过大
                const submitData = { ...this.editForm };
                delete submitData.imagePreview;
                
                const response = await updateEquipment(this.editForm.id, submitData);
                if (response.code === 200) {
                    this.$notify({
                        title: '成功',
                        message: '设备信息更新成功',
                        type: 'success',
                        duration: 2000
                    });
                    this.EditdialogVisible = false;
                    this.getEquipmentList(); // 刷新列表
                } else {
                    this.$message.error(response.message || '设备信息更新失败');
                }
            } catch (error) {
                console.error('更新设备信息失败:', error);
                this.$message.error('更新设备信息失败: ' + error.message);
            } finally {
                this.submitLoading = false;
            }
        },
        beforeUpload(file) {
            const isImage = file.type.startsWith('image/');
            const isLt2M = file.size / 1024 / 1024 < 2;

            if (!isImage) {
                this.$message.error('只能上传图片文件!');
                return false;
            }
            if (!isLt2M) {
                this.$message.error('图片大小不能超过 2MB!');
                return false;
            }
            return true;
        },
        // 处理编辑表单中的图片上传
        async handleEditUploadRequest(options) {
            try {
                const file = options.file;
                
                // 重置上传进度
                this.uploadProgress = 0;
                
                // 先保存本地预览
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    const imageUrl = reader.result;
                    
                    // 设置预览图片
                    this.editForm.imagePreview = imageUrl;
                    
                    // 模拟上传进度
                    const simulateProgress = () => {
                        const interval = setInterval(() => {
                            if (this.uploadProgress < 90) {
                                this.uploadProgress += Math.floor(Math.random() * 10) + 1;
                            } else {
                                clearInterval(interval);
                            }
                        }, 200);
                        return interval;
                    };
                    
                    const progressInterval = simulateProgress();
                    
                    // 如果有设备ID，则直接上传图片到服务器
                    if (this.editForm.id) {
                        try {
                            // 使用uploadEquipmentImage API上传图片
                            const response = await uploadEquipmentImage(this.editForm.id, file);
                            
                            // 清除进度模拟器
                            clearInterval(progressInterval);
                            this.uploadProgress = 100;
                            
                            if (response.code === 200) {
                                // 更新图片URL为服务器返回的URL
                                this.editForm.image = response.data.imageUrl;
                                this.editForm.image_url = response.data.imageUrl;
                                this.$message.success('图片上传成功');
                            } else {
                                this.$message.error(response.message || '图片上传失败');
                            }
                        } catch (error) {
                            // 清除进度模拟器
                            clearInterval(progressInterval);
                            this.uploadProgress = 0;
                            console.error('图片上传失败:', error);
                            this.$message.error('图片上传失败: ' + error.message);
                        }
                    } else {
                        // 如果没有ID，只进行本地预览
                        setTimeout(() => {
                            clearInterval(progressInterval);
                            this.uploadProgress = 100;
                        }, 1000);
                    }
                    
                    if (options.onSuccess) {
                        options.onSuccess(imageUrl);
                    }
                };
            } catch (error) {
                this.uploadProgress = 0;
                console.error('处理图片上传失败:', error);
                if (options.onError) {
                    options.onError(error);
                }
            }
        },
        
        // 移除已上传的图片
        removeUploadedImage(e) {
            e.preventDefault();
            this.editForm.imagePreview = null;
            this.uploadProgress = 0;
            this.$message.info('已移除图片，可重新上传');
        },
        
        // 预览图片
        previewImage(url) {
            if (!url) return;
            // 使用Element UI的MessageBox显示图片
            this.$alert(
                `<div style="text-align: center"><img src="${url}" style="max-width: 100%; max-height: 500px;"></div>`,
                '图片预览',
                {
                    dangerouslyUseHTMLString: true,
                    showConfirmButton: false,
                    callback: () => {}
                }
            );
        },
        
        // 新增设备相关方法
        showAddEquipmentDialog() {
            this.addDialogVisible = true;
            // 重置表单
            this.addForm = {
                name: '',
                equipment_code: '',
                department: '',
                status: 'normal',
                model: '',
                manufacturer: '',
                location: '',
                purchase_date: '',
                warranty_period: '',
                responsible_person: '',
                contact_number: '',
                purchase_price: '',
                service_life: '',
                next_maintenance_date: '',
                description: '',
                image_url: ''
            };
            // 重置上传文件对象
            this._uploadFile = null;
            // 重置步骤索引
            this.addActiveStepIndex = 0;
            // 重置上传进度
            this.addUploadProgress = 0;
            // 如果表单引用存在，则重置验证
            if (this.$refs.addForm) {
                this.$refs.addForm.resetFields();
            }
        },
        
        // 新增设备弹窗相关方法
        handleAddClose() {
            if (this.addFormChanged) {
                this.$confirm('表单已填写，确定要关闭吗？未保存的内容将丢失', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.addDialogVisible = false;
                    this.addFormChanged = false;
                }).catch(() => {});
            } else {
                this.addDialogVisible = false;
            }
        },
        
        toggleAddFullscreen() {
            this.isAddFullscreen = !this.isAddFullscreen;
        },
        
        onAddDialogOpen() {
            this.addFormChanged = false;
            this.addActiveStepIndex = 0;
        },
        
        handleQuickTemplate(command) {
            // 根据选择的模板预填充表单
            const templates = {
                template1: {
                    department: '放射科',
                    status: 'normal',
                    service_life: 10,
                    manufacturer: 'GE医疗',
                    model: 'X-Ray 2000'
                },
                template2: {
                    department: '检验科',
                    status: 'normal',
                    service_life: 8,
                    manufacturer: '西门子医疗',
                    model: 'Lab-3000'
                },
                template3: {
                    department: '手术室',
                    status: 'normal',
                    service_life: 5,
                    manufacturer: '迈瑞医疗',
                    model: 'Surgical-Pro'
                }
            };
            
            const selectedTemplate = templates[command];
            if (selectedTemplate) {
                // 合并模板数据到表单
                this.addForm = { ...this.addForm, ...selectedTemplate };
                this.$message.success('已应用模板');
                this.addFormChanged = true;
            }
        },
        
        generateEquipmentCode() {
            // 生成设备编号：前缀+日期+4位随机数
            const prefix = this.addForm.department ? this.addForm.department.substring(0, 1) : 'E';
            const date = new Date();
            const year = date.getFullYear().toString().substring(2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            
            this.addForm.equipment_code = `${prefix}-${year}${month}${day}-${random}`;
            this.addFormChanged = true;
        },
        
        nextAddStep() {
            // 验证当前步骤的表单字段
            const stepValidationMap = [
                ['name', 'equipment_code', 'department', 'status'],  // 步骤0的必填字段
                ['model', 'manufacturer', 'location'],               // 步骤1的必填字段
                ['responsible_person', 'contact_number'],            // 步骤2的必填字段
                []                                                   // 步骤3没有必填字段
            ];
            
            const currentStepFields = stepValidationMap[this.addActiveStepIndex];
            
            if (currentStepFields.length > 0) {
                // 先验证当前步骤的必填字段
                this.$refs.addForm.validate((valid, invalidFields) => {
                    if (valid) {
                        // 全部验证通过
                        if (this.addActiveStepIndex < 3) {
                            this.addActiveStepIndex++;
                            this.addFormChanged = true;
                        }
                    } else {
                        // 检查是否当前步骤的字段有错误
                        const hasCurrentStepError = currentStepFields.some(field => {
                            return invalidFields && invalidFields[field];
                        });
                        
                        if (hasCurrentStepError) {
                            // 当前步骤有错误，显示提示
                            this.$message.warning('请填写当前步骤的必填字段');
                        } else {
                            // 当前步骤没有错误，可以进入下一步
                            if (this.addActiveStepIndex < 3) {
                                this.addActiveStepIndex++;
                                this.addFormChanged = true;
                            }
                        }
                    }
                }, currentStepFields);
            } else {
                // 当前步骤没有必填字段，直接进入下一步
                if (this.addActiveStepIndex < 3) {
                    this.addActiveStepIndex++;
                }
            }
        },
        
        prevAddStep() {
            if (this.addActiveStepIndex > 0) {
                this.addActiveStepIndex--;
            }
        },
        
        removeAddUploadedImage(e) {
            if (e) e.preventDefault();
            this.addForm.image_url = null;
            this.addUploadProgress = 0;
            this._uploadFile = null;
            this.$message.info('已移除图片，可重新上传');
        },
        
        submitAddForm(formName) {
            this.$refs[formName].validate(async (valid) => {
                if (valid) {
                    this.loading = true;
                    try {
                        // 创建一个不包含图片URL的设备数据对象
                        const equipmentData = { ...this.addForm };
                        delete equipmentData.image_url; // 移除图片URL字段
                        
                        // 先创建设备记录
                        const response = await createEquipment(equipmentData);
                        
                        if (response.code === 200) {
                            // 获取新创建的设备ID
                            const newEquipmentId = response.data.id;
                            
                            // 如果有上传的文件，则上传图片
                            if (this._uploadFile) {
                                try {
                                    // 直接使用保存的文件对象上传
                                    const uploadResponse = await uploadEquipmentImage(newEquipmentId, this._uploadFile);
                                    
                                    if (uploadResponse.code === 200) {
                                        // 更新图片URL为服务器返回的URL
                                        this.$message.success('设备图片上传成功');
                                    } else {
                                        this.$message.warning('设备创建成功，但图片上传失败: ' + (uploadResponse.message || '未知错误'));
                                    }
                                } catch (uploadError) {
                                    console.error('图片上传失败:', uploadError);
                                    this.$message.warning('设备创建成功，但图片上传失败: ' + uploadError.message);
                                }
                            }
                            
                            this.$message.success('新增设备成功');
                            this.addDialogVisible = false;
                            // 重置上传文件对象
                            this._uploadFile = null;
                            // 重新获取设备列表
                            this.fetchEquipmentList();
                        } else {
                            this.$message.error(response.message || '新增设备失败');
                        }
                    } catch (error) {
                        console.error('新增设备失败:', error);
                        this.$message.error('新增设备失败: ' + error.message);
                    } finally {
                        this.loading = false;
                    }
                }
            });
        },
        
        async handleUploadRequest(options) {
            try {
                const file = options.file;
                
                // 先保存本地预览
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    const imageUrl = reader.result;
                    
                    if (this.addDialogVisible) {
                        // 新增设备时，只保存图片数据用于预览和文件对象，不立即上传
                        // 实际上传将在提交表单时进行
                        this.addForm.image_url = imageUrl; // 保存Base64数据用于预览
                        this._uploadFile = file; // 保存原始文件对象，以便后续上传
                        
                        if (options.onSuccess) {
                            options.onSuccess(imageUrl);
                        }
                    } else if (this.EditdialogVisible && this.editForm.id) {
                        // 编辑设备时，直接上传图片
                        this.editForm.image = imageUrl; // 先设置预览
                        
                        try {
                            // 上传图片到服务器
                            const response = await uploadEquipmentImage(this.editForm.id, file);
                            
                            if (response.code === 200) {
                                // 更新图片URL为服务器返回的URL
                                this.editForm.image = response.data.imageUrl;
                                this.$message.success('图片上传成功');
                            } else {
                                this.$message.error(response.message || '图片上传失败');
                            }
                        } catch (error) {
                            console.error('图片上传失败:', error);
                            this.$message.error('图片上传失败: ' + error.message);
                        }
                        
                        if (options.onSuccess) {
                            options.onSuccess(imageUrl);
                        }
                    }
                };
            } catch (error) {
                console.error('处理图片上传失败:', error);
                if (options.onError) {
                    options.onError(error);
                }
            }
        },
        
        handleAddUploadSuccess(res) {
            // 只保存预览用的图片数据，实际上传会在提交表单时处理
            this.addForm.image_url = res;
        },
        deleteEquipment(id) {
            this.$confirm('此操作将永久删除该设备, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
                closeOnClickModal: false
            }).then(async () => {
                try {
                    this.loading = true;
                    const response = await deleteEquipment(id);
                    if (response.code === 200) {
                        this.$notify({
                            title: '成功',
                            message: '设备已成功删除',
                            type: 'success',
                            duration: 2000
                        });
                        this.getEquipmentList();
                    } else {
                        this.$message.error(response.message || '删除设备失败');
                    }
                } catch (error) {
                    console.error('删除设备失败:', error);
                    this.$message.error('删除设备失败: ' + error.message);
                } finally {
                    this.loading = false;
                }
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        },
        
    }
    }
</script>

<style lang="scss" scoped>
/* AI健康报表样式 */
.ai-health-report-dialog {
    .report-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        gap: 20px;
        
        @media (max-width: 768px) {
            flex-direction: column;
        }
    }
    
    .equipment-info-box {
        display: flex;
        gap: 20px;
        flex: 1;
    }
    
    .equipment-image {
        width: 120px;
        height: 120px;
        
        .el-image {
            width: 100%;
            height: 100%;
            border-radius: 6px;
        }
        
        .image-error {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f7fa;
            border-radius: 6px;
            
            i {
                font-size: 40px;
                color: #909399;
            }
        }
    }
    
    .equipment-info {
        h3 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 18px;
            color: #303133;
        }
        
        p {
            margin: 5px 0;
            color: #606266;
            font-size: 14px;
            
            .info-label {
                font-weight: 500;
                color: #303133;
            }
        }
    }
    
    .health-score-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 20px;
        min-width: 180px;
        
        .health-score {
            text-align: center;
            margin-bottom: 10px;
            
            .score-label {
                margin-top: 10px;
                font-size: 16px;
                font-weight: 500;
                color: #303133;
            }
        }
        
        .health-status {
            text-align: center;
            
            .status-title {
                font-size: 14px;
                color: #909399;
                margin-bottom: 5px;
            }
            
            .status-value {
                font-size: 16px;
                font-weight: 500;
                padding: 5px 15px;
                border-radius: 15px;
                
                &.status-good {
                    color: #67C23A;
                    background-color: rgba(103, 194, 58, 0.1);
                }
                
                &.status-warning {
                    color: #E6A23C;
                    background-color: rgba(230, 162, 60, 0.1);
                }
                
                &.status-danger {
                    color: #F56C6C;
                    background-color: rgba(245, 108, 108, 0.1);
                }
            }
        }
    }
    
    .report-metrics {
        margin-bottom: 30px;
        
        .metric-card {
            .metric-header {
                display: flex;
                align-items: center;
                font-size: 15px;
                
                i {
                    margin-right: 8px;
                    font-size: 18px;
                }
            }
            
            .metric-content {
                padding: 10px 0;
                
                .metric-value {
                    font-size: 16px;
                    font-weight: 500;
                    color: #303133;
                    text-align: center;
                    
                    &.warning {
                        color: #E6A23C;
                    }
                    
                    &.danger {
                        color: #F56C6C;
                    }
                }
                
                .metric-alert {
                    text-align: center;
                    font-size: 12px;
                    margin-top: 5px;
                    padding: 2px 0;
                    border-radius: 10px;
                    background-color: #f56c6c10;
                    color: #F56C6C;
                }
                
                .risk-level {
                    margin-top: 10px;
                    text-align: center;
                    font-weight: 500;
                    
                    &.risk-low {
                        color: #67C23A;
                    }
                    
                    &.risk-medium {
                        color: #E6A23C;
                    }
                    
                    &.risk-high {
                        color: #F56C6C;
                    }
                }
            }
        }
    }
    
    .recommendations-section {
        margin-bottom: 30px;
        
        .recommendation-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            
            h4 {
                margin: 0 0 0 10px;
                font-size: 16px;
            }
        }
        
        .recommendation-benefits {
            margin-top: 10px;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 5px;
            
            span {
                font-size: 13px;
                color: #909399;
                margin-right: 5px;
            }
            
            .benefit-tag {
                margin-right: 5px;
            }
        }
        
        .empty-recommendations {
            text-align: center;
            padding: 30px;
            color: #67C23A;
            
            i {
                font-size: 40px;
                margin-bottom: 10px;
            }
            
            p {
                font-size: 16px;
            }
        }
    }
    
    .health-history-section {
        margin-bottom: 20px;
        
        .score-good {
            color: #67C23A;
            font-weight: 500;
        }
        
        .score-warning {
            color: #E6A23C;
            font-weight: 500;
        }
        
        .score-danger {
            color: #F56C6C;
            font-weight: 500;
        }
    }
    
    .dialog-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .report-info {
            .report-generation-info {
                margin: 0;
                font-size: 13px;
                color: #909399;
            }
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
        }
    }
}
.main {
    padding: 20px;
}

.search-box {
    display: flex;
    margin-bottom: 20px;
    align-items: center;
}

.search-input {
    width: 200px;
    margin-right: 15px;
}

.filter-select {
    width: 150px;
    margin-right: 15px;
}

.equipment-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.container {
    display: flex;
    position: relative;
    width: 280px;
    margin-bottom: 15px;
}

.equipment-card {
    transition: all 0.3s ease;
    border-radius: 8px;
    overflow: hidden;
    width: 100%;
}

.equipment-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.image-container {
    position: relative;
    overflow: hidden;
    height: 180px;
    background-color: #f5f7fa;
}

.bottom{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
}

.image{
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.image:hover {
    transform: scale(1.05);
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    background-color: rgba(0,0,0,0.3);
    transition: opacity 0.3s;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}

.overlay i {
    font-size: 24px;
    margin-bottom: 8px;
}

.equipment-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.equipment-name {
    font-weight: bold;
    font-size: 16px;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

.equipment-status-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-left: 5px;
}

.equipment-meta {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: #909399;
    margin: 8px 0;
}

.equipment-meta span {
    margin: 3px 0;
}

.equipment-meta i {
    margin-right: 5px;
}

.image-container:hover .image {
    cursor: pointer;
    filter: blur(2px);
}

.image-container:hover .overlay {
    opacity: 1;
}

.dialog-body{
    display: flex;
    width: 100%;
    flex-direction: column;
}

.two-columns {
    display: flex;
    width: 100%;
    margin-left: 10%;
}

.left-column, .right-column {
    flex: 1;
    text-align: left;
}

.image-upl.form-progress-bar {
    height: 100%;
    background: #409EFF;
    transition: width 0.3s ease-in-out;
}

/* 设备详情弹窗样式 */
.equipment-detail-dialog .el-dialog__body {
    padding: 0 20px;
}

.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.detail-actions {
    display: flex;
    gap: 10px;
}

.detail-body {
    display: flex;
    margin-bottom: 20px;
}

.detail-image-container {
    width: 250px;
    margin-right: 30px;
}

.detail-image {
    width: 100%;
    height: 200px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    background-color: #f5f7fa;
}

.image-caption {
    text-align: center;
    margin-top: 8px;
    color: #909399;
    font-size: 13px;
}

.image-error {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #909399;
}

.image-error i {
    font-size: 40px;
    margin-bottom: 10px;
}

.detail-info {
    flex: 1;
}

.info-group {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.info-item {
    display: flex;
    flex-direction: column;
}

.info-label {
    font-size: 13px;
    color: #909399;
    margin-bottom: 5px;
}

.info-value {
    font-size: 15px;
    color: #303133;
    font-weight: 500;
}

.detail-timeline {
    margin: 20px 0;
}

.timeline-content h4 {
    margin: 0 0 5px 0;
    font-size: 15px;
    color: #303133;
}

.timeline-content p {
    margin: 0;
    color: #606266;
    font-size: 13px;
}

.detail-contact {
    margin: 20px 0;
}

.contact-card {
    display: flex;
    align-items: center;
    padding: 15px;
    border-radius: 8px;
    background-color: #f5f7fa;
}

.contact-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #409EFF;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 20px;
}

.contact-avatar i {
    font-size: 30px;
}

.contact-info h3 {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: #303133;
}

.contact-info p {
    margin: 0;
    color: #606266;
    display: flex;
    align-items: center;
}

.contact-info i {
    margin-right: 5px;
}

.copy-btn {
    margin-left: 10px;
    padding: 0;
}

.detail-description {
    margin: 20px 0;
}

.description-content {
    padding: 15px;
    background-color: #f5f7fa;
    border-radius: 8px;
    color: #606266;
    line-height: 1.6;
}

.dialog-toolbar {
    position: absolute;
    top: 13px;
    right: 45px;
    z-index: 10;
}

.edit-equipment-form .el-tabs__header {
    margin-bottom: 25px;
}

.equipment-uploader {
    width: 100%;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background-color: #fafafa;
    transition: all 0.3s;
}

.equipment-uploader:hover {
    border-color: #409EFF;
    background-color: #ecf5ff;
}

.upload-placeholder {
    padding: 40px 20px;
    text-align: center;
    transition: all 0.3s;
}

.equipment-uploader:hover .upload-placeholder {
    transform: scale(1.02);
}

.equipment-uploader-icon {
    font-size: 48px;
    color: #c0c4cc;
    margin-bottom: 10px;
}

.equipment-image {
    width: 100%;
    height: 250px;
    display: block;
    object-fit: contain;
    background-color: #f5f7fa;
}

.image-preview-wrapper {
    position: relative;
}

.image-preview-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s;
}

.image-preview-wrapper:hover .image-preview-actions {
    opacity: 1;
}

.upload-success-message {
    color: #67C23A;
    margin-top: 10px;
    display: flex;
    align-items: center;
    font-size: 14px;
}

.upload-success-message i {
    margin-right: 5px;
}

p{
    text-decoration: underline;
    text-underline-offset: 3px; /* 下划线与文字的间距 */
    margin-bottom: 20px;
}

.equipment-info {
    display: flex;
    justify-content: space-between;
    margin: 8px 0;
    font-size: 12px;
}

.equipment-code {
    color: #666;
}

.equipment-status {
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 12px;
}

.status-normal {
    background-color: #67C23A;
    color: white;
}

.status-maintenance {
    background-color: #E6A23C;
    color: white;
}

.status-scrapped {
    background-color: #F56C6C;
    color: white;
}

/* 状态点样式 */
.equipment-status-dot.status-normal {
    background-color: #67C23A;
    box-shadow: 0 0 5px #67C23A;
}

.equipment-status-dot.status-maintenance {
    background-color: #E6A23C;
    box-shadow: 0 0 5px #E6A23C;
}

.equipment-status-dot.status-scrapped {
    background-color: #F56C6C;
    box-shadow: 0 0 5px #F56C6C;
}

/* 工单详情对话框样式 */
.work-order-detail-dialog {
    .el-dialog__body {
        padding: 15px 20px;
    }
    
    .el-dialog__header {
        padding: 15px 20px;
        background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
        border-bottom: 1px solid #ebeef5;
        margin-right: 0;
    }
    
    .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: #fff;
    }
    
    .el-dialog__headerbtn .el-dialog__close {
        color: #fff;
    }
    
    .el-dialog__footer {
        padding: 15px 20px;
        border-top: 1px solid #ebeef5;
        background-color: #f9f9f9;
    }
}

/* 工单详情内容样式 */
.work-order-detail-container {
    padding: 0;
    margin: 0;
    
    .work-order-header {
        margin-bottom: 20px;
        
        .header-card {
            box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
            border-radius: 8px;
            overflow: hidden;
            
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                
                @media (max-width: 768px) {
                    flex-direction: column;
                    align-items: flex-start;
                }
            }
            
            .work-order-status {
                display: flex;
                align-items: center;
                
                .status-tag {
                    font-size: 16px;
                    padding: 8px 16px;
                    border-radius: 4px;
                }
            }
            
            .work-order-basic-info {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                
                @media (max-width: 768px) {
                    margin-top: 15px;
                }
                
                .order-number, .order-time, .maintenance-type {
                    display: flex;
                    align-items: center;
                    
                    i {
                        margin-right: 5px;
                        font-size: 16px;
                        color: #909399;
                    }
                    
                    .info-label {
                        color: #606266;
                        margin-right: 5px;
                        font-weight: 500;
                    }
                    
                    .info-value {
                        color: #303133;
                        font-weight: 600;
                    }
                }
            }
        }
    }
    
    /* 信息卡片样式 */
    .info-section {
        margin-bottom: 20px;
        
        .el-row {
            margin-bottom: 20px;
        }
        
        .detail-card {
            height: 100%;
            transition: all 0.3s ease;
            border-radius: 8px;
            overflow: hidden;
            
            &:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            }
            
            .card-header {
                display: flex;
                align-items: center;
                font-size: 16px;
                font-weight: 600;
                
                i {
                    margin-right: 8px;
                    font-size: 18px;
                }
                
                .header-tag {
                    margin-left: auto;
                }
            }
            
            .equipment-info, .fault-info, .process-info, .complete-info {
                padding: 15px;
            }
            
            .equipment-name, .fault-type {
                margin-bottom: 15px;
                
                .el-tag {
                    padding: 6px 12px;
                    font-size: 14px;
                }
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
                
                @media (max-width: 576px) {
                    grid-template-columns: 1fr;
                }
                
                .info-item {
                    .info-item-label {
                        color: #909399;
                        font-size: 13px;
                        margin-bottom: 4px;
                        display: block;
                    }
                    
                    .info-item-value {
                        color: #303133;
                        font-weight: 500;
                        font-size: 14px;
                    }
                }
            }
            
            .fault-description, .process-description {
                margin-top: 15px;
                
                .fault-description-title, .remark-title, .section-title {
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #606266;
                    display: flex;
                    align-items: center;
                    
                    i {
                        margin-right: 5px;
                        font-size: 16px;
                    }
                }
                
                .fault-description-content, .remark-content, .section-content {
                    background-color: #f5f7fa;
                    padding: 10px;
                    border-radius: 4px;
                    color: #606266;
                    line-height: 1.6;
                    font-size: 14px;
                }
            }
        }
    }
    
    /* 图片展示样式 */
    .image-section {
        margin-bottom: 20px;
        
        .image-card {
            .card-header {
                .image-count {
                    margin-left: auto;
                    font-size: 13px;
                    color: #909399;
                    font-weight: normal;
                }
            }
            
            .images-wrapper {
                padding: 15px;
                
                .carousel-item-wrapper {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    
                    .carousel-image {
                        max-height: 280px;
                        border-radius: 4px;
                        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
                    }
                    
                    .image-index {
                        position: absolute;
                        bottom: 10px;
                        right: 10px;
                        background-color: rgba(0, 0, 0, 0.6);
                        color: white;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 12px;
                    }
                }
                
                .single-image-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    
                    .single-fault-image {
                        max-height: 280px;
                        border-radius: 4px;
                        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
                    }
                }
                
                .image-error {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    color: #909399;
                    
                    i {
                        font-size: 32px;
                        margin-bottom: 10px;
                    }
                }
            }
            
            .image-thumbnails {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                padding: 0 15px 15px;
                
                .image-thumbnail {
                    width: 60px;
                    height: 60px;
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.3s ease;
                    
                    &:hover {
                        border-color: #409EFF;
                        transform: scale(1.05);
                    }
                    
                    .thumbnail-image {
                        width: 100%;
                        height: 100%;
                    }
                }
            }
        }
    }
    
    /* 处理信息样式 */
    .process-section {
        margin-bottom: 20px;
        
        .process-card {
            .process-info {
                .process-person {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                    
                    i {
                        font-size: 18px;
                        margin-right: 8px;
                        color: #409EFF;
                    }
                    
                    .process-person-name {
                        font-size: 16px;
                        font-weight: 600;
                        color: #303133;
                    }
                }
                
                .process-time-info {
                    margin-bottom: 15px;
                    background-color: #f5f7fa;
                    padding: 12px;
                    border-radius: 6px;
                    
                    .time-item {
                        display: flex;
                        align-items: center;
                        margin-bottom: 8px;
                        
                        &:last-child {
                            margin-bottom: 0;
                        }
                        
                        i {
                            font-size: 16px;
                            margin-right: 8px;
                            color: #909399;
                        }
                        
                        .time-label {
                            font-weight: 500;
                            color: #606266;
                            margin-right: 5px;
                        }
                        
                        .time-value {
                            color: #303133;
                        }
                    }
                }
                
                .process-remark {
                    .remark-title {
                        display: flex;
                        align-items: center;
                        font-weight: 600;
                        margin-bottom: 8px;
                        
                        i {
                            font-size: 16px;
                            margin-right: 8px;
                            color: #E6A23C;
                        }
                    }
                    
                    .remark-content {
                        background-color: #fdf6ec;
                        padding: 12px;
                        border-radius: 6px;
                        color: #606266;
                        line-height: 1.6;
                    }
                }
            }
        }
    }
    
    /* 完成信息样式 */
    .complete-section {
        margin-bottom: 20px;
        
        .complete-card {
            .complete-info {
                .complete-header {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    margin-bottom: 15px;
                    padding-bottom: 15px;
                    border-bottom: 1px dashed #ebeef5;
                    
                    .complete-time, .repair-cost {
                        display: flex;
                        align-items: center;
                        
                        i {
                            font-size: 16px;
                            margin-right: 8px;
                            color: #909399;
                        }
                        
                        .time-label, .cost-label {
                            font-weight: 500;
                            color: #606266;
                            margin-right: 5px;
                        }
                        
                        .time-value, .cost-value {
                            color: #303133;
                        }
                    }
                    
                    .result-type {
                        margin-left: auto;
                        
                        .el-tag {
                            padding: 6px 12px;
                        }
                    }
                }
                
                .result-section, .parts-section {
                    margin-bottom: 15px;
                    
                    .section-title {
                        display: flex;
                        align-items: center;
                        font-weight: 600;
                        margin-bottom: 10px;
                        
                        i {
                            font-size: 16px;
                            margin-right: 8px;
                            color: #67C23A;
                        }
                    }
                    
                    .result-content {
                        background-color: #f0f9eb;
                        padding: 12px;
                        border-radius: 6px;
                        color: #606266;
                        line-height: 1.6;
                    }
                    
                    .parts-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        
                        .part-tag {
                            display: flex;
                            align-items: center;
                            
                            i {
                                margin-right: 5px;
                            }
                        }
                        
                        .no-parts {
                            color: #909399;
                            font-style: italic;
                        }
                    }
                }
            }
        }
    }
    
    /* 工单历史样式 */
    .history-section-container {
        margin-bottom: 20px;
        
        .history-card-container {
            .card-header {
                .history-count {
                    margin-left: auto;
                    font-size: 13px;
                    color: #909399;
                    font-weight: normal;
                }
            }
            
            .history-section {
                padding: 15px;
                
                .el-timeline {
                    padding-left: 0;
                    
                    .el-timeline-item {
                        .el-timeline-item__tail {
                            border-left: 2px solid #e4e7ed;
                        }
                        
                        .el-timeline-item__node {
                            background-color: #409EFF;
                        }
                        
                        .el-timeline-item__wrapper {
                            padding-left: 20px;
                        }
                        
                        .el-timeline-item__timestamp {
                            color: #909399;
                            font-size: 13px;
                        }
                        
                        .history-item-card {
                            margin-bottom: 15px;
                            border-radius: 6px;
                            transition: all 0.3s ease;
                            
                            &:hover {
                                transform: translateY(-3px);
                                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
                            }
                            
                            .history-header {
                                display: flex;
                                align-items: center;
                                margin-bottom: 10px;
                                
                                .history-type-tag {
                                    padding: 2px 8px;
                                    border-radius: 10px;
                                    font-size: 12px;
                                    margin-right: 10px;
                                    color: white;
                                    
                                    &.history-type-create {
                                        background-color: #409EFF;
                                    }
                                    
                                    &.history-type-process {
                                        background-color: #E6A23C;
                                    }
                                    
                                    &.history-type-complete {
                                        background-color: #67C23A;
                                    }
                                    
                                    &.history-type-cancel {
                                        background-color: #F56C6C;
                                    }
                                }
                                
                                .history-title {
                                    margin: 0;
                                    font-size: 15px;
                                    font-weight: 600;
                                    color: #303133;
                                }
                            }
                            
                            .history-body {
                                margin-bottom: 10px;
                                
                                .history-content {
                                    margin: 0;
                                    color: #606266;
                                    line-height: 1.6;
                                    font-size: 14px;
                                }
                            }
                            
                            .history-footer {
                                border-top: 1px dashed #ebeef5;
                                padding-top: 10px;
                                
                                .history-operator {
                                    margin: 0;
                                    color: #909399;
                                    font-size: 13px;
                                    display: flex;
                                    align-items: center;
                                    
                                    i {
                                        margin-right: 5px;
                                    }
                                }
                            }
                        }
                    }
                }
                
                .empty-history {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 30px 0;
                    color: #909399;
                    
                    i {
                        font-size: 48px;
                        margin-bottom: 15px;
                        color: #dcdfe6;
                    }
                    
                    p {
                        margin: 0;
                        font-size: 14px;
                    }
                }
            }
        }
    }
    
    /* 对话框底部按钮样式 */
    .dialog-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        
        .action-buttons {
            display: flex;
            gap: 10px;
            
            .el-button {
                padding: 10px 20px;
                
                i {
                    margin-right: 5px;
                }
            }
        }
    }
}

.empty-data {
    width: 100%;
    text-align: center;
    padding: 30px 0;
    color: #909399;
    font-size: 14px;
}

/* 骨架屏样式 */
.skeleton-container {
    display: flex;
    position: relative;
    width: 280px;
    margin-bottom: 15px;
}

.skeleton-card {
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
}

.skeleton-image {
    height: 180px;
    background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
}

.skeleton-content {
    padding: 14px;
}

.skeleton-title {
    height: 20px;
    width: 70%;
    background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    margin-bottom: 10px;
    border-radius: 4px;
}

.skeleton-info {
    height: 16px;
    width: 90%;
    background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    margin-bottom: 8px;
    border-radius: 4px;
}

.skeleton-footer {
    height: 32px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #ebeef5;
    background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 4px;
}

@keyframes skeleton-loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}
</style>