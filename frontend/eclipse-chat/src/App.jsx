import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';

import LandingPage from './components/LandingPage';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Chats from './components/Chats';
import NotFound from './components/NotFound';
import LoadingPage from './components/LoadingPage';

import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoadingPage/>} />
        <Route path="/LandingPage" element={<LandingPage/>} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chats" element={<Chats/>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App;