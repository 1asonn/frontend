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
                            <el-button type="info" size="mini" icon="el-icon-document">维护记录</el-button>
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
    </div>
</template>

<script>
import { getEquipmentList, createEquipment, updateEquipment, deleteEquipment, uploadEquipmentImage } from '@/api'
import { getdepartmentList } from '@/api/index'

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
            }
        }
    },
    computed: {
        filteredEquipmentList() {
            // 直接返回设备列表，筛选已由后端实现
            return this.equipmentList;
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
        
        // 获取科室列表
        async fetchDepartments() {
            try {
                const response = await getdepartmentList();
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
        
        editFromDetail() {
            this.dialogVisible = false;
            this.editDetail(this.selectedEquipment);
        },
        
        showMaintenanceRecords() {
            this.$message.info('正在开发维护记录功能，敬请期待');
        },
        
        printEquipmentDetail() {
            this.$message.success('正在准备打印信息...');
            window.print();
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

<style scoped>
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