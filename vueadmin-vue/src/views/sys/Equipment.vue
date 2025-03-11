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
                        <el-button type="text" class="button">编辑</el-button>
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
                    <p>编号：{{ selectedEquipment.code }}</p>
                    <p>类型：{{ selectedEquipment.type }}</p>
                    <p>科室：{{ selectedEquipment.partment }}</p>
                    <p>状态：{{ selectedEquipment.status }}</p>
                    <p>图片：</p>
                    <img :src="selectedEquipment.image" alt="">
                </div>
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
                    image:'@/assets/jinan.jpg'
                },{
                    id:2,
                    name:'MRI机',
                    type:'医疗器械',
                    partment:'内科',
                    code:'1234567',
                    status:'正常',
                    image:'@/assets/jinan.jpg'
                }],
                selectedEquipment: {},
                currentDate: 'hello',
                dialogVisible:false,
            }
        },
        methods:{
            handleClose(){this.dialogVisible = false},
            checkDetail(item){
                this.selectedEquipment = item;
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



</style>