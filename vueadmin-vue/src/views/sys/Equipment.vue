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
                <el-option label="放射科" value="放射科"></el-option>
                <el-option label="检验科" value="检验科"></el-option>
                <el-option label="手术室" value="手术室"></el-option>
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
            <div v-if="equipmentList.length === 0" class="empty-data">
                暂无设备数据
            </div>
            <div class="container" v-for="item in filteredEquipmentList" :key="item.id">
                <el-card :body-style="{ position:'relative', padding: '0px' }">
                    <img :src="item.image_url" @click="checkDetail(item)"  class="image">
                    <div class="overlay">
                        <i></i>
                        <span>查看详情</span>
                    </div>
                    <div style="position:relative;padding: 14px;">
                        <span>{{ item.name }}</span>
                        <div class="equipment-info">
                            <span class="equipment-code">编号: {{ item.equipment_code }}</span>
                            <span class="equipment-status" :class="getStatusClass(item.status)">{{ formatStatus(item.status) }}</span>
                        </div>
                        <div class="bottom">
                            <el-button type="text" class="button" @click="editDetail(item)">编辑</el-button>
                            <el-button type="text" class="button">维护记录</el-button>
                        </div>
                    </div>
                </el-card>
                <el-dialog
                    :title="selectedEquipment.name"
                    :visible.sync="dialogVisible"
                    width="50%"
                    :before-close="handleClose">
                    <div class="dialog-body">
                        <!-- <p>实拍图：</p> -->
                        <div class="two-columns">
                            <div class="left-column">
                                <p>实拍图：<el-image 
                                    style="width: 100px; height: 100px ;vertical-align: top;"
                                    fit="contain"
                                    src="https://uc45516f3ce307ce90112d036c23.dl.dropboxusercontent.com/cd/0/get/CobokAU02L0FKUWPjbE-wKBDuLiQw1bu3cA7jQw5f7j5IZe0tIGVPiiyM0dAl8w_IL9srHYpdpKLN4hX1BTyvuvjzqxhCqX8USqixFAO6MAgLYgGM7gEaFg4zANpKcYf3poBJXy8kmh2PMyC51r8FgdF4Dngs4EzIZPM9v3JpEZvzw/file" 
                                    :preview-src-list="[require('@/assets/jinan.jpg')]">
                                </el-image></p>
                                <p>设备编号：{{ selectedEquipment.equipment_code }}</p>
                                <p>科室：{{ selectedEquipment.department }}</p>
                                <p>位置：{{ selectedEquipment.location }}</p>
                                <p>型号：{{ selectedEquipment.model }}</p>
                            </div>
                            <div class="right-column">
                                <p>状态：{{ formatStatus(selectedEquipment.status) }}</p>
                                <p>采购日期：{{ formatDate(selectedEquipment.purchase_date) }}</p>
                                <p>保修期至：{{ formatDate(selectedEquipment.warranty_period) }}</p>
                                <p>使用年限：{{ selectedEquipment.service_life }} 年</p>
                                <p>制造商：{{ selectedEquipment.manufacturer }}</p>
                                <p>负责人：{{ selectedEquipment.responsible_person }}</p>
                                <p>联系电话：{{ selectedEquipment.contact_number }}</p>
                            </div>
                        </div>
                    </div>
                    <span slot="footer" class="dialog-footer">
                        <el-button @click="dialogVisible = false">取 消</el-button>
                        <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
                    </span>
                </el-dialog>
                <el-dialog
                    :title="'编辑 - ' + selectedEquipment.name"
                    :visible.sync="EditdialogVisible"
                    width="50%"
                    :before-close="handleClose">
                    <el-form :model="editForm" :rules="rules" ref="editForm" label-width="100px">
                        <el-form-item label="设备名称" prop="name">
                            <el-input v-model="editForm.name"></el-input>
                        </el-form-item>
                        <el-form-item label="设备编号" prop="equipment_code">
                            <el-input v-model="editForm.equipment_code"></el-input>
                        </el-form-item>
                        <el-form-item label="所属科室" prop="department">
                            <el-input v-model="editForm.department"></el-input>
                        </el-form-item>
                        <el-form-item label="设备状态" prop="status">
                            <el-select v-model="editForm.status" placeholder="请选择设备状态">
                                <el-option label="正常" value="normal"></el-option>
                                <el-option label="维修中" value="maintenance"></el-option>
                                <el-option label="报废" value="scrapped"></el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item label="设备型号" prop="model">
                            <el-input v-model="editForm.model"></el-input>
                        </el-form-item>
                        <el-form-item label="位置" prop="location">
                            <el-input v-model="editForm.location"></el-input>
                        </el-form-item>
                        <el-form-item label="采购日期" prop="purchase_date">
                            <el-date-picker
                                v-model="editForm.purchase_date"
                                type="date"
                                placeholder="选择日期">
                            </el-date-picker>
                        </el-form-item>
                        <el-form-item label="保修期至" prop="warranty_period">
                            <el-date-picker
                                v-model="editForm.warranty_period"
                                type="date"
                                placeholder="选择日期">
                            </el-date-picker>
                        </el-form-item>
                        <el-form-item label="制造商" prop="manufacturer">
                            <el-input v-model="editForm.manufacturer"></el-input>
                        </el-form-item>
                        <el-form-item label="负责人" prop="responsible_person">
                            <el-input v-model="editForm.responsible_person"></el-input>
                        </el-form-item>
                        <el-form-item label="联系电话" prop="contact_number">
                            <el-input v-model="editForm.contact_number"></el-input>
                        </el-form-item>
                        <el-form-item label="使用年限" prop="service_life">
                            <el-input-number v-model="editForm.service_life" :min="1" :max="20"></el-input-number>
                        </el-form-item>
                        <el-form-item label="设备图片">
                            <el-upload
                                class="equipment-uploader"
                                action="/api/upload"
                                :show-file-list="false"
                                :on-success="handleUploadSuccess"
                                :before-upload="beforeUpload">
                                <img v-if="editForm.image" :src="editForm.image" class="equipment-image">
                                <i v-else class="el-icon-plus equipment-uploader-icon"></i>
                            </el-upload>
                        </el-form-item>
                    </el-form>
                    <span slot="footer" class="dialog-footer">
                        <el-button @click="EditdialogVisible = false">取 消</el-button>
                        <el-button type="primary" @click="submitForm('editForm')">确 定</el-button>
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
            width="50%"
            :before-close="handleClose">
            <el-form :model="addForm" :rules="rules" ref="addForm" label-width="120px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="设备名称" prop="name">
                            <el-input v-model="addForm.name"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="设备编号" prop="equipment_code">
                            <el-input v-model="addForm.equipment_code"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="设备型号" prop="model">
                            <el-input v-model="addForm.model"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="生产厂商" prop="manufacturer">
                            <el-input v-model="addForm.manufacturer"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="所属科室" prop="department">
                            <el-select v-model="addForm.department" placeholder="请选择科室" style="width: 100%">
                                <el-option label="放射科" value="放射科"></el-option>
                                <el-option label="检验科" value="检验科"></el-option>
                                <el-option label="手术室" value="手术室"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="存放位置" prop="location">
                            <el-input v-model="addForm.location"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="设备状态" prop="status">
                            <el-select v-model="addForm.status" placeholder="请选择状态" style="width: 100%">
                                <el-option label="正常" value="normal"></el-option>
                                <el-option label="维修中" value="maintenance"></el-option>
                                <el-option label="报废" value="scrapped"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="采购价格" prop="purchase_price">
                            <el-input v-model="addForm.purchase_price" type="number">
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
                                placeholder="选择日期"
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
                                placeholder="选择日期"
                                value-format="yyyy-MM-dd"
                                style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                </el-row>
                
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="预计使用年限" prop="service_life">
                            <el-input v-model="addForm.service_life" type="number">
                                <template slot="append">年</template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="下次维护日期" prop="next_maintenance_date">
                            <el-date-picker
                                v-model="addForm.next_maintenance_date"
                                type="date"
                                placeholder="选择日期"
                                value-format="yyyy-MM-dd"
                                style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                </el-row>
                
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="负责人" prop="responsible_person">
                            <el-input v-model="addForm.responsible_person"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="联系电话" prop="contact_number">
                            <el-input v-model="addForm.contact_number"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                
                <el-form-item label="设备描述" prop="description">
                    <el-input type="textarea" v-model="addForm.description" :rows="3"></el-input>
                </el-form-item>
                
                <el-form-item label="设备图片" prop="image_url">
                    <el-upload
                        class="equipment-uploader"
                        action="#"
                        :show-file-list="false"
                        :before-upload="beforeUpload"
                        :http-request="handleUploadRequest"
                        :on-success="handleAddUploadSuccess">
                        <img v-if="addForm.image_url" :src="addForm.image_url" class="equipment-image">
                        <i v-else class="el-icon-plus equipment-uploader-icon"></i>
                    </el-upload>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="addDialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="submitAddForm('addForm')">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { getEquipmentList, createEquipment, updateEquipment, deleteEquipment, uploadEquipmentImage } from '@/api'

export default {
    data() {
        return {
            loading: false,
            searchQuery: '',
            filterDepartment: '',
            filterStatus: '',
            equipmentList: [],
            pagination: {
                page: 1,
                size: 10,
                total: 0
            },
            selectedEquipment: {},
            editForm: {},
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
            return this.equipmentList.filter(item => {
                const matchesSearch = !this.searchQuery || 
                    item.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesDepartment = !this.filterDepartment || item.department === this.filterDepartment;
                const matchesStatus = !this.filterStatus || item.status === this.filterStatus;
                return matchesSearch && matchesDepartment && matchesStatus;
            });
        }
    },
    created() {
        this.fetchEquipmentList();
    },
    methods: {
        async fetchEquipmentList() {
            this.loading = true;
            try {
                const params = {
                    page: this.pagination.page,
                    size: this.pagination.size,
                    name: this.searchQuery || undefined,
                    department: this.filterDepartment || undefined,
                    status: this.filterStatus || undefined
                };
                
                const response = await getEquipmentList(params);
                if (response.code === 200) {
                    this.equipmentList = response.data.items || [];
                    this.pagination.total = response.data.total || 0;
                    this.pagination.page = response.data.page || 1;
                    this.pagination.size = response.data.size || 10;
                } else {
                    this.$message.error(response.message || '获取设备列表失败');
                }
            } catch (error) {
                console.error('获取设备列表失败:', error);
                this.$message.error('获取设备列表失败: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        formatDate(dateString) {
            if (!dateString) return '无';
            return new Date(dateString).toLocaleDateString('zh-CN');
        },
        formatStatus(status) {
            const statusMap = {
                'normal': '正常',
                'maintenance': '维修中',
                'scrapped': '报废'
            };
            return statusMap[status] || status;
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
            this.fetchEquipmentList();
        },
        handleSizeChange(size) {
            this.pagination.size = size;
            this.fetchEquipmentList();
        },
        handleCurrentChange(page) {
            this.pagination.page = page;
            this.fetchEquipmentList();
        },
        handleClose() {
            this.dialogVisible = false;
            this.EditdialogVisible = false;
        },
        checkDetail(item) {
            this.selectedEquipment = item;
            this.dialogVisible = true;
        },
        editDetail(item) {
            this.selectedEquipment = { ...item };
            this.editForm = { ...item };
            this.EditdialogVisible = true;
        },
        submitForm(formName) {
            this.$refs[formName].validate(async (valid) => {
                if (valid) {
                    this.loading = true;
                    try {
                        // 调用API更新设备数据
                        const response = await updateEquipment(this.editForm.id, this.editForm);
                        if (response.code === 200) {
                            this.$message.success('更新设备成功');
                            this.EditdialogVisible = false;
                            // 重新获取设备列表
                            this.fetchEquipmentList();
                        } else {
                            this.$message.error(response.message || '更新设备失败');
                        }
                    } catch (error) {
                        console.error('更新设备失败:', error);
                        this.$message.error('更新设备失败: ' + error.message);
                    } finally {
                        this.loading = false;
                    }
                }
            });
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
        handleUploadSuccess(res, file) {
            this.editForm.image = URL.createObjectURL(file.raw);
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
            // 如果表单引用存在，则重置验证
            if (this.$refs.addForm) {
                this.$refs.addForm.resetFields();
            }
        },
        
        submitAddForm(formName) {
            this.$refs[formName].validate(async (valid) => {
                if (valid) {
                    this.loading = true;
                    try {
                        // 调用API创建设备
                        const response = await createEquipment(this.addForm);
                        if (response.code === 200) {
                            this.$message.success('新增设备成功');
                            this.addDialogVisible = false;
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
                let id, response;
                
                // 先保存本地预览
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async () => {
                    const imageUrl = reader.result;
                    
                    if (this.addDialogVisible) {
                        // 新增设备时，需要先创建设备再上传图片
                        this.addForm.image = imageUrl; // 仅作为预览
                        if (options.onSuccess) {
                            options.onSuccess(imageUrl);
                        }
                    } else if (this.EditdialogVisible && this.editForm.id) {
                        // 编辑设备时，直接上传图片
                        this.editForm.image = imageUrl; // 先设置预览
                        
                        try {
                            // 上传图片到服务器
                            response = await uploadEquipmentImage(this.editForm.id, file);
                            
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
            this.addForm.image_url = res;
        }
    }
}
</script>

<style>
.main {
    display: flex;
    flex-direction: column;
    margin: 20px;
}

.search-box {
    display: flex;
    margin-bottom: 20px;
    gap: 10px;
}

.search-input {
    width: 300px;
}

.filter-select {
    width: 150px;
}

.equipment-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.container {
    display: flex;
    position: relative;
    width: 230px;
}

.bottom{
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.image{
    width: 100%;
    display: block;
}

.overlay {
    position: absolute;
    top: 25%;
    left: 0;
    width: 100%;
    opacity: 0;
    background-color: transparent;
    transition: opacity 0.5s;
    color: black;
    pointer-events:none;
}

.image:hover {
    cursor: pointer;
    filter: blur(5px);
    transition: 0.3s;
}

.image:hover + .overlay {
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

.equipment-uploader {
    width: 178px;
    height: 178px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.equipment-uploader:hover {
    border-color: #409EFF;
}

.equipment-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
}

.equipment-image {
    width: 178px;
    height: 178px;
    display: block;
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

.empty-data {
    width: 100%;
    text-align: center;
    padding: 30px;
    color: #909399;
    font-size: 14px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
}
</style>