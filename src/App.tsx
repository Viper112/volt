import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LiveProvider } from './context/LiveContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Browse } from './pages/Browse'
import { CategoryPage } from './pages/Category'
import { Following } from './pages/Following'
import { SearchPage } from './pages/Search'
import { GoLive } from './pages/GoLive'
import { Watch } from './pages/Watch'

export default function App() {
  return (
    <AuthProvider>
      <LiveProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/browse/categories" element={<Browse />} />
              <Route path="/browse/clips" element={<Browse />} />
              <Route path="/directory/:slug" element={<CategoryPage />} />
              <Route path="/following" element={<Following />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/go-live" element={<GoLive />} />
              <Route path="/:username" element={<Watch />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LiveProvider>
    </AuthProvider>
  )
}
