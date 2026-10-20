import { useLocation, Navigate } from "react-router-dom";

export default function LegacyRedirect({ to }: { to: string }) {
  const location = useLocation();
  return (
    <Navigate
      to={to + location.search}
      state={location.state}
      replace
    />
  );
}
