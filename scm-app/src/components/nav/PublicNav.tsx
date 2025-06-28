"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "next-auth/react";

interface PublicNavProps {
    visibleLogin?: boolean;
}

const PublicNav = ({ visibleLogin = true }: PublicNavProps) => {
    const { data: session } = useSession();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const isActive = (pathname: string) => {
        return router.pathname === pathname;
    };

    const mobileLinks = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Shop", href: "/shop" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-bold">
                        Lettuce Supply Chain
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex md:gap-8 md:items-center">
                    <Link
                        href="/"
                        className={
                            isActive("/") ? "underline" : "text-gray-600"
                        }
                    >
                        Home
                    </Link>
                    <Link
                        href="/about"
                        className={
                            isActive("/about") ? "underline" : "text-gray-600"
                        }
                    >
                        About
                    </Link>
                    <Link
                        href="/shop"
                        className={
                            isActive("/shop") ? "underline" : "text-gray-600"
                        }
                    >
                        Shop
                    </Link>
                    <Link
                        href="/contact"
                        className={
                            isActive("/contact") ? "underline" : "text-gray-600"
                        }
                    >
                        Contact
                    </Link>
                    {session ? (
                        <Link href={`/${session.user.role.toLowerCase()}/dashboard`}>
                            <Button variant="default">Dashboard</Button>
                        </Link>
                    ) : (
                        <Link href="/auth/login">
                            <Button variant="outline">Login</Button>
                        </Link>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-[300px] sm:w-[400px]"
                        >
                            <nav className="flex flex-col gap-4 mt-6 p-5">
                                {mobileLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className={`text-lg py-2 ${
                                            isActive(link.href)
                                                ? " font-medium"
                                                : "text-gray-600"
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                                {visibleLogin && (
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setOpen(false)}
                                    >
                                        <Button variant="outline" className="w-full">
                                            Login
                                        </Button>
                                    </Link>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};

export default PublicNav;
