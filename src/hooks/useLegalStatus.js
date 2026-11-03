import { useEffect, useState } from "react";
import api from "../api/api";

// Які юридичні документи опублікував адмін (поки не ввімкнено — покупці їх не бачать).
// → { oferta: { published, version } }; до завантаження — усе вимкнено.
export default function useLegalStatus() {
  const [docs, setDocs] = useState({});
  useEffect(() => {
    let alive = true;
    api
      .get("/home/legal/status")
      .then(({ data }) => alive && setDocs(data.docs || {}))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return docs;
}
