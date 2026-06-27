import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Loader2, AlertTriangle } from "lucide-react";
import "leaflet/dist/leaflet.css";
import api from "@/services/api";
import { fmtCurrency } from "@/utils/format";

/**
 * MapaCalor — Mapa de Calor georreferenciado do RN (RF20)
 *
 * Plota as obras com coordenadas cadastradas, coloridas pelo status de saúde
 * (Verde/Amarelo/Vermelho). Obras sem coordenadas dependem de geocodificação.
 */
interface PontoObra {
  id: string;
  titulo: string;
  municipio: string | null;
  saude: "VERDE" | "AMARELO" | "VERMELHO";
  status: string | null;
  valor: number;
  latitude: number;
  longitude: number;
}
interface MapaResp { pontos: PontoObra[]; total: number; }

const COR_SAUDE: Record<string, string> = {
  VERDE: "#16a34a",
  AMARELO: "#f59e0b",
  VERMELHO: "#e11d48",
};

// Centro aproximado do Rio Grande do Norte.
const CENTRO_RN: [number, number] = [-5.8, -36.6];

const MapaCalor = () => {
  const { data, isLoading, isError } = useQuery<MapaResp>({
    queryKey: ["mapa-calor"],
    queryFn: async () => (await api.get("/dashboard/mapa")).data,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mapa de Calor</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Obras georreferenciadas por status de saúde
            {data ? ` · ${data.total} obra(s) no mapa` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {Object.entries(COR_SAUDE).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1.5 text-slate-600">
              <span className="h-3 w-3 rounded-full" style={{ background: c }} />
              {k.charAt(0) + k.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 text-slate-300 animate-spin" /></div>
      )}
      {isError && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
          <p className="text-sm text-slate-500">Não foi possível carregar o mapa.</p>
        </div>
      )}

      {data && (
        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm" style={{ height: "70vh" }}>
          <MapContainer center={CENTRO_RN} zoom={7} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {data.pontos.map((p) => (
              <CircleMarker
                key={p.id}
                center={[p.latitude, p.longitude]}
                radius={9}
                pathOptions={{
                  color: COR_SAUDE[p.saude] || COR_SAUDE.VERDE,
                  fillColor: COR_SAUDE[p.saude] || COR_SAUDE.VERDE,
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">{p.titulo}</p>
                    <p className="text-slate-500">{p.municipio || "—"} · {p.status || "—"}</p>
                    <p className="text-slate-500">{fmtCurrency(p.valor)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {data && data.total === 0 && (
        <p className="text-center text-sm text-slate-400">
          Nenhuma obra com coordenadas cadastradas. A geocodificação dos municípios é o próximo passo.
        </p>
      )}
    </div>
  );
};

export default MapaCalor;
