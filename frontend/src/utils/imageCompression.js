const loadImage = (src) =>
        new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
        });

const readFileAsDataURL = (file) =>
        new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
                reader.onerror = reject;
                reader.readAsDataURL(file);
        });

const blobToDataURL = (blob) =>
        new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "");
                reader.onerror = reject;
                reader.readAsDataURL(blob);
        });

export const compressImageFile = async (
        file,
        {
                maxWidth = 1600,
                maxHeight = 1600,
                quality = 0.8,
                outputFormat = "image/jpeg",
                maxSizeBytes = 2 * 1024 * 1024,
        } = {}
) => {
        const dataUrl = await readFileAsDataURL(file);
        const image = await loadImage(dataUrl);

        const canvas = document.createElement("canvas");
        let { width, height } = image;

        if (width > maxWidth || height > maxHeight) {
                        const widthRatio = maxWidth / width;
                        const heightRatio = maxHeight / height;
                        const scale = Math.min(widthRatio, heightRatio);
                        width = Math.floor(width * scale);
                        height = Math.floor(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);

        const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(
                        (result) => {
                                if (result) resolve(result);
                                else reject(new Error("فشل ضغط الصورة"));
                        },
                        outputFormat,
                        quality
                );
        });

        if (blob.size > maxSizeBytes) {
                return { base64: "", size: blob.size, error: "حجم الصورة بعد الضغط ما زال كبيرًا" };
        }

        const compressedDataUrl = await blobToDataURL(blob);
        return { base64: compressedDataUrl, size: blob.size, error: "" };
};

export const estimateBase64Size = (base64String = "") => {
        const payload = base64String.split(",")[1] || "";
        return Math.ceil((payload.length * 3) / 4);
};
