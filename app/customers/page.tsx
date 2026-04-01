

const customers = [
  {
    id: 1,
    name: "Somchai Jaidee",
    email: "somchai@email.com",
    orders: 5,
    tier: "VIP",
  },
  {
    id: 2,
    name: "Mali Srisuk",
    email: "mali@email.com",
    orders: 2,
    tier: "Regular",
  },
  {
    id: 3,
    name: "Anan K.",
    email: "anan@email.com",
    orders: 1,
    tier: "New",
  },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
        <div>
          <p className="text-sm text-zinc-400">CRM</p>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Tier</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-zinc-800 text-zinc-200">
                  <td className="px-4 py-4">{customer.name}</td>
                  <td className="px-4 py-4">{customer.email}</td>
                  <td className="px-4 py-4">{customer.orders}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        customer.tier === "VIP"
                          ? "bg-purple-500/15 text-purple-400"
                          : customer.tier === "Regular"
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {customer.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    
  );
}