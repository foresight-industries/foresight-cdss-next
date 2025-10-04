// hooks/usePHIData.ts
import { useEffect, useRef } from "react";

// This hook stores PHI in memory only, never in stores
export function usePHIData<T>(key: string) {
  const dataRef = useRef<T | null>(null);

  const setPHIData = (data: T | null) => {
    dataRef.current = data;
  };

  const getPHIData = () => dataRef.current;

  // Clear on unmount
  useEffect(() => {
    return () => {
      dataRef.current = null;
    };
  }, []);

  return { setPHIData, getPHIData };
}

// Usage example
function PatientDetails() {
  const { setPHIData, getPHIData } =
    usePHIData<PatientRecord>("current-patient");

  useEffect(() => {
    fetchPatientData().then(setPHIData);
  }, []);

  const patient = getPHIData();
  // ...
}
