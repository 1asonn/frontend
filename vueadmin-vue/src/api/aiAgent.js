import request from '../axios.js'


export const MedicalHistoryAnalysis = async(records) => {
    const response = await request.post('http://localhost:4000/aiagent/MedicalAnalyze',{record:records})
    return response.data
}