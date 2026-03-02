/**
 * Helper function to parse normal range and determine if value is abnormal
 * @param {string} rangeStr - The range string to parse (e.g., "4.0-11.0", "<200", ">40")
 * @returns {object|null} - The parsed range object or null if invalid
 */
export const parseRange = (rangeStr) => {
    if (!rangeStr) return null;

    // Handle ranges like "4.0-11.0"
    const rangeMatch = rangeStr.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (rangeMatch) {
        return {
            type: 'range',
            min: parseFloat(rangeMatch[1]),
            max: parseFloat(rangeMatch[2])
        };
    }

    // Handle "<" ranges like "<200"
    const lessThanMatch = rangeStr.match(/<\s*([\d.]+)/);
    if (lessThanMatch) {
        return {
            type: 'lessThan',
            max: parseFloat(lessThanMatch[1])
        };
    }

    // Handle ">" ranges like ">40"
    const greaterThanMatch = rangeStr.match(/>\s*([\d.]+)/);
    if (greaterThanMatch) {
        return {
            type: 'greaterThan',
            min: parseFloat(greaterThanMatch[1])
        };
    }

    return null;
};

export const checkRange = (value, rangeStr) => {
    if (!value) return 'normal';

    const lowerValue = String(value).toLowerCase().trim();

    // Qualitative checks (Independent of rangeStr)
    if (lowerValue === 'positive' || lowerValue === 'reactive') return 'high';
    if (lowerValue === 'negative' || lowerValue === 'non-reactive' || lowerValue === 'nagative') return 'normal';

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'normal';

    if (!rangeStr) return 'normal';

    const range = parseRange(rangeStr);
    if (!range) return 'normal';

    if (range.type === 'range') {
        if (numValue < range.min) return 'low';
        if (numValue > range.max) return 'high';
        return 'normal';
    } else if (range.type === 'lessThan') {
        if (numValue >= range.max) return 'high';
        return 'normal';
    } else if (range.type === 'greaterThan') {
        if (numValue <= range.min) return 'low';
        return 'normal';
    }

    return 'normal';
};

/**
 * Helper function to get color class based on range status
 * @param {string} status - 'low', 'high', or 'normal'
 * @returns {string} - Tailwind CSS color classes
 */
export const getRangeColorClass = (status) => {
    switch (status) {
        case 'low':
            return 'bg-orange-100 text-orange-800 border-orange-300';
        case 'high':
            return 'bg-red-100 text-red-800 border-red-300';
        case 'normal':
            return 'bg-green-50 text-green-800 border-green-200';
        default:
            return '';
    }
};
