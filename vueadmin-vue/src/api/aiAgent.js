import request from '../axios.js'
import { CozeAPI } from '@coze/api';

const apiClient = new CozeAPI({
  token: 'pat_i0V2sT3gNbuYKJwH7kC8Tcyk5opRN71oeYj8ISrW4N5PzymaE2aTtUJo2vxaKRyL',
  baseURL: 'https://api.coze.cn',
  allowPersonalAccessTokenInBrowser: true
});

export const MedicalHistoryAnalysis = async(records) => {
    const response = await request.post('http://localhost:4000/aiagent/MedicalAnalyze',{record:records})
    return response.data
}

export const DataAnalyze = async(data) => {
    const stream = await apiClient.workflows.runs.stream({
        workflow_id: '7486457220134338610',
        parameters: {
          "excel": "https://p3-bot-workflow-sign.byteimg.com/tos-cn-i-mdko3gqilj/9de53c3fa0e84c11aefca1551b85fd73.xlsx~tplv-mdko3gqilj-image.image?rk3s=81d4c505&x-expires=1774193770&x-signature=W81HOV97xUvpgHg3nrmyKhz4JQY%3D&x-wf-file_name=%E6%88%B4%E5%B8%88%E5%85%84%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90%E5%90%AF%E8%92%99%E8%AF%BE_Excel%E7%BB%83%E4%B9%A0.xlsx"
        }
      });
      console.log("stream",stream)
    return stream
}