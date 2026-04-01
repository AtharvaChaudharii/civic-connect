import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react";

const availableCities = ["Pune", "Mumbai", "Bangalore", "Delhi", "Chennai"];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirmPassword || !city) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const result = await register(name, email, password, city);
    setSubmitting(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Registration failed.");
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
            <Link to="/login" className="text-caption font-medium text-muted-foreground hover:text-foreground">Log In</Link>
          </div>
        </div>
      </header>

      {/* Register form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-h2 text-foreground">Create Account</h1>
            <p className="mt-2 text-body text-muted-foreground">
              Create your citizen account to start reporting
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-caption text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-11 pr-10 ${confirmPassword && password !== confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-label text-destructive">Passwords do not match</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select your city</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="h-11 w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-caption text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>

          <p className="mt-4 text-center text-label text-muted-foreground/70">
            Department and Municipal accounts are managed by city administrators.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-6 text-center">
        <div className="flex items-center justify-center gap-6 text-caption text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-foreground">Terms of Service</a>
        </div>
        <p className="mt-4 text-label text-muted-foreground">© 2026 CivicTrack. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Register;
