"use client";
import { useEffect } from "react";

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    async function checkForUpdate() {
      if (document.visibilityState !== "visible") return;
      const reg = await navigator.serviceWorker.getRegistration();
      reg?.update().catch(() => {});
    }

    document.addEventListener("visibilitychange", checkForUpdate);
    checkForUpdate();

    return () => document.removeEventListener("visibilitychange", checkForUpdate);
  }, []);

  return null;
}
