
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (file, resourceType = 'auto') => {
    if (!file) return null;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        console.error("Cloudinary env vars missing");
        throw new Error("Cloudinary configuration missing");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Upload failed");
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
};
