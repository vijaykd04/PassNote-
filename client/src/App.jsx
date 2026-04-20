import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import { getCurrentUser } from './services/api'
import { useDispatch, useSelector } from 'react-redux'
import History from './pages/History'
import Notes from './pages/Notes'
import Pricing from './pages/Pricing'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailed from './pages/PaymentFailed'
import PdfAnalyzer from './pages/PdfAnalyzer'
import MockTest from './pages/MockTest'
import QuestionPredictor from './pages/QuestionPredictor'
import ComparePyq from './pages/ComparePyq'
import AiTeacher from './pages/AiTeacher'
import MyCompanion from './pages/MyCompanion'
export const serverUrl = "http://localhost:8000"

function App() {
  const dispatch = useDispatch()
  useEffect(()=>{
   getCurrentUser(dispatch)
  },[dispatch])

  const {userData} = useSelector((state)=>state.user)
  return (
    <>
    <Routes>
      <Route path='/' element={userData? <Home/> : <Navigate to="/auth" replace/>}/>
      <Route path='/auth' element={userData ? <Navigate to="/" replace/> : <Auth/>}/>
      <Route path='/history' element={userData? <History/> : <Navigate to="/auth" replace/>}/>
      <Route path='/notes' element={userData? <Notes/> : <Navigate to="/auth" replace/>}/>
      <Route path='/pricing' element={userData? <Pricing/> : <Navigate to="/auth" replace/>}/>
      <Route path='/pdf-analyzer' element={userData? <PdfAnalyzer/> : <Navigate to="/auth" replace/>}/>
      <Route path='/mock-test' element={userData? <MockTest/> : <Navigate to="/auth" replace/>}/>
      <Route path='/question-predictor' element={userData? <QuestionPredictor/> : <Navigate to="/auth" replace/>}/>
      <Route path='/compare-pyq' element={userData? <ComparePyq/> : <Navigate to="/auth" replace/>}/>
      <Route path='/ai-teacher' element={userData? <AiTeacher/> : <Navigate to="/auth" replace/>}/>
      <Route path='/my-companion' element={userData? <MyCompanion/> : <Navigate to="/auth" replace/>}/>

      <Route path='/payment-success' element={<PaymentSuccess/>}/>
      <Route path='/payment-failed' element={<PaymentFailed/>}/>
    </Routes>
     
    </>
  )
}

export default App
