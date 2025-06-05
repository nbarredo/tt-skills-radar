import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { Home, Brain, Tags, Lightbulb, Gauge, Users, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Knowledge Areas", href: "/knowledge-areas", icon: Brain },
  { name: "Skill Categories", href: "/skill-categories", icon: Tags },
  { name: "Skills", href: "/skills", icon: Lightbulb },
  { name: "Scales", href: "/scales", icon: Gauge },
  { name: "Members", href: "/members", icon: Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r bg-card pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold">TT Skills Radar</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-accent-foreground",
                        "mr-3 flex-shrink-0 h-5 w-5"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-border p-4">
            <ModeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile header */}
      <div className="md:hidden">
        <div className="flex items-center justify-between border-b bg-card px-4 py-2">
          <h1 className="text-lg font-bold">TT Skills Radar</h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <nav className="mt-5 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-accent-foreground",
                            "mr-3 flex-shrink-0 h-5 w-5"
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
