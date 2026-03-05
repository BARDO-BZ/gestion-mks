"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/Icon";

interface Notification {
  id: number;
  type: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data || []);
      setUnreadCount(json.unreadCount || 0);
    } catch {
      // silencioso
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      credentials: "include",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);
  };

  // Cierra el panel al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carga inicial + polling cada 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) fetchNotifications();
        }}
        className="relative p-1 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-blue-500 hover:underline"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className="flex flex-col max-h-80 overflow-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Sin notificaciones
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 text-sm ${!n.read_at ? "bg-blue-50" : ""}`}
                >
                  <p className={`${!n.read_at ? "font-medium" : "text-gray-700"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
