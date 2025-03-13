<template>
<div class="form-container">
<el-form :model="passwordForm" :rules="rules" ref="passwordForm" label-width="100px">
  <el-form-item label="旧密码" prop="oldPassword">
    <el-input v-model="passwordForm.name"></el-input>
  </el-form-item>
  <el-form-item label="新密码" prop="newPassword">
    <el-input v-model="passwordForm.name"></el-input>
  </el-form-item>
  <el-form-item label="确认密码" prop="confirmPassword">
    <el-input v-model="passwordForm.name"></el-input>
  </el-form-item>
</el-form> 
<TreeSelect :initialData="authTreeData" 
            :defaultProps="defaultProps" 
            :defaultCheckedKeys="defaultCheckedKeys" 
            v-if="authTreeData"
            @get-checkedNodes="handleCheckedNodes">
</TreeSelect>

<div>{{ selectedAuth }}</div>
</div>     
</template>


<script>
 import TreeSelect from '@/components/TreeSelect.vue'
 import {GetAuthTree} from '@/api/index.js'
export default {
    components:{
        TreeSelect
    },
    created(){
            GetAuthTree().then((res) => {
                this.authTreeData = res
            })
        },

    data(){
        return{
            selectedAuth:'',
            // 传入树组件的数据
            authTreeData:null,
            // 树组件自定义节点属性
            defaultProps: {
                label: "title", 
                children: "children" ,
                value:"name"
            },
            // 默认选中的树节点
            defaultCheckedKeys:[
                "EquipmentManager","SysEquipment"
            ],
            passwordForm:{
                oldPassword:"",
                newPassword:"",
                confirmPassword:""
            },
            rules:{
                oldPassword:{
                    required:true,
                    message:"请输入旧密码",
                    trigger:"blur"
                },
                newPassword:{
                    required:true,
                    message:"请输入新密码",
                    trigger:"blur"
                },
                confirmPassword:{
                    required:true,
                    message:"请再次输入新密码",
                    trigger:"blur"
                }
            }
        }
    },
    name:"userCenter",

    methods:{
        handleCheckedNodes(payload){
            this.selectedAuth = payload
        }
    }

}

</script>

<style scoped>
    .el-form{
        width: 50%;
    }

    .form-container{
        display: flex;
        flex-direction: column;
        justify-content: center;
        
    }

    
</style>