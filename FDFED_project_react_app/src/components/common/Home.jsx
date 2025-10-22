import { Link } from 'react-router-dom';
import FAQ from '../FAQ';
import '../../assets/css/home_page.css';

function Home() {
  const reviews = [
    { name: 'Vineeth', date: '26-02-2025' },
    { name: 'Pavan', date: '26-02-2025' },
    { name: 'Narendar', date: '26-02-2025' },
    { name: 'Srimanth', date: '26-02-2025' },
  ];

  return (
    <>
      <section id="home" className="home">
        <div className="row">
          <div className="images">
            <img
              src="https://static.vecteezy.com/system/resources/previews/013/758/401/non_2x/online-medicine-patient-call-doctor-via-internet-free-vector.jpg"
              alt="Telemedicine Consultation"
            />
          </div>
          <div className="content">
            <h1>
              <span>Instant</span> Care, <span>Anywhere</span>, Anytime.
            </h1>
            <p>
              Welcome to MediQuick, your trusted telemedicine platform for quick and reliable medical
              consultations. Connect with doctors, get prescriptions, and manage your health—all from the
              comfort of your home.
            </p>
            <Link to="/about">
              <button className="button">Learn More</button>
            </Link>
          </div>
        </div>
      </section>

      <section id="role" className="card">
        <div className="container">
          <h1 className="heading">Select your role</h1>
          <div className="box-container">
            {[
              { role: 'Doctor', link: '/doctor/form', icon: 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png' },
              { role: 'Patient', link: '/patient/form', icon: 'https://icons.veryicon.com/png/o/healthcate-medical/two-color-icon-of-simple-medical-project/patient-4.png' },
              { role: 'Admin', link: '/admin/form', icon: 'https://icons.veryicon.com/png/o/miscellaneous/small-icons-1/supplier-15.png' },
              { role: 'Employee', link: '/employee/form', icon: 'https://icons.veryicon.com/png/o/business/erp-system-background-icon/employee-turnover.png' },
              { role: 'Supplier', link: '/supplier/form', icon: 'https://icons.veryicon.com/png/o/miscellaneous/small-icons-1/supplier-15.png' },
            ].map(({ role, link, icon }) => (
              <div key={role} className="box">
                <img src={icon} alt={`${role} Icon`} />
                <div className="content">
                  <h2 style={{ color: 'var(--blue)' }}>{role}</h2>
                  <Link to={link}>
                    <button className="button" style={{ marginLeft: '15.75%' }}>Select</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="review" className="review">
        <h1 className="heading">Our Patient Review</h1>
        <h3 className="title">What Patient says about us</h3>
        <div className="box-container">
          {reviews.map((review, index) => (
            <div key={index} className="box">
              <i className="fas fa-quote-left"></i>
              <p>
                The convenience and efficiency of this service are outstanding! Scheduling an appointment
                was quick, and the consultation was seamless. The doctors were professional, attentive,
                and provided clear guidance. It's reassuring to have access to quality healthcare from
                the comfort of home. Highly recommended!
              </p>
              <div className="images">
                <img
                  src="https://www.oneeducation.org.uk/wp-content/uploads/2020/06/cool-profile-icons-69.png"
                  alt="Reviewer Profile Icon"
                />
                <div className="info">
                  <h3>{review.name}</h3>
                  <span>Date: {review.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="faq-header">
        <h1 className="heading">How can we help you?</h1>
        <p>
          We are here to answer all your <span className="faq-link">Frequently Asked Questions</span>
        </p>
      </div>

      <FAQ />
    </>
  );
}

export default Home;