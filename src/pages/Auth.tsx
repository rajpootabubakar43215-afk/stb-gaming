import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Check if this is a password reset flow
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsResetPassword(true);
      setIsForgotPassword(false);
      setIsLogin(false);
    }
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) throw error;

        toast.success("Password updated successfully! You can now login.");
        setIsResetPassword(false);
        setIsLogin(true);
        setPassword("");
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        toast.success("Password reset email sent! Check your inbox.");
        setIsForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Welcome back!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast.success("Account created! You can now login.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Card className="max-w-md mx-auto border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-glow">
              {isResetPassword 
                ? "Set New Password" 
                : isForgotPassword 
                ? "Reset Password" 
                : isLogin 
                ? "Welcome Back" 
                : "Join STB"}
            </CardTitle>
            <CardDescription className="text-center">
              {isResetPassword
                ? "Enter your new password"
                : isForgotPassword
                ? "Enter your email to receive a password reset link"
                : isLogin
                ? "Login to access all features"
                : "Create an account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && !isForgotPassword && !isResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    className="bg-input border-border"
                  />
                </div>
              )}

              {!isResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input border-border"
                  />
                </div>
              )}

              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">{isResetPassword ? "New Password" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border"
                />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading}
              >
                {loading 
                  ? "Loading..." 
                  : isResetPassword 
                  ? "Update Password" 
                  : isForgotPassword 
                  ? "Send Reset Email" 
                  : isLogin 
                  ? "Login" 
                  : "Sign Up"}
              </Button>

              {!isResetPassword && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(!isForgotPassword);
                      setIsLogin(false);
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isForgotPassword ? "Back to login" : "Forgot password?"}
                  </button>

                  {!isForgotPassword && (
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {isLogin
                        ? "Don't have an account? Sign up"
                        : "Already have an account? Login"}
                    </button>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}