const EASTERN_ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export const toEnglishDigits = (value) => {
        if (value === null || value === undefined) return "";
        const valueStr = String(value);
        let result = "";

        for (const char of valueStr) {
                const index = EASTERN_ARABIC_DIGITS.indexOf(char);
                result += index > -1 ? String(index) : char;
        }

        return result;
};

export const formatNumber = (value) => {
        if (value === null || value === undefined) return "0";

        const englishValue = Number(toEnglishDigits(value));
        if (!Number.isNaN(englishValue)) {
                return englishValue.toLocaleString("en-US");
        }

        return toEnglishDigits(value);
};
