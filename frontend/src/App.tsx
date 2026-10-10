
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'
import HomePage from './pages/HomePage'
import DishesPage from './pages/DishesPage'

function ComingSoonPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-10">
      <h1 className="text-2xl font-bold text-ink">
        Chức năng đang được phát triển
      </h1>
      <p className="mt-2 text-sm text-muted">
        Trang này sẽ được triển khai trong các bước tiếp theo.
      </p>
    </div>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-cream md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 pb-24 md:pb-8">
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dishes" element={<DishesPage />} />
          <Route path="/random" element={<ComingSoonPage />} />
          <Route path="/meal-plan" element={<ComingSoonPage />} />
          <Route path="/history" element={<ComingSoonPage />} />
          <Route path="/statistics" element={<ComingSoonPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <MobileNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
