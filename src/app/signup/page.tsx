'use client'
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import api from "../services/api";
import Link from "next/link";

type FormData = {
    email: string;
    password: string;
    role: 'admin' | 'user'
};

export default function Signup() {
    const { register, handleSubmit, formState: { errors }
    } = useForm<FormData>();
    const router = useRouter();

    const onSubmit = async (data: FormData) => {
        try {
            await api.post("/auth/signup", data);
            alert("Signup successful. Please log in.");
            router.push("/login");
        } catch (error: any) {
            alert(error.response?.data?.message || "Signup failed.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6  text-gray-800">Sign Up</h2>
                <input
                    {...register("email", {
                        required: "Email is required",
                        pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email address",
                        },
                    })}
                    placeholder="Email"
                    className="w-full p-2 border mb-1 rounded text-gray-700"
                />
                {errors.email && <p className="text-red-500 text-sm mb-3">{errors.email.message}</p>}
                <input {...register("password")} type="password" placeholder="Password" className="w-full p-2 border mb-4 rounded text-gray-700" required />
                <select
                    // name="role"
                    {...register('role')}
                    // value={form.role}
                    // onChange={handleChange}
                    className="border p-2 w-full rounded mb-6 text-gray-700"
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">Sign Up</button>
                <p className="text-center text-sm mt-2">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:underline">
                        Login here
                    </Link>
                </p>
            </form>
        </div>
    );
}
