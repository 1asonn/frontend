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
        </div>
        <div v-loading="loading" class="equipment-container">
            <div v-if="equipmentList.length === 0" class="empty-data">
                暂无设备数据
            </div>
            <div class="container" v-for="item in filteredEquipmentList" :key="item.id">
                <el-card :body-style="{ position:'relative', padding: '0px' }">
                    <img src="@/assets/jinan.jpg" @click="checkDetail(item)"  class="image">
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
                                    src="@/assets/jinan.jpg" 
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
    </div>
</template>

<script>
import { GetEquipmentList } from '@/api'

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
                department: [{ required: true, message: '请输入所属科室', trigger: 'blur' }],
                status: [{ required: true, message: '请选择设备状态', trigger: 'change' }],
                model: [{ required: true, message: '请输入设备型号', trigger: 'blur' }],
                manufacturer: [{ required: true, message: '请输入制造商', trigger: 'blur' }]
            },
            dialogVisible: false,
            EditdialogVisible: false
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
                
                const response = await GetEquipmentList(params);
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
            this.$refs[formName].validate((valid) => {
                if (valid) {
                    this.loading = true;
                    // 这里应该调用API保存数据
                    // 注意：需要实现设备更新的API
                    setTimeout(() => {
                        // 模拟API调用成功后重新获取列表
                        this.fetchEquipmentList();
                        this.loading = false;
                        this.EditdialogVisible = false;
                        this.$message.success('保存成功');
                    }, 1000);
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