import { useAuth } from "@/contexts/AuthContext";
import { mockIssues } from "@/data/mock-issues";
import StatusBadge from "@/components/StatusBadge";
import { AlertTriangle, MapPin, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const MunicipalEscalations = () => {
  const { user } = useAuth();
  const escalated = mockIssues.filter(
    (i) => i.city === user?.city && i.status === "Escalated"
  );

  return (
    <div className="civic-container civic-section">
      <h1 className="mb-2 flex items-center gap-2 text-h2 text-foreground">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        Escalated Issues
      </h1>
      <p className="mb-8 text-body text-muted-foreground">
        Issues unresolved for more than 7 days in {user?.city}
      </p>

      {escalated.length > 0 ? (
        <div className="space-y-4">
          {escalated.map((issue) => (
            <div
              key={issue.id}
              className="rounded-xl border border-l-4 border-l-destructive bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <img
                    src={issue.image}
                    alt={issue.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-body font-semibold text-foreground">{issue.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {issue.location}
                      </span>
                      <span className="rounded bg-secondary px-2 py-0.5 text-label">
                        {issue.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {issue.reporters} reporters
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {issue.escalatedAt && (
                    <span className="flex items-center gap-1 text-label text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Escalated{" "}
                      {new Date(issue.escalatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                  <StatusBadge status="Escalated" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card py-16 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-body-lg text-muted-foreground">
            No escalated issues. All departments are responding on time.
          </p>
        </div>
      )}
    </div>
  );
};

export default MunicipalEscalations;
