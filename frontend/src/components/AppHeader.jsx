import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeaderAvatar({ name, avatarUrl, className }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name || "Profile"} className={`${className} profile-avatar-img`} />;
  }

  return (
    <span className={`${className} profile-avatar-fallback`}>
      <PersonIcon />
    </span>
  );
}

function AppHeader() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const close = () => setMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    close();
    navigate("/");
  };

  /* Backend roles: "user" = customer, "enterprise" = provider */
  const isCustomer = user?.role === "user";
  const isProvider = user?.role === "enterprise";
  const profilePath = isProvider ? "/dashboard/provider" : "/dashboard/customer";
  const roleLabel = isProvider ? "Provider" : "Customer";

  /* First name only for display */
  const displayName = user?.name?.split(" ")[0] ?? roleLabel;

  return (
    <header className={`topbar${scrolled ? " topbar-scrolled" : ""}`}>
      <NavLink to="/" className="brand" aria-label="Pro.me home" onClick={close}>
        Pro.me
      </NavLink>

      <nav className="topnav" aria-label="Primary">
        <NavLink to="/instructors" className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}>
          Find Instructors
        </NavLink>

        <NavLink to="/services" className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}>
          Find Services
        </NavLink>

        <NavLink to="/providers" className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}>
          Providers
        </NavLink>

        {isCustomer && (
          <NavLink to="/dashboard/customer" className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}>
            My Bookings
          </NavLink>
        )}

        {isProvider && (
          <NavLink to="/dashboard/provider" className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}>
            Dashboard
          </NavLink>
        )}

        {!user && !loading && (
          <NavLink to="/register" className={({ isActive }) => "nav-link" + (isActive ? " nav-link-active" : "")}>
            For Providers
          </NavLink>
        )}
      </nav>

      <div className="topbar-actions">
        {/* Don't render anything while the /me check is in flight */}
        {loading ? null : user ? (
          <div className="profile-menu" ref={profileRef}>
            <button
              className={`profile-trigger${profileOpen ? " profile-trigger-open" : ""}`}
              onClick={() => setProfileOpen((o) => !o)}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              <HeaderAvatar name={user.name} avatarUrl={user.avatarUrl} className="profile-avatar" />
              <span className="profile-role">{displayName}</span>
              <ChevronIcon open={profileOpen} />
            </button>

            {profileOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-header">
                  <HeaderAvatar
                    name={user.name}
                    avatarUrl={user.avatarUrl}
                    className="profile-dropdown-avatar"
                  />
                  <div>
                    <p className="profile-dropdown-name">{user.name}</p>
                    <p className="profile-dropdown-role">{user.email}</p>
                  </div>
                </div>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-dropdown-item"
                  role="menuitem"
                  onClick={() => { setProfileOpen(false); navigate(profilePath); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Profile
                </button>

                <div className="profile-dropdown-divider" />

                <button
                  className="profile-dropdown-item profile-dropdown-signout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <NavLink to="/login" className="button button-ghost">Sign In</NavLink>
            <NavLink to="/register" className="button button-primary topbar-cta">Get Started</NavLink>
          </>
        )}
      </div>

      <button
        className={`topbar-hamburger${menuOpen ? " is-open" : ""}`}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span /><span /><span />
      </button>

      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-label="Mobile navigation">
          <NavLink to="/instructors" className="mobile-nav-link" onClick={close}>Find Instructors</NavLink>
          <NavLink to="/services" className="mobile-nav-link" onClick={close}>Find Services</NavLink>
          <NavLink to="/providers" className="mobile-nav-link" onClick={close}>Providers</NavLink>

          {isCustomer && (
            <NavLink to="/dashboard/customer" className="mobile-nav-link" onClick={close}>My Bookings</NavLink>
          )}
          {isProvider && (
            <NavLink to="/dashboard/provider" className="mobile-nav-link" onClick={close}>Dashboard</NavLink>
          )}
          {!user && !loading && (
            <NavLink to="/register" className="mobile-nav-link" onClick={close}>For Providers</NavLink>
          )}

          <div className="mobile-menu-footer">
            {user ? (
              <>
                <button className="button button-ghost mobile-cta" onClick={() => { close(); navigate(profilePath); }}>
                  Profile
                </button>
                <button className="button button-primary mobile-cta" onClick={handleLogout}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="button button-ghost mobile-cta" onClick={close}>Sign In</NavLink>
                <NavLink to="/register" className="button button-primary mobile-cta" onClick={close}>Get Started</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default AppHeader;
