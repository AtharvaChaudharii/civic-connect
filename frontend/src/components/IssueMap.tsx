import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Issue } from "@/types";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const statusColors: Record<string, string> = {
  Pending: "#f59e0b",
  Ongoing: "#3b82f6",
  Resolved: "#16a34a",
  Escalated: "#ef4444",
};

function createIcon(status: string) {
  const color = statusColors[status] || "#6b7280";
  return L.divIcon({
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

interface IssueMapProps {
  issues: Issue[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (issue: Issue) => void;
  singlePin?: [number, number];
  draggablePin?: boolean;
  onPinMove?: (lat: number, lng: number) => void;
  /** Custom color function per issue — overrides status-based coloring */
  colorFn?: (issue: Issue) => string;
}

const IssueMap = ({
  issues,
  center = [18.5204, 73.8567],
  zoom = 12,
  height = "h-64",
  onMarkerClick,
  singlePin,
  draggablePin = false,
  onPinMove,
  colorFn,
}: IssueMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView(singlePin || center, singlePin ? 15 : zoom);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    if (singlePin) {
      const marker = L.marker(singlePin, { draggable: draggablePin }).addTo(map);
      if (draggablePin && onPinMove) {
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onPinMove(pos.lat, pos.lng);
        });
      }
    } else {
      issues.forEach((issue) => {
        const color = colorFn ? colorFn(issue) : undefined;
        const icon = color
          ? L.divIcon({
              html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>`,
              className: "",
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })
          : createIcon(issue.status);
        const marker = L.marker([issue.lat, issue.lng], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:180px">
            <strong style="font-size:13px">${issue.title}</strong>
            <p style="color:#6b7280;font-size:12px;margin:4px 0">${issue.location}</p>
            <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;color:white;background:${statusColors[issue.status]}">${issue.status}</span>
          </div>
        `);

        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(issue));
        }
      });

      if (issues.length > 0) {
        const group = L.featureGroup(
          issues.map((i) => L.marker([i.lat, i.lng]))
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [issues, center, zoom, singlePin, draggablePin]);

  return <div ref={mapRef} className={`${height} w-full rounded-xl z-0`} />;
};

export default IssueMap;
