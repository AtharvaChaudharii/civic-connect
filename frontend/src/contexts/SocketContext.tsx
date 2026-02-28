import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

// ── Event name constants (must match backend) ──
export const SOCKET_EVENTS = {
    ISSUE_CREATED: "issue:created",
    ISSUE_UPVOTED: "issue:upvoted",
    ISSUE_COMMENTED: "issue:commented",
    TICKET_STATUS_CHANGED: "ticket:statusChanged",
    NOTIFICATION_NEW: "notification:new",
} as const;

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinIssueRoom: (issueId: string) => void;
    leaveIssueRoom: (issueId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    joinIssueRoom: () => { },
    leaveIssueRoom: () => { },
});

/**
 * Provides a Socket.IO connection scoped to the authenticated user.
 * Auto-connects when user logs in, auto-disconnects on logout.
 * The backend assigns rooms (user, city, department) on connect via JWT payload.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            // Disconnect on logout
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
            return;
        }

        const token = localStorage.getItem("civictrack_token");
        if (!token) return;

        // Connect to the same origin — Vite proxy forwards /socket.io to backend
        const socket = io({
            auth: { token },
            transports: ["websocket", "polling"],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socket.on("connect", () => {
            console.log("🔌 Socket connected:", socket.id);
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("🔌 Socket disconnected");
            setIsConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.warn("🔌 Socket connection error:", err.message);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [isAuthenticated, user?.id]);

    const joinIssueRoom = useCallback((issueId: string) => {
        socketRef.current?.emit("join:issue", issueId);
    }, []);

    const leaveIssueRoom = useCallback((issueId: string) => {
        socketRef.current?.emit("leave:issue", issueId);
    }, []);

    return (
        <SocketContext.Provider
            value={{
                socket: socketRef.current,
                isConnected,
                joinIssueRoom,
                leaveIssueRoom,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}
