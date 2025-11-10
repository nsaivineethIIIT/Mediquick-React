import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Home from './components/common/Home';
import './utils/toast.css';
import Footer from './components/common/Footer';
import FAQs from './components/FAQ';
import PatientForm from './components/pages/PatientForm';
import PatientDashboard from './components/pages/PatientDashboard';
import BookAppointment from './components/pages/BookAppointment';
import BookDocOnline from './components/pages/BookDocOnline';
import DoctorProfilePatient from './components/pages/DoctorProfilePatient';
import DoctorForm from './components/pages/DoctorForm';
import DoctorDashboard from './components/pages/DoctorDashboard';
import PatientProfile from './components/pages/PatientProfile';
import DoctorProfile from './components/pages/DoctorProfile';
import AdminForm from './components/pages/AdminForm';
import AdminDashboard from './components/pages/AdminDashboard';
import AdminSearchData from './components/pages/AdminSearchData';
import PatientEditProfile from './components/pages/PatientEditProfile';
import DoctorEditProfile from './components/pages/DoctorEditProfile';
import AdminProfile from './components/pages/AdminProfile';
import AdminEditProfile from './components/pages/AdminEditProfile';
import EmployeeForm from './components/pages/EmployeeForm';
import EmployeeDashboard from './components/pages/EmployeeDashboard';
import EmployeeProfile from './components/pages/EmployeeProfile';
import EmployeeEditProfile from './components/pages/EmployeeEditProfile';
import DoctorGeneratePrescriptions from './components/pages/DoctorGeneratePrescriptions';
import DoctorPrescriptions from './components/pages/DoctorPrescriptions';
import PatientPrescriptions from './components/pages/PatientPrescriptions';
import SupplierForm from './components/pages/SupplierForm';

import SupplierDashboard from './components/pages/SupplierDashboard';
// NEW IMPORTS for E-commerce flow
import OrderMedicines from './components/pages/OrderMedicines';
import MedicineDetail from './components/pages/MedicineDetail';
import PatientCart from './components/pages/PatientCart';
import Checkout from './components/pages/Checkout'; 
import PatientOrders from './components/pages/PatientOrders';
import OrderDetails from './components/pages/OrderDetails';
import PaymentPage from './components/pages/PaymentPage';
import OrderSuccess from './components/pages/OrderSuccess';
import BlogPage from './components/pages/BlogPage';
import PostBlog from './components/pages/PostBlog';
import SingleBlog from './components/pages/SingleBlog';
import { PatientProvider } from './context/PatientContext';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patient/form" element={<PatientForm />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/book-appointment" element={<BookAppointment />} />
        <Route path="/patient/book-doc-online" element={<BookDocOnline />} />
        <Route path="/patient/doctor-profile-patient/:id" element={<DoctorProfilePatient />} />
        
        {/* DOCTOR ROUTES */}
        <Route path="/doctor/form" element={<DoctorForm />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route path="/doctor/edit-profile" element={<DoctorEditProfile />} />
        <Route path="/doctor/generate-prescriptions" element={<DoctorGeneratePrescriptions />} />
        <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
        
        {/* ADMIN ROUTES */}
        <Route path="/admin/form" element={<AdminForm />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/search-data" element={<AdminSearchData />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/edit-profile" element={<AdminEditProfile />}/>
        
        {/* EMPLOYEE ROUTES */}
        <Route path="/employee/form" element={<EmployeeForm />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/profile" element={<EmployeeProfile />} />
        <Route path="/employee/edit-profile" element={<EmployeeEditProfile />} />
        
        {/* PATIENT PROFILE/EDIT ROUTES */}
        <Route path="/patient/profile" element={<PatientProvider><PatientProfile /></PatientProvider>} />
        <Route path="/patient/edit-profile" element={<PatientProvider><PatientEditProfile /></PatientProvider>} />
        <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />

        {/* SUPPLIER ROUTES */}
        <Route path="/supplier/form" element={<SupplierForm />} />
        <Route path="/supplier/dashboard" element={<SupplierDashboard />} />

        {/* NEW E-COMMERCE ROUTES */}
        <Route path="/patient/order-medicines" element={<OrderMedicines />} />
        <Route path="/patient/medicines/:id" element={<MedicineDetail />} />
        <Route path="/patient/cart" element={<PatientCart />} />
        <Route path="/patient/orders" element={<PatientOrders />} />
        <Route path="/patient/orders/:id" element={<OrderDetails />} />
        <Route path="/patient/checkout" element={<Checkout />} /> 
        <Route path="/patient/order-details" element={<OrderDetails />} />
        <Route path="/patient/payment" element={<PaymentPage />} />
        <Route path="/patient/order-success" element={<OrderSuccess />} />
        {/* BLOG ROUTES */}
        {/* BLOG ROUTES 📝 (New) */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/post" element={<PostBlog />} />
        <Route path="/blog/:id" element={<SingleBlog />} />
        {/* Add route for single blog view. Component conversion not requested, so using placeholder. */}
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;