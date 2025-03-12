<template>
    <div class="main">
        <div class="search-box"></div>
        <div class="container" v-for="item in equipmentList">
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
                    <!-- <p>实拍图:</p> -->
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
                :title="selectedEquipment.name"
                :visible.sync="EditdialogVisible"
                width="50%"
                :before-close="handleClose">
                <!-- <el-upload
                    action="https://jsonplaceholder.typicode.com/posts/"
                    list-type="picture-card"
                    :on-preview="handlePictureCardPreview"
                    :on-remove="handleRemove">
                    <i class="el-icon-plus"></i>
                </el-upload> -->
                <!-- <el-dialog :visible.sync="dialogVisible">
                    <img width="100%" :src="dialogImageUrl" alt="">
                </el-dialog> -->
                <span slot="footer" class="dialog-footer">
                    <el-button @click="dialogVisible = false">取 消</el-button>
                    <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
                </span>
            </el-dialog>
        </div>

        
    </div>
</template>





<script>
    export default {
        data(){
            return {
                equipmentList: [{
                    id:1,
                    name:'CT机',
                    type:'医疗器械',
                    partment:'放射科',
                    code:'123456',
                    status:'正常',
                    model:'CT-1000',
                    position:'病房',
                    purchaseDate:'2021-01-01',
                    manufacturer:'GE',
                    image:"https://i.ibb.co/PQDZ2s1/jnu.jpg"
                },{
                    id:2,
                    name:'MRI机',
                    type:'医疗器械',
                    partment:'内科',
                    code:'1234567',
                    status:'正常',
                    model:'MRI-1000',
                    position:'病房',
                    purchaseDate:'2021-01-01',
                    manufacturer:'GE',
                    image:"https://i.ibb.co/PQDZ2s1/jnu.jpg"
                }],
                selectedEquipment: {},
                currentDate: 'hello',
                dialogVisible:false,
                EditdialogVisible:false
            }
        },
        methods:{
            handleClose(){this.dialogVisible = false},
            checkDetail(item){
                this.selectedEquipment = item;
                this.dialogVisible = true;
            },
            editDetail(item){
                this.EditdialogVisible = true
            },
            handleRemove(file, fileList) {
            console.log(file, fileList);
            },
            handlePictureCardPreview(file) {
            this.dialogImageUrl = file.url;
            this.dialogVisible = true;
            }
            }
    }
</script>



<style>
    .main {
        display: flex;
        flex-wrap: wrap;
        margin: 10px 10px;
    }

    .container {
        display: flex;
        position: relative;
        margin: 10px;
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
    p{
        text-decoration: underline;
        text-underline-offset: 3px; /* 下划线与文字的间距 */
        margin-bottom: 20px;
    }
    /* .right-column {
        margin-right: 0;
        margin-left: 10px;
    } */


</style>