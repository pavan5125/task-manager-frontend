'use client'
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import api from "../services/api";
import { setToken } from "../utils/auth";
import Link from "next/link";

type FormData = {
    email: string;
    password: string;
};

export default function Login() {
    const { register, handleSubmit } = useForm<FormData>();
    const router = useRouter();

    const onSubmit = async (data: FormData) => {
        try {
            const res = await api.post("/auth/login", data);
            setToken(res.data.token);
            router.push("/dashboard");
        } catch (error: any) {
            alert(error.response?.data?.message || "Login failed.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Login</h2>
                <input {...register("email")} placeholder="Email" className="w-full p-2 border mb-4 rounded text-gray-700" required />
                <input {...register("password")} type="password" placeholder="Password" className="w-full p-2 border mb-4 rounded text-gray-700" required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">Login</button>
                <p className="text-center text-sm mt-2 text-gray-700">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-blue-600 hover:underline">
                        Register here
                    </Link>
                </p>
            </form>
        </div>
    );
}
