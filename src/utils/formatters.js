export const formatNumber = (num) => {
    if (!num) return '0';

    // Parse if string
    const n = typeof num === 'string' ? parseFloat(num.replace(/[^0-9.]/g, '')) : num;

    if (isNaN(n)) return '0';

    if (n >= 1000000) {
        return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (n >= 1000) {
        return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }

    return n.toString();
};
