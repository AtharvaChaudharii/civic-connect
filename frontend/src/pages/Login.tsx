import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Mail, Lock, Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate("/dashboard-redirect");
    } else {
      setError(result.error || "Login failed.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="border-b bg-card">
        <div className="civic-container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-sm font-bold text-primary-foreground">CT</span>
            </div>
            <span className="text-lg font-semibold text-foreground">CivicTrack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-caption font-medium text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="#" className="text-caption font-medium text-muted-foreground hover:text-foreground">Help Center</Link>
          </div>
        </div>
      </header>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-h2 text-foreground">Welcome Back</h1>
            <p className="mt-2 text-body text-muted-foreground">Accessing your city dashboard</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-caption text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="citizen@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-caption font-medium text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="h-12 w-full text-body font-semibold" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in…</> : "Log In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-caption text-muted-foreground">
            Don't have an account yet?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="mb-2 text-label font-semibold text-foreground">Demo Accounts</p>
            <div className="space-y-1 text-label text-muted-foreground">
              <p><span className="font-medium">Citizen:</span> citizen@civictrack.in / password123</p>
              <p><span className="font-medium">Department:</span> sanitation@pune.gov.in / password123</p>
              <p><span className="font-medium">Municipal:</span> admin@pmc.gov.in / password123</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div className="border-t py-6 text-center">
        <div className="flex items-center justify-center gap-6 text-caption text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Contact Support</a>
        </div>
        <p className="mt-4 text-label text-muted-foreground">© 2026 CivicTrack. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
