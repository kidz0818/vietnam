import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AddLocation from './pages/AddLocation';
import LocationDetails from './pages/LocationDetails';
import Plan from './pages/Plan';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="plan" element={<Plan />} />
          <Route path="add" element={<AddLocation />} />
          <Route path="place/:id" element={<LocationDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
