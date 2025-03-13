<template>
    <div class="container">
        <el-tree
            ref="tree"
            :data="initialData"
            show-checkbox
            node-key="name" 
            :props="defaultProps"  
            default-expand-all
            :default-checked-keys="defaultCheckedKeys"
            @check="getSelectedNodes"
            >
        </el-tree>
    </div>
</template>


<script>
    export default{
        // 接收父组件入参
        props:{
            // 树的数据源
            initialData:{
                type: Array, 
                default: () => [] 
            },
            // 自定义树节点属性
            defaultProps:{
                type:Object,
                default: () => {}
            },
            defaultCheckedKeys:{
                type:Array,
                default: () => []
            }
        },

        data(){
            return{
                
            }
        },

        methods:{
            getSelectedNodes(){
                const checkedNodes = this.$refs.tree.getCheckedKeys()
                this.$emit("get-checkedNodes", checkedNodes );
            }
        }
    }
</script>


<style>
    .container{
        display: flex;
        justify-content: flex-start;


    }

    .el-tree{
        border-radius: 10px;
        padding: 10px;
        width: auto;
    }

</style>