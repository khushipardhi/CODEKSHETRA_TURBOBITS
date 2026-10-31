"use client";

import React, { useState } from "react";
import { Card, Button, Input, Textarea } from "@/components/ui";

interface TaskAssignmentPanelProps {
  incidentId: string;
  onAssign: (data: { workerId: string; priority: string; instructions: string }) => void;
  onCancel: () => void;
}

export function TaskAssignmentPanel({ incidentId, onAssign, onCancel }: TaskAssignmentPanelProps) {
  const [workerId, setWorkerId] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [instructions, setInstructions] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return;
    onAssign({ workerId, priority, instructions });
  };

  return (
    <Card padding="md" className="border-accent/30 bg-accent/5">
      <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
        <span>👷</span> Assign Task
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Worker / Team</label>
            <select 
              className="w-full bg-surface-1 border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              required
            >
              <option value="">Select worker...</option>
              <option value="team-alpha">Team Alpha (Available)</option>
              <option value="team-bravo">Team Bravo (Available)</option>
              <option value="w-102">John Doe (On Route)</option>
              <option value="w-105">Jane Smith (Available)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Priority</label>
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
          label="Task Instructions" 
          placeholder="Specific details for the worker..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="accent">Dispatch Task</Button>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
