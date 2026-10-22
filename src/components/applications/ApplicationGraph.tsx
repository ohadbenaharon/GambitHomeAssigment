import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  Panel,
  ReactFlow,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Boxes, RotateCcw } from "lucide-react"
import { memo, useCallback, useMemo, useState } from "react"
import { CriticalityMeter } from "@/components/common/attributes"
import { CRIT_COLOR_VAR, CRITICALITY_LABEL } from "@/lib/labels"
import { APP_NODE_SIZE, RESOURCE_NODE_SIZE, radialLayout } from "@/lib/graphLayout"
import { cn } from "@/lib/utils"
import { useStore } from "@/state/storeContext"
import type { Application, Point, Resource } from "@/types"

type AppNodeData = { name: string; count: number }
type ResourceNodeData = { resource: Resource; highlighted: boolean }
type AppFlowNode = Node<AppNodeData, "application">
type ResourceFlowNode = Node<ResourceNodeData, "resource">
type FlowNode = AppFlowNode | ResourceFlowNode

/**
 * Edges are drawn centre to centre and nodes are opaque, so the line appears to
 * leave each node at whatever point faces the hub. One hidden handle in the
 * middle of every node is all React Flow needs for that.
 */
const centeredHandle = "!top-1/2 !left-1/2 !size-px !min-w-0 !min-h-0 !border-0 !bg-transparent !-translate-1/2"

const ApplicationNode = memo(function ApplicationNode({ data }: NodeProps<AppFlowNode>) {
  return (
    <div
      style={APP_NODE_SIZE}
      className="flex items-center gap-3 rounded-xl bg-white px-4 text-[#18202e] shadow-[0_0_0_6px_rgba(255,255,255,0.08)]"
    >
      <div className="bg-primary text-primary-foreground grid size-10 shrink-0 place-items-center rounded-lg">
        <Boxes className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold">{data.name}</div>
        <div className="text-xs text-[#5e6778]">
          {data.count} {data.count === 1 ? "resource" : "resources"}
        </div>
      </div>
      <Handle type="source" position={Position.Top} className={centeredHandle} isConnectable={false} />
    </div>
  )
})

const ResourceNode = memo(function ResourceNode({ data, selected }: NodeProps<ResourceFlowNode>) {
  const { resource: r, highlighted } = data
  return (
    <div
      style={{ ...RESOURCE_NODE_SIZE, borderLeftColor: CRIT_COLOR_VAR[r.criticality] }}
      className={cn(
        "bg-graph-node border-graph-node-border text-graph-text flex flex-col justify-center gap-1 rounded-lg border border-l-[3px] px-3 transition-[box-shadow,border-color]",
        (selected || highlighted) && "border-[#8ea0d9] shadow-[0_0_0_3px_rgba(142,160,217,0.25)]",
      )}
      title={`${r.name}: ${CRITICALITY_LABEL[r.criticality]} criticality, ${r.openIssues} open issues`}
    >
      <div className="flex items-center gap-2">
        <span className="truncate text-[13px] font-medium">{r.name}</span>
        {r.openIssues > 0 && (
          <span className="ml-auto shrink-0 rounded bg-[#c42b1c]/20 px-1.5 text-[11px] leading-[18px] font-medium text-[#ff9a8f]">
            {r.openIssues}
          </span>
        )}
      </div>
      <div className="text-graph-muted flex items-center gap-1.5 text-xs">
        <CriticalityMeter level={r.criticality} className="h-2.5" />
        <span className="truncate">
          {r.type}, {r.provider}
        </span>
      </div>
      <Handle type="target" position={Position.Top} className={centeredHandle} isConnectable={false} />
    </div>
  )
})

const nodeTypes = { application: ApplicationNode, resource: ResourceNode }

interface ApplicationGraphProps {
  application: Application
  highlightedId: string | null
  onSelectResource: (id: string | null) => void
  /**
   * The parent clears the saved layout and remounts this component (via `key`),
   * as it also does when membership changes, so local positions never need
   * syncing back from props.
   */
  onResetLayout: () => void
}

export function ApplicationGraph({
  application,
  highlightedId,
  onSelectResource,
  onResetLayout,
}: ApplicationGraphProps) {
  const { resourcesById, layouts, saveLayout } = useStore()
  const saved = layouts[application.id]
  const layout = useMemo(() => radialLayout(application, resourcesById), [application, resourcesById])

  /*
   * The nodes live in state and every change React Flow reports (position,
   * dimensions, selection) is applied with applyNodeChanges. That keeps each
   * node's `measured` size between renders. Rebuilding plain node objects on
   * every drag tick dropped it, so React Flow treated all nodes as unmeasured
   * and hid them until the drag ended.
   */
  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    const topLeft = (id: string, centre: Point, size: { width: number; height: number }) =>
      saved?.[id] ?? { x: centre.x - size.width / 2, y: centre.y - size.height / 2 }
    return [
      {
        id: application.id,
        type: "application",
        position: topLeft(application.id, layout.center, APP_NODE_SIZE),
        data: { name: application.name, count: layout.members.length },
        selectable: false,
      },
      ...layout.members.map(
        ({ resource, position }): ResourceFlowNode => ({
          id: resource.id,
          type: "resource",
          position: topLeft(resource.id, position, RESOURCE_NODE_SIZE),
          data: { resource, highlighted: false },
        }),
      ),
    ]
  })

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  )

  // Fresh data (renames, edited resources, highlight) is layered on top.
  // Spreading each node keeps its position and `measured`.
  const renderedNodes = useMemo(
    () =>
      nodes.map((n): FlowNode => {
        if (n.type === "application") {
          return { ...n, data: { name: application.name, count: layout.members.length } }
        }
        return {
          ...n,
          data: {
            resource: resourcesById.get(n.id) ?? n.data.resource,
            highlighted: n.id === highlightedId,
          },
        }
      }),
    [nodes, application.name, layout.members.length, resourcesById, highlightedId],
  )

  const edges = useMemo(
    (): Edge[] =>
      layout.members.map(({ resource }) => ({
        id: `${application.id}->${resource.id}`,
        source: application.id,
        target: resource.id,
        type: "straight",
        style: {
          stroke: resource.id === highlightedId ? "#8ea0d9" : "var(--graph-edge)",
          strokeWidth: resource.criticality === "critical" ? 2 : 1.25,
        },
      })),
    [application.id, layout.members, highlightedId],
  )

  return (
    <div className="bg-graph-bg h-full w-full">
      <ReactFlow
        nodes={renderedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        // Persist once per drag, not on every mouse move.
        onNodeDragStop={(_, __, dragged) => {
          const next: Record<string, Point> = Object.fromEntries(nodes.map((n) => [n.id, n.position]))
          for (const n of dragged) next[n.id] = n.position
          saveLayout(application.id, next)
        }}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
        minZoom={0.3}
        maxZoom={1.75}
        nodesConnectable={false}
        edgesFocusable={false}
        onNodeClick={(_, node) =>
          node.type === "resource" && onSelectResource(node.id === highlightedId ? null : node.id)
        }
        onPaneClick={() => onSelectResource(null)}
        colorMode="dark"
        aria-label={`Graph of ${application.name} and its resources`}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="var(--graph-dot)" />
        <Controls showInteractive={false} position="bottom-right" />
        <Panel position="top-left" className="text-graph-muted !m-4 text-xs">
          {saved ? "Custom layout, saved for this application." : "Drag nodes to rearrange them."}
        </Panel>
        {saved && (
          <Panel position="top-right" className="!m-3">
            <button
              type="button"
              onClick={onResetLayout}
              className="bg-graph-node border-graph-node-border text-graph-text focus-visible:ring-ring inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium outline-none hover:bg-[#24304a] focus-visible:ring-2"
            >
              <RotateCcw className="size-3.5" />
              Reset layout
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}
