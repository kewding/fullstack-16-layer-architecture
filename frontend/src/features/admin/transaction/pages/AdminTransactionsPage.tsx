import React from 'react';
import { TypeBadge } from '../components/Badge';
import { transactions } from '../constants/mockTransactions';

export const AdminTransactionsPage: React.FC = () => {
  return (
    <div className="w-full h-screen flex bg-gray-600 overflow-hidden">

  {/* Sidebar */}
  <aside className="w-72 bg-gray-600 border-r px-6 py-32 flex flex-col gap-4">
    <div className="text-gray-200 text-xl">Dashboard</div>
    <div className="bg-gray-200 text-gray-600 rounded-2xl px-4 py-4 text-xl">
      Transactions
    </div>
    <div className="text-gray-200 text-xl">Users</div>
    <div className="text-gray-200 text-xl">Vendors</div>
    <div className="text-gray-200 text-xl">Settings & Privacy</div>
  </aside>

  {/* Main Content */}
  <main className="flex-1 bg-gray-200 rounded-l-[35px] p-10 flex flex-col">

    <h1 className="text-4xl font-semibold text-zinc-800 mb-10">
      Transactions
    </h1>

    {/* Filters */}
    <div className="flex justify-between items-center mb-6">
      <div className="flex gap-4">
        <button className="bg-orange-400 text-white px-5 py-3 rounded-2xl">
          All
        </button>
        <button className="px-5 py-3 rounded-2xl border">
          Purchases
        </button>
        <button className="px-5 py-3 rounded-2xl border">
          Top-ups
        </button>
        <button className="px-5 py-3 rounded-2xl border">
          Remittances
        </button>
      </div>

      <div className="flex gap-4">
        <div className="bg-white px-6 py-3 rounded-2xl border">
          Jan 1, 2026 - Feb 12, 2026
        </div>
        <button className="bg-slate-600 text-white px-6 py-3 rounded-2xl">
          Export
        </button>
      </div>
    </div>

    {/* Table Container */}
    <div className="bg-white rounded-2xl border overflow-hidden flex flex-col">

      {/* Table Header */}
      <div className="grid grid-cols-6 px-8 py-4 text-neutral-400 font-bold text-lg border-b">
        <div>Date</div>
        <div>Name</div>
        <div>Type</div>
        <div>Details</div>
        <div>Amount</div>
        <div>Status</div>
      </div>

      {/* Table Rows */}
      {transactions.map((tx, index) => (
        <div
          key={index}
          className="grid grid-cols-6 px-8 py-5 text-zinc-800 text-lg border-b items-center"
        >
          <div>{tx.date}</div>
          <div>{tx.name}</div>
          <div>
            <TypeBadge type={tx.type} />
          </div>
          <div>{tx.details}</div>
          <div>{tx.amount}</div>
          <div className="text-green-600">{tx.status}</div>
        </div>
      ))}

    </div>

    {/* Pagination */}
    <div className="flex justify-between items-center mt-6 text-neutral-400 text-lg">
      <div>1–10 of 18 items</div>

      <div className="flex gap-4 items-center">
        <button className="px-4 py-2 border rounded-xl text-orange-400">
          Prev
        </button>

        <div className="w-12 h-12 flex items-center justify-center border border-orange-400 rounded-2xl text-orange-400 font-bold">
          1
        </div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
        <div>5</div>

        <button className="px-4 py-2 border rounded-xl text-orange-400">
          Next
        </button>
      </div>
    </div>

  </main>
</div>

  );
};
