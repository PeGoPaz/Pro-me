/*
 * Saved is a learner's list, so instructors and admins get no Saved tab; the
 * last tab is whatever "my page" means for each kind of account.
 */
export function bottomTabs(user) {
  const role = user?.role;
  const tabs = [
    { to: "/", label: "Home", icon: "home", end: true },
    { to: "/instructors", label: "Explore", icon: "search" },
  ];
  if (!user || role === "user") tabs.push({ to: "/saved", label: "Saved", icon: "heart" });
  if (!user) tabs.push({ to: "/login", label: "Sign in", icon: "person" });
  else if (role === "enterprise") tabs.push({ to: "/dashboard/provider", label: "Dashboard", icon: "person" });
  else if (role === "admin") tabs.push({ to: "/admin", label: "Admin", icon: "person" });
  else tabs.push({ to: "/dashboard/customer", label: "You", icon: "person" });
  return tabs;
}
