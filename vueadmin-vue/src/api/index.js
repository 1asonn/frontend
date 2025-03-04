import request from '../axios.js'

export const GetPatientList = async () => {
        try{
            const response = await request.get('http://localhost:4000/patient/getPatients')
            return response
        }catch(error){
            console.error("error",error)
        }
    }
