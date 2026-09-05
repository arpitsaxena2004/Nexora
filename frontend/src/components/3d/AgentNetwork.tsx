import React from 'react';
import { AICore } from './AICore';
import { AgentNode, AgentStatus } from './AgentNode';

export interface AgentData {
  name: string;
  displayName: string;
  category: string;
  status: AgentStatus;
  position: [number, number, number];
}

interface AgentNetworkProps {
  agents: AgentData[];
  coreIntensity?: number;
  selectedAgent?: string | null;
  activeCategory?: string | null;
  onAgentClick?: (name: string) => void;
}

export const AgentNetwork: React.FC<AgentNetworkProps> = ({
  agents,
  coreIntensity = 0.9,
  selectedAgent = null,
  activeCategory = null,
  onAgentClick,
}) => {
  return (
    <group>
      {/* Central Intact AI Core / Globe Model */}
      <AICore
        intensity={coreIntensity}
        scale={1.1}
        activeCategory={activeCategory}
      />

      {/* Freely Floating Agent Nodes around the Globe */}
      {agents.map((agent) => (
        <AgentNode
          key={agent.name}
          name={agent.name}
          displayName={agent.displayName}
          position={agent.position}
          status={agent.status}
          category={agent.category}
          isSelected={selectedAgent === agent.name}
          onClick={() => onAgentClick?.(agent.name)}
        />
      ))}
    </group>
  );
};
