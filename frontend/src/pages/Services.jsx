export default function Services() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Meus Serviços</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + Novo
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
        <p>Nenhum serviço cadastrado.</p>
      </div>
    </div>
  );
}

