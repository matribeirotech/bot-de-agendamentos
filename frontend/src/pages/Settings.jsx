import { useState, useEffect } from 'react';
import { Eye, EyeOff, QrCode } from 'lucide-react';

export default function Settings() {
  const [workerStatus, setWorkerStatus] = useState({ connected: false, qr: '' });
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Poll the worker API every 2 seconds to check status and get QR
    const checkWorkerStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/status');
        if (response.ok) {
          const data = await response.json();
          setWorkerStatus(data);
        }
      } catch (error) {
        // Worker might be offline
        setWorkerStatus({ connected: false, qr: '' });
      }
    };

    checkWorkerStatus();
    const interval = setInterval(checkWorkerStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800 tracking-tight">Configurações & Integrações</h2>
      
      {/* Google Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-slate-800">Google Calendar</h3>
            <p className="text-sm text-slate-500 mt-1">Sincronize sua agenda para evitar conflitos de horários.</p>
          </div>
          <button className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            Conectar
          </button>
        </div>
      </div>

      {/* WhatsApp Bot */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-lg text-slate-800">WhatsApp Bot</h3>
            <p className="text-sm text-slate-500 mt-1">Atenda seus clientes de forma automática 24h.</p>
          </div>
          {workerStatus.connected ? (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-full">
              Conectado
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-full">
              Desconectado
            </span>
          )}
        </div>

        {workerStatus.connected ? (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-emerald-800">Bot Online</p>
              <p className="text-sm text-emerald-600">Seu WhatsApp está conectado e respondendo aos clientes.</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center min-h-[250px]">
            {!workerStatus.qr ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                <p className="text-slate-500 font-medium">Aguardando o QR Code do Worker...</p>
                <p className="text-slate-400 text-sm mt-1">Certifique-se de que o <code>npm start</code> está rodando no terminal.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="flex justify-between items-center w-full max-w-sm mb-4">
                  <span className="font-medium text-slate-700">QR Code de Conexão</span>
                  <button 
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {showQR ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showQR ? 'Ocultar' : 'Revelar'}
                  </button>
                </div>
                
                {showQR ? (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-200">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(workerStatus.qr)}`} 
                      alt="WhatsApp QR Code"
                      className="w-56 h-56"
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 bg-slate-200/50 rounded-xl flex items-center justify-center border border-slate-200 backdrop-blur-sm">
                    <QrCode className="w-12 h-12 text-slate-400" />
                  </div>
                )}
                
                <p className="text-slate-500 text-sm mt-4 text-center max-w-xs">
                  Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera para o QR Code acima.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

