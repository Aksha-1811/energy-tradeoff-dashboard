import { useEffect, useState } from "react";
import { EnergyApiResponse } from "../types/energy";
import { API_BASE } from "../constants/energy";

export function useEnergyData(sampleRows: number, seed: number) {
  const [data, setData] = useState<EnergyApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const url = `${API_BASE}/energy/tradeoff?seed=${seed}&sample_rows=${sampleRows}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`API failed: ${res.status}`);

      const json = (await res.json()) as EnergyApiResponse;
      setData(json);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    loading,
    errorMsg,
    loadData,
  };
}
