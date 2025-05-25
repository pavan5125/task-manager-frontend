'use client';

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../services/api";
import { jwtDecode } from "jwt-decode";
import { getToken, removeToken } from "../utils/auth";
import { useForm } from "react-hook-form";
import uploadToCloudinary from "../utils/cloudinaryUpload";

type Task = {
    id: number;
    title: string;
    description: string;

    status: "Pending" | "In Progress" | "Completed";
    UserId: number;
    attachment?: string;
};

type DecodedToken = {
    id: number;
    role: "admin" | "user";
};

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [role, setRole] = useState<"admin" | "user" | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [editTaskId, setEditTaskId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [attachModalOpen, setAttachModalOpen] = useState(false);

    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const router = useRouter();
    const { register, handleSubmit, reset, setValue } = useForm<{ title: string; description: string; status: Task["status"]; attachment?: string }>();


    const fetchTasks = useCallback(async (userRole: string) => {
        try {
            const endPoint = userRole === 'admin' ? '/tasks/admin' : '/tasks';
            const res = await api.get(endPoint);
            setTasks(res.data);
        } catch {
            removeToken();
            router.push("/login");
        }
    }, [router]);

    useEffect(() => {
        const token = getToken();
        if (!token) return router.push("/login");

        const decoded = jwtDecode<DecodedToken>(token);
        setRole(decoded.role);
        setUserId(decoded.id);

        fetchTasks(decoded.role);
    }, [router, fetchTasks]);

    const onSubmit = async (data: { title: string; description: string, status: Task["status"]; attachment?: string }) => {
        try {

            let fileUrl = '';
            if (file) {
                fileUrl = await uploadToCloudinary(file);
            }

            if (editTaskId) {
                await api.put(`/tasks/${editTaskId}`, fileUrl ? { ...data, attachment: fileUrl } : data);
                setEditTaskId(null);
            } else {
                let fileUrl = '';
                if (file) {
                    fileUrl = await uploadToCloudinary(file);
                }

                await api.post('/tasks', { ...data, attachment: fileUrl });
                // await api.post("/tasks", data);
            }
            reset();
            setModalOpen(false);
            fetchTasks(role || '');
        } catch {
            alert("Error submitting task.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/tasks/${id}`);
            fetchTasks(role || '');
        } catch {
            alert("Error deleting task.");
        }
    };

    const startEdit = (task: Task) => {
        setEditTaskId(task.id);
        setValue("title", task.title);
        setValue("description", task.description);

        setValue("status", task.status);
        setValue("attachment", task.attachment || "");
        setModalOpen(true);
    };

    const openCreateModal = () => {
        setEditTaskId(null);
        reset({ title: "", status: "Pending", attachment: "" });
        setModalOpen(true);
    };

    const filteredTasks = tasks.filter((task) =>
        statusFilter === "All" ? true : task.status === statusFilter
    );

    const canEditOrDelete = (task: Task) => role === "admin" || task.UserId === userId;

    const handleLogout = () => {
        removeToken();
        router.push("/login");
    };

    const openAttachmentModal = (url: string) => {
        setAttachmentUrl(url);
        setAttachModalOpen(true);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
    };

    return (
        <div className="min-h-screen bg-white p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Task Dashboard</h1>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                    Logout
                </button>
            </div>

            <div className="mb-4 text-sm text-gray-700">
                Logged in as <strong>{role}</strong>
            </div>

            <div className="mb-4 flex flex-wrap gap-2 items-center">
                {["All", "Pending", "In Progress", "Completed"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded border font-medium ${statusFilter === status
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {status}
                    </button>
                ))}
                {role !== 'admin' && <button
                    onClick={openCreateModal}
                    className="ml-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                    + Create Task
                </button>}
            </div>

            {/* Task Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left p-3 border-b text-gray-700 ">Title</th>
                            <th className="text-left p-3 border-b text-gray-700">Description</th>
                            <th className="text-left p-3 border-b text-gray-700 ">Status</th>
                            <th className="text-left p-3 border-b text-gray-700 ">User ID</th>
                            <th className="text-left p-3 border-b text-gray-700 ">Attachment</th>
                            {role !== 'admin' && <th className="text-left p-3 border-b text-gray-700 ">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks?.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50 transition">
                                <td className="p-3 border-b text-gray-800 whitespace-pre-wrap break-words max-w-xs">
                                    {task.title}
                                </td>
                                <td className="p-3 border-b text-gray-800 whitespace-pre-wrap break-words max-w-md">
                                    {task.description || 'No Description'}
                                </td>
                                <td className="p-3 border-b text-gray-800">{task?.status}</td>
                                <td className="p-3 border-b text-gray-800">{task?.UserId}</td>
                                <td className="p-3 border-b">
                                    {task.attachment && (
                                        <button
                                            onClick={() => openAttachmentModal(task?.attachment || 'No attachment')}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            View
                                        </button>
                                    )}
                                </td>
                                {
                                    role !== 'admin' && <td className="p-3 border-b">
                                        {canEditOrDelete(task) && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(task)}
                                                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                }

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {attachModalOpen && attachmentUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">View Attachment</h2>
                        <div className="flex justify-center">
                            <img src={attachmentUrl} alt="Attachment" className="max-w-full max-h-96" />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setAttachModalOpen(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded w-full"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            {editTaskId ? "Edit Task" : "Create Task"}
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <input
                                {...register("title", { required: true, maxLength: 100 })}
                                placeholder="Task Title (max 100 chars)"
                                className="w-full p-2 border rounded text-gray-700"
                                maxLength={100}
                            />

                            <textarea
                                {...register("description", { required: true, maxLength: 300 })}
                                placeholder="Task Description (max 300 chars)"
                                className="w-full p-2 border rounded resize-none text-gray-700"
                                rows={4}
                                maxLength={300}
                            />


                            <select {...register("status")} className="w-full p-2 border rounded text-gray-700">
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full p-2 border rounded text-gray-700"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                                    {editTaskId ? "Update" : "Create"} Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalOpen(false);
                                        setEditTaskId(null);
                                        reset();
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded w-full"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
