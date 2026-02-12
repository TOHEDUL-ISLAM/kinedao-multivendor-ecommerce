import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Baby, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from "@/hooks/use-translation";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

interface VendorAuthPageProps {
	redirectTo: string;
	initialMode?: "signin" | "signup";
}

export function VendorAuthPage({
	redirectTo,
	initialMode = "signin",
}: VendorAuthPageProps) {
	const { t } = useTranslation();
	const { theme, setTheme } = useTheme();
	const [mode, setMode] = useState<"signin" | "signup">(initialMode);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<div className="grid min-h-screen w-full lg:grid-cols-[58%_42%]">
				<section className="relative overflow-hidden">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_55%,rgba(244,114,182,0.08),transparent_42%),radial-gradient(circle_at_40%_90%,rgba(59,130,246,0.08),transparent_40%)]" />
					<div className="absolute right-4 top-6 z-20 flex items-center gap-2 sm:right-8 lg:right-10 xl:right-12">
						<LanguageToggle />
						<Button
							variant="outline"
							size="icon"
							className="rounded-full"
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
						>
							{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
						</Button>
					</div>
					<div className="relative z-10 flex min-h-screen w-full items-start justify-center px-4 py-6 sm:px-8 lg:items-center lg:justify-start lg:pl-24 lg:pr-12 xl:pl-32 xl:pr-16">
						<div className="w-full max-w-[470px]">
							<Link to="/" className="mb-8 inline-flex items-center gap-2">
								<Baby className="h-8 w-8 text-pink-500" />
								<span className="pb-1 text-2xl font-bold text-transparent bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text dark:from-pink-400 dark:to-blue-400">
									কিনেদাও
								</span>
							</Link>

							<div className="mb-6">
								<h1 className="text-3xl font-semibold tracking-tight">
									{t("vendorLogin.title")}
								</h1>
								<p className="mt-2 text-sm text-muted-foreground">
									{t("vendorLogin.subtitle")}
								</p>
							</div>

							<div className="mb-6 inline-flex rounded-full border border-border bg-muted/40 p-1">
								<Button
									variant={mode === "signin" ? "default" : "ghost"}
									size="sm"
									className="rounded-full"
									onClick={() => setMode("signin")}
								>
									{t("auth.login")}
								</Button>
								<Button
									variant={mode === "signup" ? "default" : "ghost"}
									size="sm"
									className="rounded-full"
									onClick={() => setMode("signup")}
								>
									{t("auth.register")}
								</Button>
							</div>

							{mode === "signin" ? (
								<SignInForm
									onSwitchToSignUp={() => setMode("signup")}
									redirectTo={redirectTo}
									hideTitle
									className="mt-0 max-w-none p-0"
								/>
							) : (
								<SignUpForm
									onSwitchToSignIn={() => setMode("signin")}
									redirectTo={redirectTo}
									hideTitle
									className="mt-0 max-w-none p-0"
								/>
							)}

								<div className="mt-6 flex justify-center">
									<p className="w-full max-w-md text-center text-xs leading-5 text-muted-foreground">
										{t("vendorLogin.terms")}
									</p>
								</div>
						</div>
					</div>
				</section>

				<aside className="relative hidden min-h-screen overflow-hidden lg:block">
					<div
						className="absolute inset-0 bg-cover bg-center"
						style={{
							backgroundImage:
								"url('https://images.unsplash.com/photo-1484820540004-14229fe36ca4?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
						}}
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/65" />
					<div className="relative z-10 flex h-full items-end p-8 xl:p-10">
						<div className="max-w-md rounded-2xl border border-white/20 bg-black/35 p-6 text-white backdrop-blur-md dark:border-white/15 dark:bg-black/45">
							<p className="text-2xl font-semibold">
								{t("vendorLogin.platformTitle")}
							</p>
							<p className="mt-2 text-sm text-white/90">
								{t("vendorLogin.platformDescription")}
							</p>
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
}
