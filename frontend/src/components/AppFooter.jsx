import { Link } from "react-router-dom";

/* AppFooter — site-wide footer, always pinned to the bottom of the page */
function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-inner">

        {/* Brand column */}
        <div className="footer-brand-col">
          <p className="footer-brand">Pro.me</p>
          <p className="footer-tagline">
            Find and compare approved driving instructors across Ireland,
            with verified ADI status, reviews and real availability.
          </p>

          {/* Social icon links */}
          <div className="footer-social">
            <a href="#" className="footer-social-link" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
              </svg>
            </a>
            <a href="#" className="footer-social-link" aria-label="Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="footer-social-link" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 10v7M7 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Company links */}
        <div>
          <p className="footer-col-title">Company</p>
          <ul className="footer-col-links">
            <li><Link to="/">Home</Link></li>
            <li><a href="#">About us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Blog</a></li>
          </ul>
        </div>

        {/* Services links */}
        <div>
          <p className="footer-col-title">Services</p>
          <ul className="footer-col-links">
            <li><Link to="/services">Browse Services</Link></li>
            <li><Link to="/register">Join as Provider</Link></li>
            <li><Link to="/login">Sign In</Link></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </div>

        {/* Support links */}
        <div>
          <p className="footer-col-title">Support</p>
          <ul className="footer-col-links">
            <li><a href="#">Help Centre</a></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar — copyright + legal links */}
      <div className="footer-bottom">
        <p className="footer-meta">© {year} Pro.me. All rights reserved.</p>
        <nav className="footer-bottom-links" aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}

export default AppFooter;
