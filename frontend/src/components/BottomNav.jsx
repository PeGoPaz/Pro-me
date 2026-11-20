import { NavLink } from "react-router-dom";
import { useAuth } from "../context/auth";
import ProfileIcon from "./profile/ProfileIcon";
import { bottomTabs } from "../utils/bottomTabs";

/*
 * The tab bar along the bottom of a phone's screen, where a thumb reaches -
 * home, explore, saved and you - as on the apps people use every day. On a
 * wider screen the top bar does this job and the tab bar is hidden.
 * Which tabs each kind of account gets is in utils/bottomTabs.js.
 */
export default function BottomNav() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <nav className="bottom-nav" aria-label="Main">
      {bottomTabs(user).map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `bottom-nav-tab${isActive ? " is-active" : ""}`}
        >
          <ProfileIcon name={tab.icon} size={24} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
