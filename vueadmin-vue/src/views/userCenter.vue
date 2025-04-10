<template>
<div class="form-container">
<Calendar :schedule-data="scheduleData"></Calendar>
<el-form :model="passwordForm" :rules="rules" ref="passwordForm" label-width="100px">
  <el-form-item label="旧密码" prop="oldPassword">
    <el-input v-model="passwordForm.oldPassword"></el-input>
  </el-form-item>
  <el-form-item label="新密码" prop="newPassword">
    <el-input v-model="passwordForm.newPassword"></el-input>
  </el-form-item>
  <el-form-item label="确认密码" prop="confirmPassword">
    <el-input v-model="passwordForm.confirmPassword"></el-input>
  </el-form-item>
</el-form> 
<TreeSelect :initialData="authTreeData" 
            :defaultProps="defaultProps" 
            :defaultCheckedKeys="defaultCheckedKeys" 
            v-if="authTreeData"
            @get-checkedNodes="handleAuthChange">
</TreeSelect>

<div>{{ selectedAuth }}</div>
</div>     
</template>


<script>
 import TreeSelect from '@/components/TreeSelect.vue'
 import {GetAuthTree} from '@/api/index.js'
 import Calendar from '../components/Calendar.vue'
 import {GetCurrentSchedule} from '../api/schedule.js'

export default {
    components:{
        TreeSelect,
        Calendar
    },
    
    data(){
        return{
            selectedAuth:[],
            // 传入树组件的数据
            authTreeData:[],
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
                oldPassword:'',
                newPassword:'',
                confirmPassword:''
            },
            rules:{
                oldPassword:[
                    {
                        required:true,
                        message:"请输入旧密码",
                        trigger:"blur"
                    }
                ],
                newPassword:[
                    {
                        required:true,
                        message:"请输入新密码",
                        trigger:"blur"
                    }
                ],
                confirmPassword:[
                    {
                        required:true,
                        message:"请再次输入新密码",
                        trigger:"blur"
                    }
                ]
            },
            scheduleData: {}
        }
    },
    created(){
        GetAuthTree().then((res) => {
            this.authTreeData = res.data
        })
        this.getScheduleData()
    },
    methods:{
        async getScheduleData(){
            try {
                const response = await GetCurrentSchedule()
                console.log("schedule",response)
                const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = response.data.data
                this.scheduleData = { monday, tuesday, wednesday, thursday, friday, saturday, sunday }
            } catch (error) {
                console.error('获取排班失败:', error)
                throw error
            }
        },
        // async getScheduleData() {
        //     try {
        //         // Replace this with your actual API endpoint
        //         const response = await axios.get('/api/schedule/employee/4')
        //         if (response.data.code === 200) {
        //             const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = response.data.data
        //             this.scheduleData = { monday, tuesday, wednesday, thursday, friday, saturday, sunday }
        //         }
        //     } catch (error) {
        //         console.error('Error fetching schedule:', error)
        //     }
        // },
        handleAuthChange(payload){
            this.selectedAuth = payload
        }
    }
}

</script>

<style scoped>
.el-form {
    width: 50%;
    margin-top: 20px;
}

.form-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
}

:deep(.fc) {
    width: 80%;
    margin-bottom: 30px;
}
</style>