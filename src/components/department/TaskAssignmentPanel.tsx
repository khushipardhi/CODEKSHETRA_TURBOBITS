"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Textarea } from "@/components/ui";

interface WorkerOption {
  id: string;
  name: string;
  role: string;
  zone: string;
  vehicle: string;
  status: string;
}

interface TaskAssignmentPanelProps {
  incidentId: string;
  departmentCode?: string;
  onAssign: (data: {
    workerId: string;
    workerName: string;
    priority: string;
    instructions: string;
  }) => void;
  onCancel: () => void;
}

export function TaskAssignmentPanel({
  incidentId,
  departmentCode,
  onAssign,
  onCancel,
}: TaskAssignmentPanelProps) {
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    async function fetchWorkers() {
      setLoading(true);
      try {
        const url = departmentCode
          ? `/api/department/${departmentCode}/workers/manage`
          : `/api/worker/roster`;
        const res = await fetch(url);
        if (res.ok) {
          const d = await res.json();
          setWorkers(d.workers || []);
          if (d.workers && d.workers.length > 0) {
            setWorkerId(d.workers[0].id);
          }
        }
      } catch (err) {
        console.error("[TaskAssignmentPanel] Failed to load workers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkers();
  }, [departmentCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return;
    const selectedWorker = workers.find((w) => w.id === workerId);
    onAssign({
      workerId,
      workerName: selectedWorker?.name || workerId,
      priority,
      instructions,
    });
  };

  return (
    <Card padding="md" className="border-accent/30 bg-accent/5">
      <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
        <span>👷</span> Assign Incident to Field Worker
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              Assigned Field Worker (TiDB Database)
            </label>
            {loading ? (
              <div className="text-xs text-slate-400 py-2">Loading active workers...</div>
            ) : (
              <select
                className="w-full bg-surface-1 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                required
              >
                {workers.length === 0 ? (
                  <option value="">No workers found in database</option>
                ) : (
                  workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.role} - {w.zone}) [{w.status}]
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">
              Priority
            </label>
            <select
              className="w-full bg-surface-1 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <Textarea
          label="Field Instructions & Site Notes"
          placeholder="e.g. Carry 50mm bitumen patch material and warn road users..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="accent" disabled={!workerId || loading}>
            Dispatch to Worker
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
