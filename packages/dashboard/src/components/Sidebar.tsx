import logo from "../assets/logo.svg";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import Rows3 from "lucide-react/icons/rows-3";
import Sailboat from "lucide-react/icons/sailboat";
import Play from "lucide-react/icons/play";
import Box from "lucide-react/icons/box";
import type { ReactNode } from "react";

export function Sidebar() {
  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} className="w-6" />
          <span className="font-medium">Mixwave</span>
        </Link>
      </div>
      <div className="flex-1">
        <Title className="mb-4 mt-2">Manage</Title>
        <nav className="grid items-start px-4 text-sm font-medium mb-4">
          <NavLink to="/jobs">
            <Rows3 className="h-4 w-4" />
            Jobs
          </NavLink>
          <NavLink to="/storage">
            <Box className="h-4 w-4" />
            Storage
          </NavLink>
        </nav>
        <Title className="my-4">Tools</Title>
        <nav className="grid items-start px-4 text-sm font-medium">
          <NavLink to="/player">
            <Play className="h-4 w-4" />
            Player
          </NavLink>
          <NavLink to="/api">
            <Sailboat className="h-4 w-4" />
            API
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

function NavLink({ children, to }: { children: ReactNode; to: string }) {
  const { pathname } = useLocation();

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",

        pathname.startsWith(to) && "bg-muted text-primary",
      )}
    >
      {children}
    </Link>
  );
}

function Title({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-xs px-3 ml-4 font-medium", className)}>
      {children}
    </div>
  );
}