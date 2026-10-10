
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'
import HomePage from './pages/HomePage'

function App() {
  return (
    <div className="min-h-screen bg-cream md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 pb-24 md:pb-8">
        <Header />
        <HomePage />
      </main>

      <MobileNav />
    </div>
  )
}

export default App
