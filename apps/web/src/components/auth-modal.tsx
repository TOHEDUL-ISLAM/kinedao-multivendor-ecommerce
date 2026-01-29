import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, Baby } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import Loader from "@/components/loader";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const { isPending } = authClient.useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Login Form
  const loginForm = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            toast.success("Welcome back!");
            onClose();
            window.location.reload(); // Ensure session state updates across app
          },
          onError: () => {
            setServerError("Invalid email or password");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
      }),
    },
  });

  // Sign Up Form
  const signUpForm = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            onClose();
            navigate({ to: "/verify-email" });
            toast.success("Account created! Please check your email to verify.");
          },
          onError: (error) => {
            setServerError(error.error.message || "Registration failed. Please try again.");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Minimum 8 characters"),
      }),
    },
  });

  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch (error) {
      toast.error("Failed to sign in with Google");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Baby className="h-10 w-10 text-pink-500" />
          </div>
          <DialogTitle className="text-2xl font-heading bg-gradient-to-r from-pink-600 to-blue-600 dark:from-pink-400 dark:to-blue-400 bg-clip-text text-transparent inline-block pb-1">
            Welcome to কিনেদাও
          </DialogTitle>
          <DialogDescription>
            Your trusted marketplace for baby products
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="py-8 flex justify-center">
            <Loader />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="login" className="rounded-full">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">Sign Up</TabsTrigger>
            </TabsList>

            {serverError && (
              <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded text-center">
                {serverError}
              </div>
            )}

            <TabsContent value="login" className="space-y-4 mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  loginForm.handleSubmit();
                }}
                className="space-y-4"
              >
                <loginForm.Field name="email">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10 rounded-full"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p key={error?.message} className="text-sm text-red-500">{error?.message}</p>
                      ))}
                    </div>
                  )}
                </loginForm.Field>

                <loginForm.Field name="password">
                  {(field) => (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs text-primary"
                          type="button"
                          onClick={() => {
                             onClose();
                             navigate({ to: "/forgot-password" });
                          }}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 rounded-full"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p key={error?.message} className="text-sm text-red-500">{error?.message}</p>
                      ))}
                    </div>
                  )}
                </loginForm.Field>

                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Remember me
                  </Label>
                </div>

                <loginForm.Subscribe>
                  {(state) => (
                    <Button 
                      className="w-full rounded-full font-semibold gap-2" 
                      type="submit"
                      disabled={!state.canSubmit || state.isSubmitting}
                    >
                      {state.isSubmitting ? "Logging in..." : "Login"}
                      {!state.isSubmitting && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  )}
                </loginForm.Subscribe>
              </form>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="rounded-full w-full" onClick={handleGoogleSignIn}>
                  <GoogleIcon className="w-4 h-4 mr-2" />
                  Google
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  signUpForm.handleSubmit();
                }}
                className="space-y-4"
              >
                <signUpForm.Field name="name">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your name"
                          className="pl-10 rounded-full"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p key={error?.message} className="text-sm text-red-500">{error?.message}</p>
                      ))}
                    </div>
                  )}
                </signUpForm.Field>

                <signUpForm.Field name="email">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10 rounded-full"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p key={error?.message} className="text-sm text-red-500">{error?.message}</p>
                      ))}
                    </div>
                  )}
                </signUpForm.Field>

                <signUpForm.Field name="password">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="pl-10 pr-10 rounded-full"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p key={error?.message} className="text-sm text-red-500">{error?.message}</p>
                      ))}
                    </div>
                  )}
                </signUpForm.Field>

                <div className="flex items-start gap-2">
                  <Checkbox id="terms" className="mt-1" />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    I agree to the{" "}
                    <span className="text-primary hover:underline">Terms of Service</span>
                    {" "}and{" "}
                    <span className="text-primary hover:underline">Privacy Policy</span>
                  </Label>
                </div>

                <signUpForm.Subscribe>
                  {(state) => (
                    <Button 
                      className="w-full rounded-full font-semibold gap-2" 
                      type="submit"
                      disabled={!state.canSubmit || state.isSubmitting}
                    >
                      {state.isSubmitting ? "Creating Account..." : "Create Account"}
                      {!state.isSubmitting && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  )}
                </signUpForm.Subscribe>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};