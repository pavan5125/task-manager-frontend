export default async function uploadToCloudinary(file: string | Blob) {
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!uploadPreset) {
        throw new Error('Missing NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET env variable');
    }
    if (!cloudName) {
        throw new Error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME env variable');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error('Cloudinary upload failed');
    return data.secure_url;
}
