"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  field_of_study: string | null;
  country: string | null;
}

export default function CareerMap() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, field_of_study, country")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
    };

    void loadProfile();
  }, []);

  // Build map once profile is loaded
  useEffect(() => {
    if (profile) void buildCareerMap();
  }, [profile]);

  const buildCareerMap = async () => {
    try {
      setLoading(true);

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, program:programs(id, title, level)")
        .eq("student_id", profile!.id)
        .eq("is_active", true);

      const { data: credits } = await supabase
        .from("credits")
        .select("*")
        .eq("student_id", profile!.id);

      const generatedNodes: Node[] = [];
      const generatedEdges: Edge[] = [];

      // User node
      generatedNodes.push({
        id: "you",
        data: { label: `🎓 ${profile?.full_name ?? "Student"}` },
        position: { x: 0, y: 0 },
        style: {
          background: "#2563eb",
          color: "#fff",
          fontWeight: "bold",
          borderRadius: 10,
          padding: 12,
          width: 180,
        },
      });

      // Field of study node
      generatedNodes.push({
        id: "field-of-study",
        data: { label: `📘 ${profile?.field_of_study ?? "General Studies"}` },
        position: { x: 250, y: 0 },
        style: {
          background: "#7c3aed",
          color: "#fff",
          borderRadius: 10,
          padding: 10,
          width: 200,
          textAlign: "center",
        },
      });

      generatedEdges.push({
        id: "edge-you-field",
        source: "you",
        target: "field-of-study",
        animated: true,
      });

      // Program nodes
      enrollments?.forEach((enrollment, index) => {
        const program = Array.isArray(enrollment.program)
          ? enrollment.program[0]
          : enrollment.program;

        if (!program) return;

        const programId = `program-${enrollment.id}`;

        generatedNodes.push({
          id: programId,
          data: {
            label: (
              <div>
                <strong>{program.title}</strong>
                <div className="text-xs opacity-70">{program.level}</div>
              </div>
            ),
          },
          position: { x: 500, y: index * 100 - 50 },
          style: {
            background: "#f8fafc",
            border: "1px solid #cbd5f5",
            borderRadius: 8,
            width: 180,
          },
        });

        generatedEdges.push({
          id: `edge-field-${programId}`,
          source: "field-of-study",
          target: programId,
        });
      });

      // Credits node
      const totalCredits =
        credits?.reduce((sum, c) => sum + c.credits_earned, 0) ?? 0;

      generatedNodes.push({
        id: "credits",
        data: { label: `🏆 Credits: ${totalCredits}` },
        position: { x: 0, y: -100 },
        style: {
          background: "#16a34a",
          color: "#fff",
          fontWeight: "bold",
          borderRadius: 10,
          width: 150,
        },
      });

      generatedEdges.push({
        id: "e-credits-you",
        source: "credits",
        target: "you",
      });

      setNodes(generatedNodes);
      setEdges(generatedEdges);
    } catch (err) {
      console.error("Map building error:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAICareers = async () => {
    if (isGenerating || !profile) return;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-career-path",
        { body: { userId: profile.id } }
      );

      if (error) {
        const errorDetail = await error.context?.json();
        throw new Error(errorDetail?.error ?? error.message);
      }

      if (!data?.clusters) throw new Error("AI returned an empty roadmap.");

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      data.clusters.forEach((cluster: any, cIdx: number) => {
        const clusterId = `cluster-${cIdx}`;

        newNodes.push({
          id: clusterId,
          data: { label: `🏢 ${cluster.name}` },
          position: { x: 500, y: (cIdx - 1) * 220 },
          style: {
            background: "#1e293b",
            color: "#fff",
            fontWeight: "bold",
            width: 180,
            borderRadius: 8,
            padding: 10,
          },
        });

        newEdges.push({
          id: `e-field-${clusterId}`,
          source: "field-of-study",
          target: clusterId,
          animated: true,
        });

        cluster.roles.forEach((role: any, rIdx: number) => {
          const roleId = `role-${cIdx}-${rIdx}`;

          newNodes.push({
            id: roleId,
            data: {
              label: (
                <div className="text-left">
                  <div className="font-bold text-blue-700">{role.title}</div>
                  <div className="mt-1 rounded bg-orange-50 p-1 text-[10px] text-orange-600">
                    🚀 Learn: {role.bridge_skill}
                  </div>
                </div>
              ),
            },
            position: {
              x: 780,
              y: (cIdx - 1) * 220 + rIdx * 100 - 50,
            },
            style: {
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              width: 200,
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            },
          });

          newEdges.push({
            id: `e-${clusterId}-${roleId}`,
            source: clusterId,
            target: roleId,
          });
        });
      });

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
    } catch (err: any) {
      alert(`Failed to generate path: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="animate-pulse text-lg font-medium text-gray-600">
          Building your career brain...
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-gray-50">

      {/* Back Button */}
      <div className="absolute left-6 top-6 z-20">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* AI Generate Button */}
      <div className="absolute right-6 top-6 z-20">
        <button
          onClick={generateAICareers}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing...
            </span>
          ) : (
            "✨ Generate AI Career Path"
          )}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => {
          if (node.id.startsWith("role-")) {
            alert(
              `Exploring role... Here you could fetch salary, required skills, or internships in ${profile?.country}.`
            );
          }
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background gap={20} color="#e5e7eb" />
        <Controls />
        <MiniMap nodeStrokeWidth={3} />
      </ReactFlow>
    </div>
  );
}