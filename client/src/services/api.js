import axios from "axios"
import { serverUrl } from "../App"
import { setUserData } from "../redux/userSlice"

export const getCurrentUser = async (dispatch) => {
    try {
        const result = await axios.get(serverUrl + "/api/user/currentuser" , {withCredentials:true})
        
        dispatch(setUserData(result.data))
    } catch (error) {
        console.log(error)
    }
}

export const generateNotes = async (payload) => {
    try {
        const result = await axios.post(serverUrl+ "/api/notes/generate-notes" , payload , {withCredentials:true})
        console.log(result.data)
        return result.data

    } catch (error) {
        console.log(error)
    }
}

export const analyzePdf = async (file) => {
    const formData = new FormData()
    formData.append("pdf", file)
    const result = await axios.post(serverUrl + "/api/pdf/analyze-pdf", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
    })
    return result.data
}

export const analyzeImage = async (file) => {
    const formData = new FormData()
    formData.append("image", file)
    const result = await axios.post(serverUrl + "/api/pdf/analyze-image", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
    })
    return result.data
}

export const generateMockTest = async (file) => {
    const formData = new FormData()
    formData.append("pdf", file)
    const result = await axios.post(serverUrl + "/api/pdf/mock-test", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
    })
    return result.data
}

export const predictQuestions = async (file) => {
    const formData = new FormData()
    formData.append("pdf", file)
    const result = await axios.post(serverUrl + "/api/pdf/predict-questions", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
    })
    return result.data
}

export const predictQuestionsFromImage = async (file) => {
    const formData = new FormData()
    formData.append("image", file)
    const result = await axios.post(serverUrl + "/api/pdf/predict-questions-image", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
    })
    return result.data
}

export const comparePyq = async (files) => {
    const formData = new FormData()
    files.forEach(f => formData.append("files", f))
    const result = await axios.post(serverUrl + "/api/pdf/compare-pyq", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
    })
    return result.data
}

export const downloadPdf = async (result) => {

    try {
        const response = await axios.post(serverUrl+ "/api/pdf/generate-pdf" , {result} , {
            responseType:"blob" , withCredentials:true
        })

        const blob = new Blob([response.data], {
      type: "application/pdf"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ExamNotesAI.pdf";
    link.click();

    window.URL.revokeObjectURL(url);
    } catch (error) {
         throw new Error("PDF download failed");

    }
}