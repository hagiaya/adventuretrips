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
export const formatCurrency = (val) => {
    if (val === undefined || val === null) return 'Rp 0';
    const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) : val;
    if (isNaN(n)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(n);
};
