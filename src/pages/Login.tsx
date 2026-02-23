import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    const result = login(email, password);
    if (result.success) {
      navigate("/dashboard-redirect");
    } else {
      setError(result.error || "Login failed.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">CT</span>
            </div>
            <span className="text-xl font-semibold text-foreground">CivicTrack</span>
          </Link>
          <p className="mt-3 text-body text-muted-foreground">
            Sign in to report issues and track progress
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="mb-6 text-h3 text-foreground">Welcome back</h1>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-caption text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="h-11 w-full">
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-caption text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register as a citizen
            </Link>
          </p>

          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="mb-2 text-label font-semibold text-foreground">Demo Accounts</p>
            <div className="space-y-1 text-label text-muted-foreground">
              <p><span className="font-medium">Citizen:</span> citizen@civictrack.in</p>
              <p><span className="font-medium">Department:</span> sanitation@pune.gov.in</p>
              <p><span className="font-medium">Municipal:</span> admin@pmc.gov.in</p>
              <p className="mt-1 text-muted-foreground/70">Any password works for demo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
