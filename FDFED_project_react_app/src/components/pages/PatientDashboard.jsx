import React from 'react';
import { Link } from 'react-router-dom';

import '../../assets/css/PatientDashboard.css';

const PatientDashboard = () => {
  return (
    <div className="patient-dashboard">
      <header>
        <Link to="/" className="logo">
          <span>M</span>edi<span>Q</span>uick
        </Link>
        <nav className="navbar">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/patient/prescriptions">My Prescriptions</Link></li>
            <li><Link to="/logout">LogOut</Link></li>
            <li>
              <Link to="/patient/profile">
                Profile
              </Link>
            </li>
          </ul>
        </nav>
        <div className="fas fa-bars"></div>
      </header>

      <div className="close-btn" onClick={() => window.history.back()}>
        <i className="fas fa-times"></i>
      </div>

      <section id="about" className="about">
        <h1 className="heading">About our Facilities</h1>
        <h3 className="title">Learn and explore our facility</h3>
        
        <div className="box-container">
          <div className="box">
            <div className="images">
              <img 
                src="https://static.vecteezy.com/system/resources/previews/004/578/683/original/a-patient-consults-a-doctor-and-nurse-free-vector.jpg"
                alt="Doctor Consulting"
              />
            </div>
            <div className="content">
              <h3>Consult Doctors Online</h3>
              <p>
                Get expert medical consultations from certified doctors from the comfort of your home. 
                Our platform connects you with specialists across various fields, providing instant access 
                to professional advice, diagnoses, and treatment plans via video calls and chat.
              </p>
              <Link to="/patient/book-doc-online">
                <button className="button">Learn More</button>
              </Link>
            </div>
          </div>

          <div className="box">
            <div className="images">
              <img 
                src="https://www.shutterstock.com/image-photo/booking-meeting-appointment-on-laptop-600nw-1930285112.jpg"
                alt="Appointment Booking"
              />
            </div>
            <div className="content">
              <h3>Book Appointments</h3>
              <p>
                Schedule appointments with doctors effortlessly through our user-friendly platform. 
                Choose your preferred date, time, and specialist, and receive instant confirmation. 
                No long waiting times—just seamless healthcare access at your convenience.
              </p>
              <Link to="/patient/book-appointment">
                <button className="button">Learn More</button>
              </Link>
            </div>
          </div>

          <div className="box">
            <div className="images">
              <img 
                src="https://chandanpharmacy.com/Content/img/medicine-online.jpg"
                alt="Online Medicine Ordering"
              />
            </div>
            <div className="content">
              <h3>Order Medicine Online</h3>
              <p>
                Get your prescribed medicines delivered to your doorstep with just a few clicks. 
                Browse through a wide range of medicines, place an order online, and enjoy fast 
                and secure delivery from licensed pharmacies.
              </p>
              <Link to="/patient/order-medicines">
                <button className="button">Order Medicine</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="box">
          <h2 className="logo"><span>M</span>edi<span>Q</span>uick</h2>
          <p>
            Your trusted healthcare partner, providing seamless access to online consultations, 
            appointment bookings, and medicine deliveries, ensuring a hassle-free medical experience.
          </p>
        </div>
        
        <div className="box">
          <h2 className="logo"><span>S</span>hare</h2>
          <a href="mailto:mediquick2025@gmail.com">Email</a>
          <a href="https://www.facebook.com/share/1568c6qDuW/">Facebook</a>
          <a href="https://www.instagram.com/mediquick2025?igsh=MXVqaDRkY2xvNGJsZg==">Instagram</a>
          <a href="https://www.linkedin.com/in/medi-quick-437318355?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app">
            LinkedIn
          </a>
        </div>
        
        <div className="box">
          <h2 className="logo"><span>L</span>inks</h2>
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/faqs">FAQ's</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/blogs">Blog</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
        </div>
        
        <h1 className="credit">
          Created by <span>Team MediQuick</span> all rights reserved.
        </h1>
      </footer>
    </div>
  );
};

export default PatientDashboard;