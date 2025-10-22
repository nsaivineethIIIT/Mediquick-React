import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/css/home_page.css';

function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
      setIsNavOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleNav = () => setIsNavOpen(!isNavOpen);

  return (
    <header className={isScrolled ? 'header-active' : ''}>
      <Link to="/" className="logo">
        <span>M</span>edi<span>Q</span>uick
      </Link>
      <nav className={`navbar ${isNavOpen ? 'nav-toggle' : ''}`}>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><a href="/about">About Us</a></li>
          <li><a href="/faqs">FAQs</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/contact">Contact Us</a></li>
        </ul>
      </nav>
      <i className={`fas ${isNavOpen ? 'fa-times' : 'fa-bars'}`} onClick={toggleNav}></i>
    </header>
  );
}

export default Header;