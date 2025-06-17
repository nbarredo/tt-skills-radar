import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, Building2, Calendar } from "lucide-react";

const Nav = () => {
  const location = useLocation();

  return (
    <div className="flex items-center space-x-4">
      <Link
        to="/members"
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
          location.pathname === "/members" && "bg-gray-100 dark:bg-gray-800"
        )}
      >
        <Users className="h-4 w-4" />
        Members
      </Link>
      <Link
        to="/clients"
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
          location.pathname === "/clients" && "bg-gray-100 dark:bg-gray-800"
        )}
      >
        <Building2 className="h-4 w-4" />
        Clients
      </Link>
      <Link
        to="/member-assignments"
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
          location.pathname === "/member-assignments" &&
            "bg-gray-100 dark:bg-gray-800"
        )}
      >
        <Calendar className="h-4 w-4" />
        Assignments
      </Link>
    </div>
  );
};

export default Nav;
