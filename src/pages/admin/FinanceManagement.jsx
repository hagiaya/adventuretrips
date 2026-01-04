import React, { useState } from 'react';
import KYCManagement from './KYCManagement';
import WithdrawalManagement from './WithdrawalManagement';
import { ShieldCheck, Library, AlertCircle } from 'lucide-react';

const FinanceManagement = () => {
    return (
        <div className="font-sans space-y-12 pb-20">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900">Keuangan & Verifikasi</h1>
                <p className="text-gray-500 font-medium mt-1">Pusat kontrol untuk validasi identitas dan pencairan dana user.</p>
            </div>

            {/* WITHDRAWAL SECTION */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <div className="p-2 bg-pink-100 text-primary rounded-lg">
                        <Library size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Manajemen Penarikan</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Prioritas Utama</p>
                    </div>
                </div>
                <WithdrawalManagement />
            </section>


        </div>
    );
};

export default FinanceManagement;
