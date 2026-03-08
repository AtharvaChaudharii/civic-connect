import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex min-h-screen bg-background">
      {/* Left Panel — Form */}
      <div className="flex w-full flex-col justify-between px-6 py-8 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">CT</span>
          </div>
          <span className="text-lg font-semibold text-foreground">CivicTrack</span>
        </Link>

        {/* Form area */}
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-h2 text-foreground">Welcome Back!</h1>
          <p className="mt-2 text-body text-muted-foreground">
            Sign in to access your dashboard and track civic issues in your city.
          </p>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-caption text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <a href="#" className="text-caption font-medium text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>
            </div>

            <Button type="submit" className="h-12 w-full text-body font-semibold" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-label text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Demo accounts as quick-login buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => { setEmail("citizen@civictrack.in"); setPassword("password123"); }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">C</span>
              Continue as Citizen
            </button>
            <button
              type="button"
              onClick={() => { setEmail("sanitation@pune.gov.in"); setPassword("password123"); }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">D</span>
              Continue as Department
            </button>
            <button
              type="button"
              onClick={() => { setEmail("admin@pmc.gov.in"); setPassword("password123"); }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/10 text-[10px] font-bold text-warning">M</span>
              Continue as Municipal Admin
            </button>
          </div>

          <p className="mt-6 text-center text-caption text-muted-foreground">
            Don't have an Account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 text-label text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
        </div>
      </div>

      {/* Right Panel — Branded testimonial */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center bg-[hsl(var(--primary))]">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,72%,24%)] via-[hsl(var(--primary))] to-[hsl(160,40%,20%)]" />

        <div className="relative z-10 max-w-lg px-12 text-center">
          <h2 className="text-3xl font-bold leading-tight text-primary-foreground lg:text-4xl">
            Empowering Citizens,{" "}
            <br />
            Transforming Cities
          </h2>

          {/* Testimonial */}
          <div className="mt-10 text-left">
            <div className="mb-4 text-4xl font-serif text-primary-foreground/40">"</div>
            <p className="text-lg leading-relaxed text-primary-foreground/90">
              "CivicTrack has completely transformed how we handle civic complaints. Issues that took weeks to resolve are now tracked and addressed within days. The transparency it brings is remarkable."
            </p>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-bold text-primary-foreground">
                RS
              </div>
              <div>
                <p className="font-semibold text-primary-foreground">Rajesh Sharma</p>
                <p className="text-sm text-primary-foreground/70">Commissioner, Pune Municipal Corp.</p>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-12 flex items-center justify-center gap-8 border-t border-primary-foreground/20 pt-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-foreground">5K+</p>
              <p className="text-xs text-primary-foreground/60">Issues Resolved</p>
            </div>
            <div className="h-8 w-px bg-primary-foreground/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-foreground">12K+</p>
              <p className="text-xs text-primary-foreground/60">Active Citizens</p>
            </div>
            <div className="h-8 w-px bg-primary-foreground/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-foreground">15</p>
              <p className="text-xs text-primary-foreground/60">Cities Served</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
