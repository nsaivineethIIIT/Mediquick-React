import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Home from './components/common/Home';
import Footer from './components/common/Footer';
// import About from './components/pages/About';
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
// import Blog from './components/pages/Blog';
// import Contact from './components/pages/Contact';
// import DoctorForm from './components/pages/DoctorForm';
// import PatientForm from './components/pages/PatientForm';
// import AdminForm from './components/pages/AdminForm';
// import EmployeeForm from './components/pages/EmployeeForm';
// import SupplierForm from './components/pages/SupplierForm';

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
        <Route path="/doctor/form" element={<DoctorForm />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route path="/admin/form" element={<AdminForm />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/search-data" element={<AdminSearchData />} />
        <Route path="/patient/edit-profile" element={<PatientEditProfile />} />
        <Route path="/doctor/edit-profile" element={<DoctorEditProfile />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/edit-profile" element={<AdminEditProfile />}/>
        {/* <Route path="/about" element={<About />} /> */}
        {/* <Route path="/faqs" element={<FAQ />} /> */}
        {/* <Route path="/blog" element={<Blog />} /> */}
        {/* <Route path="/contact" element={<Contact />} /> */}
        {/* <Route path="/doctor/form" element={<DoctorForm />} /> */}
        {/* <Route path="/patient/form" element={<PatientForm />} /> */}
        {/* <Route path="/admin/form" element={<AdminForm />} /> */}
        {/* <Route path="/employee/form" element={<EmployeeForm />} /> */}
        {/* <Route path="/supplier/form" element={<SupplierForm />} /> */}
        {/* <Route path="/privacy" element={<div>Privacy Policy</div>} /> */}
        {/* <Route path="/terms" element={<div>Terms & Conditions</div>} /> */}
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;