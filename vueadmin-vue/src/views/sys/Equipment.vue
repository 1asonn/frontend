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
            <el-select v-model="filterType" placeholder="设备类型" @change="handleSearch" class="filter-select">
                <el-option label="全部" value=""></el-option>
                <el-option label="医疗器械" value="医疗器械"></el-option>
                <el-option label="检验设备" value="检验设备"></el-option>
            </el-select>
            <el-select v-model="filterStatus" placeholder="设备状态" @change="handleSearch" class="filter-select">
                <el-option label="全部" value=""></el-option>
                <el-option label="正常" value="正常"></el-option>
                <el-option label="维修中" value="维修中"></el-option>
                <el-option label="报废" value="报废"></el-option>
            </el-select>
        </div>
        <div v-loading="loading" class="equipment-container">
            <div class="container" v-for="item in filteredEquipmentList" :key="item.id">
                <el-card :body-style="{ position:'relative', padding: '0px' }">
                    <img src="@/assets/jinan.jpg" @click="checkDetail(item)"  class="image">
                    <div class="overlay">
                        <i></i>
                        <span>查看详情</span>
                    </div>
                    <div style="position:relative;padding: 14px;">
                        <span>{{ item.name }}</span>
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
                                    src="http://localhost:4000/uploads/1741791098337.JPG" 
                                    :preview-src-list=[selectedEquipment.image]>
                                </el-image></p>
                                <p>类型：{{ selectedEquipment.type }}</p>
                                <p>科室：{{ selectedEquipment.partment }}</p>
                                <p>位置：{{ selectedEquipment.position }}</p>
                            </div>
                            <div class="right-column">
                                <p>状态：{{ selectedEquipment.status }}</p>
                                <p>编号：{{ selectedEquipment.code }}</p>
                                <p>型号：{{ selectedEquipment.model }}</p>
                                <p>采购日期：{{ selectedEquipment.purchaseDate }}</p>
                                <p>使用年限：{{ selectedEquipment.useYear }}</p>
                                <p>制造商：{{ selectedEquipment.manufacturer }}</p>
                                
                
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
                        <el-form-item label="设备类型" prop="type">
                            <el-select v-model="editForm.type" placeholder="请选择设备类型">
                                <el-option label="医疗器械" value="医疗器械"></el-option>
                                <el-option label="检验设备" value="检验设备"></el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item label="所属科室" prop="partment">
                            <el-input v-model="editForm.partment"></el-input>
                        </el-form-item>
                        <el-form-item label="设备编号" prop="code">
                            <el-input v-model="editForm.code"></el-input>
                        </el-form-item>
                        <el-form-item label="设备状态" prop="status">
                            <el-select v-model="editForm.status" placeholder="请选择设备状态">
                                <el-option label="正常" value="正常"></el-option>
                                <el-option label="维修中" value="维修中"></el-option>
                                <el-option label="报废" value="报废"></el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item label="设备型号" prop="model">
                            <el-input v-model="editForm.model"></el-input>
                        </el-form-item>
                        <el-form-item label="位置" prop="position">
                            <el-input v-model="editForm.position"></el-input>
                        </el-form-item>
                        <el-form-item label="采购日期" prop="purchaseDate">
                            <el-date-picker
                                v-model="editForm.purchaseDate"
                                type="date"
                                placeholder="选择日期">
                            </el-date-picker>
                        </el-form-item>
                        <el-form-item label="制造商" prop="manufacturer">
                            <el-input v-model="editForm.manufacturer"></el-input>
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
    </div>
</template>

<script>
export default {
    data() {
        return {
            loading: false,
            searchQuery: '',
            filterType: '',
            filterStatus: '',
            equipmentList: [{
                id: 1,
                name: 'CT机',
                type: '医疗器械',
                partment: '放射科',
                code: '123456',
                status: '正常',
                model: 'CT-1000',
                position: '病房',
                purchaseDate: '2021-01-01',
                manufacturer: 'GE',
                image: "https://i.ibb.co/PQDZ2s1/jnu.jpg"
            }, {
                id: 2,
                name: 'MRI机',
                type: '医疗器械',
                partment: '内科',
                code: '1234567',
                status: '正常',
                model: 'MRI-1000',
                position: '病房',
                purchaseDate: '2021-01-01',
                manufacturer: 'GE',
                image: "https://i.ibb.co/PQDZ2s1/jnu.jpg"
            }],
            selectedEquipment: {},
            editForm: {},
            rules: {
                name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
                type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
                partment: [{ required: true, message: '请输入所属科室', trigger: 'blur' }],
                code: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
                status: [{ required: true, message: '请选择设备状态', trigger: 'change' }]
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
                const matchesType = !this.filterType || item.type === this.filterType;
                const matchesStatus = !this.filterStatus || item.status === this.filterStatus;
                return matchesSearch && matchesType && matchesStatus;
            });
        }
    },
    methods: {
        handleSearch() {
            // 搜索逻辑已通过计算属性实现
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
                    setTimeout(() => {
                        // 模拟API调用
                        const index = this.equipmentList.findIndex(item => item.id === this.editForm.id);
                        if (index !== -1) {
                            this.equipmentList[index] = { ...this.editForm };
                        }
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
</style>