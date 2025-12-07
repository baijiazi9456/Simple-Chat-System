import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/chat" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App



