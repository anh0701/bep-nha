
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'
import HomePage from './pages/HomePage'
import DishesPage from './pages/DishesPage'
import RandomPage from './pages/RandomPage'
import HistoryPage from './pages/HistoryPage'
import MealPlanPage from './pages/MealPlanPage'
import MealPlanDetailPage from './pages/MealPlanDetailPage'
import StatisticsPage from './pages/StatisticsPage'
import IngredientsPage from './pages/IngredientsPage'
import IngredientSearchPage from './pages/IngredientSearchPage'
import IngredientRecognitionPage from './pages/IngredientRecognition'

function AppLayout() {
  return (
    <div className="h-screen overflow-hidden bg-cream md:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto pb-24 md:pb-8">
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dishes" element={<DishesPage />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/random" element={<RandomPage />} />
          <Route path="/ingredient-search" element={<IngredientSearchPage />}/>
          <Route path="/meal-plan" element={<MealPlanPage />} />
          <Route path="/meal-plan/:id" element={<MealPlanDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path='/vision' element={<IngredientRecognitionPage></IngredientRecognitionPage>}></Route>
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
