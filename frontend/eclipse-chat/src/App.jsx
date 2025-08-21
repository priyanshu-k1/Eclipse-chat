import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './components/LandingPage';
import SignUp from './components/SignUp';
import Login from './components/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App;